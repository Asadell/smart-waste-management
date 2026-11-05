<?php

namespace App\Services;

use Database\Seeders\ReportSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;

/**
 * Stores uploaded photos on the public disk. Images are re-encoded to JPEG and
 * scaled down, which also strips EXIF data and anything smuggled inside the file.
 */
class PhotoStorage
{
    private const MAX_SIZE = 1280;

    public function __construct(private readonly ImageManager $images) {}

    /** @return array{path: string, contents: string} */
    public function store(UploadedFile $file, string $directory = 'reports'): array
    {
        $contents = (string) $this->images->read($file->getRealPath())
            ->orient()
            ->scaleDown(self::MAX_SIZE, self::MAX_SIZE)
            ->toJpeg(85);

        $path = $directory.'/'.Str::uuid().'.jpg';
        Storage::disk('public')->put($path, $contents);

        return ['path' => $path, 'contents' => $contents];
    }

    public function delete(?string $path): void
    {
        // Seeded demo photos are shared by several reports, never delete them.
        if ($path && ! str_starts_with($path, ReportSeeder::PHOTO_DIR.'/')) {
            Storage::disk('public')->delete($path);
        }
    }
}
