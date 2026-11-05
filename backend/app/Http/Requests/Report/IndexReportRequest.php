<?php

namespace App\Http\Requests\Report;

use App\Enums\ReportStatus;
use App\Enums\WasteCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::enum(ReportStatus::class)],
            'category' => ['nullable', Rule::enum(WasteCategory::class)],
            'user_id' => ['nullable', 'integer'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort' => ['nullable', 'string', 'max:30'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    public function queryParameters(): array
    {
        return [
            'search' => ['description' => 'Cari di judul, deskripsi, alamat.', 'example' => 'plastik'],
            'status' => ['example' => 'pending'],
            'category' => ['example' => 'plastic'],
            'user_id' => ['description' => 'Khusus admin: filter per pelapor.', 'example' => null],
            'date_from' => ['example' => '2026-11-01'],
            'date_to' => ['example' => '2026-11-30'],
            'sort' => ['description' => 'Kolom: created_at, updated_at, title, status, category. Awalan `-` untuk descending.', 'example' => '-created_at'],
            'page' => ['example' => 1],
            'per_page' => ['example' => 10],
        ];
    }
}
