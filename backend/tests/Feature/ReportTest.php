<?php

namespace Tests\Feature;

use App\Enums\ReportStatus;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    private function payload(array $overrides = []): array
    {
        return [
            'photo' => UploadedFile::fake()->image('sampah.jpg', 1600, 1200),
            'title' => 'Sampah plastik di taman',
            'description' => 'Menumpuk sejak kemarin',
            'latitude' => -7.2756,
            'longitude' => 112.7426,
            'address' => 'Jl. Raya ITS, Surabaya',
            'category' => 'plastic',
            'ai_label' => 'plastic',
            'ai_confidence' => 0.93,
            ...$overrides,
        ];
    }

    public function test_user_can_create_report_with_photo(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->postJson('/api/v1/reports', $this->payload());

        $res->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.category', 'plastic')
            ->assertJsonPath('data.ai_label', 'plastic')
            ->assertJsonPath('data.status_logs.0.to_status', 'pending');

        $report = Report::first();
        Storage::disk('public')->assertExists($report->photo_path);
        $this->assertSame($user->id, $report->user_id);
    }

    public function test_backend_calls_ml_when_ai_label_missing(): void
    {
        Http::fake(['*/predict' => Http::response(['label' => 'paper', 'confidence' => 0.88, 'uncertain' => false, 'probabilities' => []])]);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/reports', $this->payload(['ai_label' => null, 'ai_confidence' => null, 'category' => 'plastic']))
            ->assertCreated()
            ->assertJsonPath('data.ai_label', 'paper')
            ->assertJsonPath('data.category', 'plastic')
            ->assertJsonPath('data.ai_match', false);
    }

    public function test_report_is_still_saved_when_ml_is_down(): void
    {
        Http::fake(['*/predict' => Http::response(null, 500)]);
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/v1/reports', $this->payload(['ai_label' => null, 'ai_confidence' => null]))
            ->assertCreated()
            ->assertJsonPath('data.ai_label', null);
    }

    public function test_create_report_validates_required_fields(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/reports', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photo', 'title', 'latitude', 'longitude', 'category']);
    }

    public function test_user_only_sees_own_reports_and_admin_sees_all(): void
    {
        $user = User::factory()->create();
        Report::factory()->count(2)->for($user)->create();
        Report::factory()->count(3)->create();

        $this->actingAs($user)->getJson('/api/v1/reports')->assertOk()->assertJsonCount(2, 'data');
        $this->actingAs(User::factory()->admin()->create())->getJson('/api/v1/reports')->assertOk()->assertJsonCount(5, 'data');
    }

    public function test_user_cannot_view_other_users_report(): void
    {
        $report = Report::factory()->create();

        $this->actingAs(User::factory()->create())->getJson("/api/v1/reports/{$report->id}")->assertForbidden();
    }

    public function test_reports_can_be_filtered_and_searched(): void
    {
        $admin = User::factory()->admin()->create();
        Report::factory()->create(['title' => 'Botol plastik di sungai', 'category' => 'plastic']);
        Report::factory()->create(['title' => 'Kardus bekas', 'category' => 'paper', 'status' => ReportStatus::Completed]);

        $this->actingAs($admin)->getJson('/api/v1/reports?search=BOTOL')->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.title', 'Botol plastik di sungai');
        $this->actingAs($admin)->getJson('/api/v1/reports?status=completed')->assertJsonCount(1, 'data');
        $this->actingAs($admin)->getJson('/api/v1/reports?category=plastic')->assertJsonCount(1, 'data');
        $this->actingAs($admin)->getJson('/api/v1/reports?per_page=1')->assertJsonPath('meta.total', 2);
    }

    public function test_owner_can_update_pending_report_but_not_processed_one(): void
    {
        $user = User::factory()->create();
        $pending = Report::factory()->for($user)->create();
        $processed = Report::factory()->for($user)->status(ReportStatus::InProgress)->create();

        $this->actingAs($user)->putJson("/api/v1/reports/{$pending->id}", ['title' => 'Judul baru'])
            ->assertOk()->assertJsonPath('data.title', 'Judul baru');

        $this->actingAs($user)->putJson("/api/v1/reports/{$processed->id}", ['title' => 'Judul baru'])
            ->assertForbidden();
    }

    public function test_replacing_photo_updates_ai_result(): void
    {
        Http::fake(['*/predict' => Http::response(['label' => 'paper', 'confidence' => 0.81, 'uncertain' => false, 'probabilities' => []])]);
        $user = User::factory()->create();
        $report = Report::factory()->for($user)->create(['category' => 'plastic', 'ai_label' => 'plastic']);

        $this->actingAs($user)
            ->post("/api/v1/reports/{$report->id}", [
                '_method' => 'PUT',
                'photo' => UploadedFile::fake()->image('baru.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('data.ai_label', 'paper')
            ->assertJsonPath('data.category', 'plastic');

        // Editing text only keeps the previous AI result.
        $this->actingAs($user)->putJson("/api/v1/reports/{$report->id}", ['title' => 'Judul baru saja', 'ai_label' => 'organic'])
            ->assertOk()->assertJsonPath('data.ai_label', 'paper');
    }

    public function test_owner_can_soft_delete_pending_report(): void
    {
        $user = User::factory()->create();
        $report = Report::factory()->for($user)->create();

        $this->actingAs($user)->deleteJson("/api/v1/reports/{$report->id}")->assertOk();
        $this->assertSoftDeleted($report);
    }

    public function test_admin_updates_status_and_log_is_written(): void
    {
        $admin = User::factory()->admin()->create();
        $report = Report::factory()->create();

        $this->actingAs($admin)
            ->patchJson("/api/v1/reports/{$report->id}/status", ['status' => 'in_progress', 'note' => 'Petugas berangkat'])
            ->assertOk()
            ->assertJsonPath('data.status', 'in_progress')
            ->assertJsonPath('data.status_logs.0.from_status', 'pending')
            ->assertJsonPath('data.status_logs.0.changed_by.id', $admin->id);

        $this->assertDatabaseHas('report_status_logs', [
            'report_id' => $report->id, 'from_status' => 'pending', 'to_status' => 'in_progress', 'changed_by' => $admin->id,
        ]);
    }

    public function test_rejecting_requires_note(): void
    {
        $report = Report::factory()->create();

        $this->actingAs(User::factory()->admin()->create())
            ->patchJson("/api/v1/reports/{$report->id}/status", ['status' => 'rejected'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('note');
    }

    public function test_regular_user_cannot_update_status(): void
    {
        $user = User::factory()->create();
        $report = Report::factory()->for($user)->create();

        $this->actingAs($user)
            ->patchJson("/api/v1/reports/{$report->id}/status", ['status' => 'completed'])
            ->assertForbidden();
    }

    public function test_predict_proxies_to_ml_service(): void
    {
        Http::fake(['*/predict' => Http::response(['label' => 'organic', 'confidence' => 0.97, 'uncertain' => false, 'probabilities' => ['organic' => 0.97]])]);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/predict', ['file' => UploadedFile::fake()->image('a.jpg')])
            ->assertOk()
            ->assertJsonPath('data.label', 'organic')
            ->assertJsonPath('data.recognized', true);
    }

    public function test_predict_reports_unrecognized_photo_when_model_says_other(): void
    {
        Http::fake(['*/predict' => Http::response(['label' => 'other', 'confidence' => 0.95, 'uncertain' => false, 'probabilities' => ['other' => 0.95]])]);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/predict', ['file' => UploadedFile::fake()->image('guitar.jpg')])
            ->assertOk()
            ->assertJsonPath('data.label', null)
            ->assertJsonPath('data.recognized', false)
            ->assertJsonPath('data.uncertain', true);
    }

    public function test_report_with_unrecognized_photo_is_saved_without_ai_label(): void
    {
        Http::fake(['*/predict' => Http::response(['label' => 'other', 'confidence' => 0.9, 'uncertain' => false, 'probabilities' => []])]);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/reports', $this->payload(['ai_label' => null, 'ai_confidence' => null]))
            ->assertCreated()
            ->assertJsonPath('data.ai_label', null)
            ->assertJsonPath('data.ai_uncertain', true);
    }

    public function test_predict_returns_503_when_ml_is_down(): void
    {
        Http::fake(['*/predict' => Http::response(null, 500)]);

        $this->actingAs(User::factory()->create())
            ->postJson('/api/v1/predict', ['file' => UploadedFile::fake()->image('a.jpg')])
            ->assertStatus(503);
    }
}
