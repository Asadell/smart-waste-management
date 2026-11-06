<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\PredictRequest;
use App\Services\MlClient;
use App\Services\MlUnavailableException;
use Illuminate\Http\JsonResponse;

/**
 * @group AI
 */
class PredictController extends Controller
{
    /**
     * Prediksi kategori sampah
     *
     * Proxy ke layanan ML. Dipakai untuk preview sebelum laporan dikirim.
     * Bila `uncertain = true`, client sebaiknya meminta user memilih kategori.
     * Bila `recognized = false` (model menjawab `other`, mis. foto gitar), `label` bernilai null:
     * foto tidak dikenali sebagai sampah organik, kertas, atau plastik.
     *
     * @response 200 scenario="Dikenali" {"data": {"label": "plastic", "confidence": 0.94, "uncertain": false, "recognized": true, "probabilities": {"organic": 0.02, "other": 0.01, "paper": 0.03, "plastic": 0.94}}}
     * @response 200 scenario="Bukan sampah" {"data": {"label": null, "confidence": 0.96, "uncertain": true, "recognized": false, "probabilities": {"organic": 0.01, "other": 0.96, "paper": 0.02, "plastic": 0.01}}}
     * @response 503 {"message": "Layanan AI sedang tidak tersedia."}
     */
    public function __invoke(PredictRequest $request, MlClient $ml): JsonResponse
    {
        try {
            return response()->json(['data' => $ml->predict($request->file('file'))]);
        } catch (MlUnavailableException $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }
}
