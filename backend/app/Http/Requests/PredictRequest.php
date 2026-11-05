<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PredictRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['file' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240']];
    }

    public function bodyParameters(): array
    {
        return ['file' => ['description' => 'Foto sampah yang akan diklasifikasi.']];
    }
}
