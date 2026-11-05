<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_always_creates_regular_user(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi',
            'email' => 'budi@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin', // must be ignored
        ]);

        $res->assertCreated()
            ->assertJsonPath('data.user.role', 'user')
            ->assertJsonStructure(['data' => ['token', 'token_type', 'user' => ['id', 'email']]]);
    }

    public function test_register_validates_input(): void
    {
        $this->postJson('/api/v1/auth/register', ['email' => 'bukan-email'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['name', 'email', 'password']);
    }

    public function test_login_returns_token(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'salah'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('email');
    }

    public function test_admin_cannot_login_from_mobile(): void
    {
        $admin = User::factory()->admin()->create();

        $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'password', 'client' => 'mobile'])
            ->assertForbidden();

        $this->postJson('/api/v1/auth/login', ['email' => $admin->email, 'password' => 'password', 'client' => 'web'])
            ->assertOk();
    }

    public function test_inactive_user_cannot_login(): void
    {
        $user = User::factory()->inactive()->create();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'password'])
            ->assertForbidden();
    }

    public function test_logout_revokes_token(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $this->withToken($token)->postJson('/api/v1/auth/logout')->assertOk();
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_change_password_requires_current_password(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->putJson('/api/v1/auth/password', [
            'current_password' => 'salah',
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $current = $user->createToken('current')->plainTextToken;
        $user->createToken('other-device');
        $this->app['auth']->forgetGuards();

        $this->withToken($current)->putJson('/api/v1/auth/password', [
            'current_password' => 'password',
            'password' => 'newpassword1',
            'password_confirmation' => 'newpassword1',
        ])->assertOk();

        // Other devices are signed out, the current token keeps working.
        $this->assertSame(1, $user->tokens()->count());
    }

    public function test_protected_routes_require_token(): void
    {
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->getJson('/api/v1/reports')->assertUnauthorized();
    }
}
