<?php

namespace App\Services;

use App\Enums\WasteCategory;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Thin HTTP client for the FastAPI classification service.
 */
class MlClient
{
    public function __construct(
        private readonly string $baseUrl,
        private readonly ?string $apiKey,
        private readonly int $timeout,
    ) {}

    /**
     * The model also knows an "other" class (not organic/paper/plastic, e.g. a guitar).
     * Such a result is returned as `label = null`, `recognized = false`, so it is never
     * stored as a waste category.
     *
     * @return array{label: ?string, confidence: float, uncertain: bool, recognized: bool, probabilities: array<string, float>}
     *
     * @throws MlUnavailableException
     */
    public function predict(UploadedFile|string $image): array
    {
        [$contents, $filename] = $image instanceof UploadedFile
            ? [$image->getContent(), $image->getClientOriginalName() ?: 'photo.jpg']
            : [$image, 'photo.jpg'];

        try {
            $response = Http::baseUrl($this->baseUrl)
                ->timeout($this->timeout)
                ->acceptJson()
                ->withHeaders(array_filter(['X-API-Key' => $this->apiKey]))
                ->attach('file', $contents, $filename)
                ->post('/predict')
                ->throw();
        } catch (ConnectionException|RequestException $e) {
            Log::warning('ML service unavailable', ['error' => $e->getMessage()]);

            throw new MlUnavailableException('Layanan AI sedang tidak tersedia.', previous: $e);
        }

        $data = $response->json();
        $recognized = in_array($data['label'] ?? null, WasteCategory::values(), true);

        return [
            'label' => $recognized ? (string) $data['label'] : null,
            'confidence' => (float) $data['confidence'],
            'uncertain' => ! $recognized || (bool) ($data['uncertain'] ?? false),
            'recognized' => $recognized,
            'probabilities' => $data['probabilities'] ?? [],
        ];
    }

    /** Same as predict() but returns null instead of throwing. */
    public function tryPredict(UploadedFile|string $image): ?array
    {
        try {
            return $this->predict($image);
        } catch (MlUnavailableException) {
            return null;
        }
    }
}
