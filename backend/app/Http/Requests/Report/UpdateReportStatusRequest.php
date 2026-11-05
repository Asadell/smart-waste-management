<?php

namespace App\Http\Requests\Report;

use App\Enums\ReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(ReportStatus::class)],
            'note' => [Rule::requiredIf($this->input('status') === ReportStatus::Rejected->value), 'nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return ['note.required' => 'Catatan wajib diisi saat menolak laporan.'];
    }

    public function bodyParameters(): array
    {
        return [
            'status' => ['example' => 'in_progress'],
            'note' => ['description' => 'Wajib bila status `rejected`.', 'example' => 'Petugas menuju lokasi.'],
        ];
    }
}
