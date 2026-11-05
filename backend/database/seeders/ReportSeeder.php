<?php

namespace Database\Seeders;

use App\Enums\ReportStatus;
use App\Enums\UserRole;
use App\Enums\WasteCategory;
use App\Models\Report;
use App\Models\ReportStatusLog;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;

/**
 * Demo reports with real photos (Pexels, see photos/manifest.json),
 * real Surabaya locations and a plausible status history.
 */
class ReportSeeder extends Seeder
{
    /** Photos are copied once to the public disk under this folder and shared by reports. */
    public const PHOTO_DIR = 'reports/seed';

    private const TOTAL = 30;

    private const TEMPLATES = [
        'organic' => [
            ['Sisa sayur dan buah menumpuk di pinggir pasar', 'Sisa sayuran dan buah busuk dibuang di pinggir jalan dekat pasar, mulai berbau dan mengundang lalat.'],
            ['Buah busuk berserakan di lahan kosong', 'Banyak buah busuk dibuang di lahan kosong. Baunya menyengat sampai ke rumah warga.'],
            ['Sampah dapur dibuang di selokan', 'Sisa makanan dan kulit sayur dibuang ke selokan sehingga air tidak mengalir lancar.'],
            ['Sisa makanan menumpuk setelah acara warga', 'Sisa makanan dari acara warga belum diangkut sejak kemarin malam.'],
            ['Kulit buah dibuang sembarangan di taman', 'Kulit jeruk dan pisang berserakan di area duduk taman.'],
        ],
        'plastic' => [
            ['Botol plastik menumpuk di bantaran sungai', 'Botol dan kantong plastik tersangkut di bantaran sungai, berisiko menyumbat aliran saat hujan.'],
            ['Sampah plastik berserakan di lahan kosong', 'Kantong plastik dan kemasan makanan berserakan di lahan kosong, sepertinya dibuang warga sekitar.'],
            ['Botol plastik mengapung di saluran air', 'Puluhan botol plastik mengapung di saluran air depan perumahan.'],
            ['Tumpukan kemasan plastik di tepi jalan', 'Kemasan plastik bekas menumpuk di tepi jalan dan mulai tertiup ke badan jalan.'],
            ['Sampah plastik di pantai', 'Banyak botol plastik dan gelas sekali pakai di pasir pantai setelah akhir pekan.'],
        ],
        'paper' => [
            ['Tumpukan kardus bekas di depan toko', 'Kardus bekas dari toko ditumpuk di trotoar dan menghalangi pejalan kaki.'],
            ['Kertas dan koran bekas basah kena hujan', 'Tumpukan koran bekas dibiarkan di luar dan basah kena hujan.'],
            ['Kardus menumpuk di area TPS', 'Kardus bekas di TPS sudah penuh dan meluber ke jalan.'],
            ['Sampah kertas kantor berserakan', 'Kertas bekas dari kantor dibuang di samping gedung, berserakan tertiup angin.'],
            ['Kardus bekas dibuang di pinggir jalan', 'Beberapa kardus besar dibuang begitu saja di pinggir jalan.'],
        ],
    ];

    /** [address, latitude, longitude] around Surabaya. */
    private const LOCATIONS = [
        ['Jl. Raya ITS, Keputih, Sukolilo, Surabaya', -7.2819, 112.7953],
        ['Pasar Keputran, Jl. Keputran, Tegalsari, Surabaya', -7.2766, 112.7413],
        ['Jl. Kertajaya Indah, Mulyorejo, Surabaya', -7.2794, 112.7781],
        ['Taman Bungkul, Jl. Raya Darmo, Wonokromo, Surabaya', -7.2915, 112.7398],
        ['Jl. Ahmad Yani, Gayungan, Surabaya', -7.3289, 112.7309],
        ['Kali Mas, Jl. Ngagel, Wonokromo, Surabaya', -7.2963, 112.7432],
        ['Jl. Tunjungan, Genteng, Surabaya', -7.2614, 112.7389],
        ['Pantai Kenjeran, Bulak, Surabaya', -7.2386, 112.7967],
        ['Jl. Manyar Kertoarjo, Mulyorejo, Surabaya', -7.2802, 112.7636],
        ['Pasar Pucang Anom, Gubeng, Surabaya', -7.2896, 112.7553],
        ['Jl. Dharmahusada, Mojo, Gubeng, Surabaya', -7.2687, 112.7648],
        ['Jl. Rungkut Industri, Rungkut, Surabaya', -7.3311, 112.7594],
        ['Jl. Mayjen Sungkono, Dukuh Pakis, Surabaya', -7.2947, 112.7139],
        ['Jl. Kenjeran, Tambaksari, Surabaya', -7.2495, 112.7614],
        ['Jl. Wonokromo, Jagir, Surabaya', -7.3022, 112.7377],
    ];

