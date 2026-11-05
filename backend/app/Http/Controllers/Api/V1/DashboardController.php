<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\ReportStatus;
use App\Enums\WasteCategory;
use App\Http\Controllers\Controller;
use App\Http\Resources\ReportResource;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

/**
 * @group Dashboard
 */
class DashboardController extends Controller
{
    /**
     * Statistik
     *
     * Admin mendapat statistik semua laporan, user mendapat statistik miliknya.
     *
     * @queryParam days integer Rentang tren: 7 atau 30. Example: 30
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $days = in_array((int) $request->input('days'), [7, 30], true) ? (int) $request->input('days') : 30;
        $base = fn () => Report::query()->visibleTo($user);

        $byStatus = $base()->selectRaw('status, COUNT(*) as total')->groupBy('status')->pluck('total', 'status');
        $byCategory = $base()->selectRaw('category, COUNT(*) as total')->groupBy('category')->pluck('total', 'category');

        $since = Carbon::today()->subDays($days - 1);
        $daily = $base()
            ->where('created_at', '>=', $since)
            ->selectRaw('DATE(created_at) as day, COUNT(*) as total')
            ->groupByRaw('DATE(created_at)')
            ->pluck('total', 'day')
            ->mapWithKeys(fn ($total, $day) => [Carbon::parse($day)->toDateString() => (int) $total]);

        $trend = collect(range(0, $days - 1))->map(function (int $i) use ($since, $daily) {
            $date = $since->copy()->addDays($i)->toDateString();

            return ['date' => $date, 'total' => $daily[$date] ?? 0];
        });

        $data = [
            'total_reports' => (int) $byStatus->sum(),
            'by_status' => collect(ReportStatus::cases())->mapWithKeys(fn ($s) => [$s->value => (int) ($byStatus[$s->value] ?? 0)]),
            'by_category' => collect(WasteCategory::cases())->mapWithKeys(fn ($c) => [$c->value => (int) ($byCategory[$c->value] ?? 0)]),
            'trend' => $trend,
            'recent_reports' => ReportResource::collection($base()->with('user')->latest()->limit(5)->get()),
        ];

        if ($user->isAdmin()) {
            $data['total_users'] = User::where('role', 'user')->count();
            $data['active_users'] = User::where('role', 'user')->where('is_active', true)->count();
            $data['ai_accuracy'] = $this->aiAccuracy();
        }

        return response()->json(['data' => $data]);
    }

    /** Real-world AI accuracy: how often the AI guess equals the final category. */
    private function aiAccuracy(): array
    {
        $predicted = Report::whereNotNull('ai_label');
        $total = (clone $predicted)->count();
        $matched = (clone $predicted)->whereColumn('ai_label', 'category')->count();

        return [
            'total_predicted' => $total,
            'matched' => $matched,
            'rate' => $total ? round($matched / $total, 4) : null,
        ];
    }
}
