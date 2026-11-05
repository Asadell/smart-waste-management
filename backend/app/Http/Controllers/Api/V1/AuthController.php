<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\PhotoStorage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * @group Auth
 */
class AuthController extends Controller
{
    /**
     * Register
     *
     * Membuat akun baru (selalu role `user`) dan langsung mengembalikan token.
     *
     * @unauthenticated
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            ...$request->safe()->only(['name', 'email', 'phone', 'password']),
            'role' => 'user',
        ]);

        return $this->tokenResponse($user, $request->input('device_name', 'api'), 'Registrasi berhasil.', 201);
    }

    /**
     * Login
     *
     * Mengembalikan token Sanctum. Kirim `client=mobile` dari aplikasi mobile:
     * akun admin akan ditolak dengan 403.
     *
     * @unauthenticated
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! Hash::check($request->string('password'), $user->password)) {
            throw ValidationException::withMessages(['email' => 'Email atau password salah.']);
        }

        if (! $user->is_active) {
            return response()->json(['message' => 'Akun Anda dinonaktifkan. Hubungi admin.'], 403);
        }

        if ($request->input('client') === 'mobile' && $user->isAdmin()) {
            return response()->json(['message' => 'Akun admin hanya bisa login di web.'], 403);
        }

        return $this->tokenResponse($user, $request->input('device_name', $request->input('client', 'api')), 'Login berhasil.');
    }

    /**
     * Logout
     *
     * Mencabut token yang sedang dipakai.
     */
    public function logout(Request $request): JsonResponse
    {
        $token = $request->user()->currentAccessToken();

        if ($token instanceof PersonalAccessToken) {
            $token->delete();
        }

        return response()->json(['message' => 'Logout berhasil.']);
    }

    /**
     * Profil saya
     */
    public function me(Request $request): UserResource
    {
        return new UserResource($request->user());
    }

    /**
     * Update profil
     */
    public function updateProfile(UpdateProfileRequest $request, PhotoStorage $photos): JsonResponse
    {
        $user = $request->user();
        $data = $request->safe()->except('avatar');

        if ($request->hasFile('avatar')) {
            $photos->delete($user->avatar_path);
            $data['avatar_path'] = $photos->store($request->file('avatar'), 'avatars')['path'];
        }

        $user->update($data);

        return (new UserResource($user))->additional(['message' => 'Profil diperbarui.'])->response();
    }

    /**
     * Ganti password
     *
     * Token lain milik user dicabut, token yang sedang dipakai tetap aktif.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update(['password' => $request->string('password')]);
        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn ($q) => $q->whereKeyNot($current->getKey()))
            ->delete();

        return response()->json(['message' => 'Password berhasil diganti.']);
    }

    private function tokenResponse(User $user, string $deviceName, string $message, int $status = 200): JsonResponse
    {
        $token = $user->createToken($deviceName)->plainTextToken;

        return response()->json([
            'data' => [
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => new UserResource($user),
            ],
            'message' => $message,
        ], $status);
    }
}
