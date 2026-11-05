<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_user_cannot_access_user_management(): void
    {
        $this->actingAs(User::factory()->create())->getJson('/api/v1/users')->assertForbidden();
    }

    public function test_admin_can_list_and_search_users(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->create(['name' => 'Siti Aminah']);
        User::factory()->create(['name' => 'Andi']);

        $this->actingAs($admin)->getJson('/api/v1/users?search=siti')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.name', 'Siti Aminah');
        $this->actingAs($admin)->getJson('/api/v1/users?role=admin')->assertJsonCount(1, 'data');
    }

    public function test_admin_can_create_update_and_delete_user(): void
    {
        $admin = User::factory()->admin()->create();

        $id = $this->actingAs($admin)->postJson('/api/v1/users', [
            'name' => 'Petugas', 'email' => 'petugas@swm.test', 'role' => 'admin', 'password' => 'password123',
        ])->assertCreated()->json('data.id');

        $this->actingAs($admin)->putJson("/api/v1/users/{$id}", ['name' => 'Petugas Baru'])
            ->assertOk()->assertJsonPath('data.name', 'Petugas Baru');

        $this->actingAs($admin)->deleteJson("/api/v1/users/{$id}")->assertOk();
        $this->assertDatabaseMissing('users', ['id' => $id]);
    }

    public function test_toggle_active_revokes_tokens(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();
        $user->createToken('mobile');

        $this->actingAs($admin)->patchJson("/api/v1/users/{$user->id}/toggle-active")
            ->assertOk()->assertJsonPath('data.is_active', false);

        $this->assertSame(0, $user->tokens()->count());
    }

    public function test_admin_can_reset_user_password(): void
    {
        $admin = User::factory()->admin()->create();
        $user = User::factory()->create();

        $this->actingAs($admin)->patchJson("/api/v1/users/{$user->id}/reset-password", ['password' => 'resetpass1'])->assertOk();

        $this->postJson('/api/v1/auth/login', ['email' => $user->email, 'password' => 'resetpass1'])->assertOk();
    }

    public function test_admin_cannot_delete_or_deactivate_self(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)->deleteJson("/api/v1/users/{$admin->id}")->assertUnprocessable();
        $this->actingAs($admin)->patchJson("/api/v1/users/{$admin->id}/toggle-active")->assertUnprocessable();
    }
}
