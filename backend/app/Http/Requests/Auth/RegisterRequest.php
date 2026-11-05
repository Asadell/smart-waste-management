<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'name' => ['example' => 'Budi Santoso'],
            'email' => ['example' => 'budi@example.com'],
            'phone' => ['example' => '081234567890'],
            'password' => ['example' => 'password123'],
            'password_confirmation' => ['description' => 'Harus sama dengan password.', 'example' => 'password123'],
            'device_name' => ['description' => 'Nama token (opsional).', 'example' => 'Pixel 7'],
        ];
    }
}
