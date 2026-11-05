<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\ResetPasswordRequest;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * @group Users (admin)
 */
class UserController extends Controller
{
    /**
     * Daftar user
     *
     * @queryParam search string Cari nama/email. Example: budi
     * @queryParam role string `admin` atau `user`. Example: user
     * @queryParam is_active boolean Filter status aktif. Example: 1
     * @queryParam per_page integer Example: 10
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::query()
            ->withCount('reports')
            ->when($request->string('search')->toString(), function ($q, string $search) {
                $term = '%'.mb_strtolower($search).'%';
                $q->where(fn ($w) => $w->whereRaw('LOWER(name) LIKE ?', [$term])->orWhereRaw('LOWER(email) LIKE ?', [$term]));
            })
            ->when($request->input('role'), fn ($q, $role) => $q->where('role', $role))
            ->when($request->filled('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->latest()
            ->paginate(min((int) $request->input('per_page', 10), 100))
            ->withQueryString();

        return UserResource::collection($users);
    }

    /**
     * Tambah user
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        return (new UserResource($user))->additional(['message' => 'User dibuat.'])->response()->setStatusCode(201);
    }

    /**
     * Detail user
     */
    public function show(User $user): UserResource
    {
        return new UserResource($user->loadCount('reports'));
    }

    /**
     * Update user
     */
    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        if ($request->user()->is($user) && ($request->has('role') && $request->input('role') !== 'admin' || $request->has('is_active') && ! $request->boolean('is_active'))) {
            return response()->json(['message' => 'Anda tidak bisa menurunkan role atau menonaktifkan akun sendiri.'], 422);
        }

        $user->update($request->validated());

        return (new UserResource($user))->additional(['message' => 'User diperbarui.'])->response();
    }

    /**
     * Hapus user
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'Anda tidak bisa menghapus akun sendiri.'], 422);
        }

        $user->delete();

        return response()->json(['message' => 'User dihapus.']);
    }

    /**
     * Aktif / nonaktifkan user
     *
     * Menonaktifkan user juga mencabut semua token miliknya.
     */
    public function toggleActive(Request $request, User $user): JsonResponse
    {
        if ($request->user()->is($user)) {
            return response()->json(['message' => 'Anda tidak bisa menonaktifkan akun sendiri.'], 422);
        }

        $user->update(['is_active' => ! $user->is_active]);

        if (! $user->is_active) {
            $user->tokens()->delete();
        }

        return (new UserResource($user))
            ->additional(['message' => $user->is_active ? 'User diaktifkan.' : 'User dinonaktifkan.'])
            ->response();
    }

    /**
     * Reset password user
     *
     * Pengganti fitur lupa password (aplikasi tidak memakai email/SMTP).
     */
    public function resetPassword(ResetPasswordRequest $request, User $user): JsonResponse
    {
        $user->update(['password' => $request->validated('password')]);
        $user->tokens()->delete();

        return response()->json(['message' => 'Password user berhasil direset.']);
    }
}
