<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReportStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Report\IndexReportRequest;
use App\Http\Requests\Report\StoreReportRequest;
use App\Http\Requests\Report\UpdateReportRequest;
use App\Http\Requests\Report\UpdateReportStatusRequest;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Services\MlClient;
use App\Services\PhotoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * @group Reports
 *
 * User hanya melihat dan mengelola laporan miliknya. Admin melihat semua laporan.
 */
class ReportController extends Controller
{
    /**
     * Daftar laporan
     *
     * @apiResourceCollection App\Http\Resources\ReportResource
     *
     * @apiResourceModel App\Models\Report with=user paginate=10
     */
    public function index(IndexReportRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $filters = $request->validated();

        if (! $user->isAdmin()) {
            unset($filters['user_id']);
        }

        $reports = Report::query()
            ->with('user')
            ->visibleTo($user)
            ->filter($filters)
            ->sorted($filters['sort'] ?? null)
            ->paginate($filters['per_page'] ?? 10)
            ->withQueryString();

        return ReportResource::collection($reports);
    }

    /**
     * Buat laporan
     *
     * Kalau `ai_label` kosong, backend memanggil layanan ML sendiri. Kalau ML
     * sedang mati, laporan tetap tersimpan dengan `ai_label = null`.
     */
    public function store(StoreReportRequest $request, PhotoStorage $photos, MlClient $ml): JsonResponse
    {
        $data = $request->safe()->except('photo');
        $photo = $photos->store($request->file('photo'));

        if (empty($data['ai_label'])) {
            $prediction = $ml->tryPredict($photo['contents']);
            $data['ai_label'] = $prediction['label'] ?? null;
            $data['ai_confidence'] = $prediction['confidence'] ?? null;
            $data['ai_uncertain'] = $prediction['uncertain'] ?? false;
        }

        $report = DB::transaction(function () use ($request, $data, $photo) {
            $report = $request->user()->reports()->create([
                ...$data,
                'photo_path' => $photo['path'],
                'status' => ReportStatus::Pending,
            ]);

            $report->statusLogs()->create([
                'changed_by' => $request->user()->id,
                'from_status' => null,
                'to_status' => ReportStatus::Pending,
                'note' => 'Laporan dibuat.',
            ]);

            return $report;
        });

        return $this->detail($report, 'Laporan berhasil dibuat.', 201);
    }

    /**
     * Detail laporan
     *
     * Termasuk riwayat perubahan status.
     */
    public function show(Report $report): JsonResponse
    {
        Gate::authorize('view', $report);

        return $this->detail($report);
    }

    /**
     * Update laporan
     *
     * Pemilik hanya bisa mengubah laporan yang masih `pending`. Kirim sebagai
     * `POST` + `_method=PUT` bila menyertakan foto (multipart).
     */
    public function update(UpdateReportRequest $request, Report $report, PhotoStorage $photos, MlClient $ml): JsonResponse
    {
        Gate::authorize('update', $report);

        $data = $request->safe()->except(['photo', 'ai_label', 'ai_confidence', 'ai_uncertain']);

        if ($request->hasFile('photo')) {
            $old = $report->photo_path;
            $photo = $photos->store($request->file('photo'));
            $data['photo_path'] = $photo['path'];
            $photos->delete($old);

            // A new photo means a new AI guess: use the client's result, or ask the ML service.
            $prediction = $request->filled('ai_label')
                ? ['label' => $request->input('ai_label'), 'confidence' => $request->input('ai_confidence'), 'uncertain' => $request->boolean('ai_uncertain')]
                : $ml->tryPredict($photo['contents']);
            $data['ai_label'] = $prediction['label'] ?? null;
            $data['ai_confidence'] = $prediction['confidence'] ?? null;
            $data['ai_uncertain'] = $prediction['uncertain'] ?? false;
        }

        $report->update($data);

        return $this->detail($report, 'Laporan diperbarui.');
    }

    /**
     * Hapus laporan
     *
     * Soft delete. Pemilik hanya bisa menghapus laporan `pending`.
     */
    public function destroy(Report $report): JsonResponse
    {
        Gate::authorize('delete', $report);

        $report->delete();

        return response()->json(['message' => 'Laporan dihapus.']);
    }

    /**
     * Update status (admin)
     *
     * Setiap perubahan dicatat di riwayat status.
     */
    public function updateStatus(UpdateReportStatusRequest $request, Report $report): JsonResponse
    {
        Gate::authorize('updateStatus', Report::class);

        $to = $request->enum('status', ReportStatus::class);
        $note = $request->input('note');

        DB::transaction(function () use ($request, $report, $to, $note) {
            $report->statusLogs()->create([
                'changed_by' => $request->user()->id,
                'from_status' => $report->status,
                'to_status' => $to,
                'note' => $note,
            ]);

            $report->update(['status' => $to, 'admin_note' => $note ?? $report->admin_note]);
        });

        return $this->detail($report, 'Status laporan diperbarui.');
    }

    private function detail(Report $report, ?string $message = null, int $status = 200): JsonResponse
    {
        $report->load(['user', 'statusLogs.changer']);

        return (new ReportResource($report))
            ->additional(array_filter(['message' => $message]))
            ->response()
            ->setStatusCode($status);
    }
}
