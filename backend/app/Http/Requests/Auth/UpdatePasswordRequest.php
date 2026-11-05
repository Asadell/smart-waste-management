<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password:sanctum'],
            'password' => ['required', 'confirmed', 'different:current_password', Password::min(8)],
        ];
    }

    public function messages(): array
    {
        return ['current_password.current_password' => 'Password lama salah.'];
    }

    public function bodyParameters(): array
    {
        return [
            'current_password' => ['example' => 'password'],
            'password' => ['example' => 'newpassword123'],
            'password_confirmation' => ['description' => 'Harus sama dengan password.', 'example' => 'newpassword123'],
        ];
    }
}
