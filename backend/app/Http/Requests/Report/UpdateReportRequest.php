<?php

namespace App\Http\Requests\Report;

use App\Enums\WasteCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'photo' => ['sometimes', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
            'title' => ['sometimes', 'required', 'string', 'max:150'],
            'description' => ['sometimes', 'nullable', 'string', 'max:2000'],
            'latitude' => ['sometimes', 'required', 'numeric', 'between:-90,90'],
            'longitude' => ['sometimes', 'required', 'numeric', 'between:-180,180'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'required', Rule::enum(WasteCategory::class)],
            // AI result for a replaced photo (ignored when no new photo is sent).
            'ai_label' => ['nullable', Rule::enum(WasteCategory::class)],
            'ai_confidence' => ['nullable', 'numeric', 'between:0,1'],
            'ai_uncertain' => ['nullable', 'boolean'],
        ];
    }
}
