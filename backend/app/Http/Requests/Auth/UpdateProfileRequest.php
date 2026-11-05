<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($this->user()?->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'avatar' => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'name' => ['example' => 'Budi Santoso'],
            'email' => ['example' => 'budi@example.com'],
            'phone' => ['example' => '081234567890'],
            'avatar' => ['description' => 'Foto profil (opsional, multipart).'],
        ];
    }
}