    private const NOTES = [
        ReportStatus::InProgress->value => ['Petugas kebersihan sedang menuju lokasi.', 'Dijadwalkan pengangkutan hari ini.', 'Laporan diteruskan ke petugas wilayah.'],
        ReportStatus::Completed->value => ['Sampah sudah diangkut petugas.', 'Lokasi sudah dibersihkan.', 'Selesai ditangani bersama warga.'],
        ReportStatus::Rejected->value => ['Lokasi tidak ditemukan saat pengecekan.', 'Foto tidak sesuai dengan lokasi yang dilaporkan.', 'Laporan duplikat dengan laporan lain di lokasi yang sama.'],
    ];

    public function run(): void
    {
        $photos = $this->publishPhotos();
        $admin = User::where('role', UserRole::Admin)->firstOrFail();
        $users = User::where('role', UserRole::User)->where('is_active', true)->get();

        // Weighted so the dashboard shows every status.
        $statuses = [
            ReportStatus::Pending, ReportStatus::Pending, ReportStatus::Pending,
            ReportStatus::InProgress, ReportStatus::InProgress,
            ReportStatus::Completed, ReportStatus::Completed, ReportStatus::Completed,
            ReportStatus::Rejected,
        ];

        foreach (range(1, self::TOTAL) as $i) {
            $category = WasteCategory::cases()[$i % 3];
            [$title, $description] = Arr::random(self::TEMPLATES[$category->value]);
            [$address, $lat, $lng] = Arr::random(self::LOCATIONS);
            $status = $statuses[array_rand($statuses)];
            $createdAt = now()->subDays(random_int(0, 29))->setTime(random_int(6, 20), random_int(0, 59));
            if ($createdAt->isAfter(now()->subHour())) {
                $createdAt = now()->subMinutes(random_int(60, 180));
            }

            // AI agrees with the final category most of the time; sometimes the user corrected it.
            $aiLabel = random_int(1, 100) <= 85 ? $category : Arr::random(WasteCategory::cases());

            $report = Report::create([
                'user_id' => $users->random()->id,
                'title' => $title,
                'description' => $description,
                // Rotate so every curated photo is used.
                'photo_path' => $photos[$category->value][intdiv($i, 3) % count($photos[$category->value])],
                // Small jitter so markers do not overlap exactly on the map.
                'latitude' => $lat + random_int(-150, 150) / 100000,
                'longitude' => $lng + random_int(-150, 150) / 100000,
                'address' => $address,
                'category' => $category,
                'ai_label' => $aiLabel->value,
                'ai_confidence' => random_int(62, 99) / 100,
                'ai_uncertain' => false,
                'status' => $status,
            ]);
            $report->forceFill(['created_at' => $createdAt, 'updated_at' => $createdAt])->saveQuietly();

            $this->seedHistory($report, $status, $admin, $createdAt);
        }
    }

    /**
     * Copies the curated photos to the public disk.
     *
     * @return array<string, list<string>> category => storage paths
     */
    private function publishPhotos(): array
    {
        $paths = [];

        foreach (WasteCategory::cases() as $category) {
            $files = File::files(database_path("seeders/photos/{$category->value}"));

            foreach ($files as $file) {
                $path = self::PHOTO_DIR."/{$category->value}/{$file->getFilename()}";
                Storage::disk('public')->put($path, $file->getContents());
                $paths[$category->value][] = $path;
            }
        }

        return $paths;
    }

    private function seedHistory(Report $report, ReportStatus $final, User $admin, Carbon $createdAt): void
    {
        $this->log($report, null, ReportStatus::Pending, $report->user_id, 'Laporan dibuat.', $createdAt);

        $steps = match ($final) {
            ReportStatus::Pending => [],
            ReportStatus::InProgress => [ReportStatus::InProgress],
            ReportStatus::Completed => [ReportStatus::InProgress, ReportStatus::Completed],
            ReportStatus::Rejected => [ReportStatus::Rejected],
        };

        $from = ReportStatus::Pending;
        $at = $createdAt->copy();
        $note = null;

        foreach ($steps as $to) {
            $previous = $at;
            $at = $previous->copy()->addHours(random_int(2, 30));
            if ($at->isFuture()) {
                // Recent report: put the change halfway between the previous step and now.
                $at = $previous->copy()->addSeconds(intdiv((int) $previous->diffInSeconds(now()), 2));
            }
            $note = Arr::random(self::NOTES[$to->value]);
            $this->log($report, $from, $to, $admin->id, $note, $at);
            $from = $to;
        }

        if ($steps) {
            $report->forceFill(['admin_note' => $note, 'updated_at' => $at])->saveQuietly();
        }
    }

    private function log(Report $report, ?ReportStatus $from, ReportStatus $to, int $by, string $note, Carbon $at): void
    {
        ReportStatusLog::create([
            'report_id' => $report->id,
            'changed_by' => $by,
            'from_status' => $from,
            'to_status' => $to,
            'note' => $note,
            'created_at' => $at,
        ]);
    }
}
