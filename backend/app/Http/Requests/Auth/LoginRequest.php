<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'client' => ['nullable', 'in:web,mobile'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ];
    }

    public function bodyParameters(): array
    {
        return [
            'email' => ['example' => 'user@swm.test'],
            'password' => ['example' => 'password'],
            'client' => ['description' => '`web` atau `mobile`. Admin ditolak (403) bila `mobile`.', 'example' => 'web'],
            'device_name' => ['example' => 'Chrome'],
        ];
    }
}
