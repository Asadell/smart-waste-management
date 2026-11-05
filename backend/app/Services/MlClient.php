<?php

namespace App\Services;

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
     * @return array{label: string, confidence: float, uncertain: bool, probabilities: array<string, float>}
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

        return [
            'label' => (string) $data['label'],
            'confidence' => (float) $data['confidence'],
            'uncertain' => (bool) ($data['uncertain'] ?? false),
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
