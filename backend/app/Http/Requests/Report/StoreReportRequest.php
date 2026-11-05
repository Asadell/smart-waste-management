<?php

namespace App\Http\Requests\Report;

use App\Enums\WasteCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'title' => ['required', 'string', 'max:150'],
            'description' => ['nullable', 'string', 'max:2000'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'address' => ['nullable', 'string', 'max:255'],
            'category' => ['required', Rule::enum(WasteCategory::class)],
            'ai_label' => ['nullable', Rule::enum(WasteCategory::class)],
            'ai_confidence' => ['nullable', 'numeric', 'between:0,1'],
            'ai_uncertain' => ['nullable', 'boolean'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'photo' => ['description' => 'Foto sampah (jpg/png/webp, maks 10MB).'],
            'title' => ['example' => 'Sampah plastik menumpuk di trotoar'],
            'description' => ['example' => 'Sudah 3 hari tidak diangkut.'],
            'latitude' => ['example' => -7.2756],
            'longitude' => ['example' => 112.7426],
            'address' => ['example' => 'Jl. Raya ITS, Sukolilo, Surabaya'],
            'category' => ['description' => 'Kategori final (hasil prefill AI, boleh diubah user).', 'example' => 'plastic'],
            'ai_label' => ['description' => 'Tebakan AI dari /predict. Bila kosong backend memanggil ML sendiri.', 'example' => 'plastic'],
            'ai_confidence' => ['example' => 0.94],
            'ai_uncertain' => ['example' => false],
        ];
    }
}
