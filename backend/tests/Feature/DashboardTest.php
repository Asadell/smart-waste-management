<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_gets_global_stats(): void
    {
        Report::factory()->count(3)->create(['category' => 'plastic', 'ai_label' => 'plastic']);
        Report::factory()->status(ReportStatus::Completed)->create(['category' => 'paper', 'ai_label' => 'plastic']);

        $this->actingAs(User::factory()->admin()->create())
            ->getJson('/api/v1/dashboard/stats?days=7')
            ->assertOk()
            ->assertJsonPath('data.total_reports', 4)
            ->assertJsonPath('data.by_status.completed', 1)
            ->assertJsonPath('data.by_category.plastic', 3)
            ->assertJsonPath('data.ai_accuracy.matched', 3)
            ->assertJsonCount(7, 'data.trend');
    }

    public function test_user_only_gets_own_stats(): void
    {
        $user = User::factory()->create();
        Report::factory()->count(2)->for($user)->create();
        Report::factory()->count(5)->create();

        $this->actingAs($user)
            ->getJson('/api/v1/dashboard/stats')
            ->assertOk()
            ->assertJsonPath('data.total_reports', 2)
            ->assertJsonMissingPath('data.total_users');
    }
}
