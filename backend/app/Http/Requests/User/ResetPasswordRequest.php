<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'password' => ['required', Password::min(8)],
        ];
    }

    public function bodyParameters(): array
    {
        return ['password' => ['description' => 'Password baru, min 8 karakter.', 'example' => 'newpassword123']];
    }
}
