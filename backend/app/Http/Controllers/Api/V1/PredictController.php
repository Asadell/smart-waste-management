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
     *
     * @response 200 {"data": {"label": "plastic", "confidence": 0.94, "uncertain": false, "probabilities": {"organic": 0.02, "paper": 0.04, "plastic": 0.94}}}
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
