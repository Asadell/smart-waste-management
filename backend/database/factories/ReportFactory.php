<?php

namespace Database\Factories;

use App\Enums\ReportStatus;
use App\Enums\WasteCategory;
use App\Models\Report;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Report>
 */
class ReportFactory extends Factory
{
    public function definition(): array
    {
        $category = fake()->randomElement(WasteCategory::cases());
        // ~85% of the time the AI agrees with the final category.
        $aiLabel = fake()->boolean(85) ? $category : fake()->randomElement(WasteCategory::cases());

        return [
            'user_id' => User::factory(),
            'title' => fake()->randomElement(['Tumpukan sampah', 'Sampah berserakan', 'Timbunan sampah']).' '
                .['organic' => 'organik', 'plastic' => 'plastik', 'paper' => 'kertas'][$category->value]
                .' di Jl. '.fake()->streetName(),
            'description' => fake()->sentence(14),
            'photo_path' => 'reports/seed/'.$category->value.'/example.jpg',
            // Around Surabaya.
            'latitude' => fake()->latitude(-7.35, -7.20),
            'longitude' => fake()->longitude(112.65, 112.80),
            'address' => fake()->streetAddress().', Surabaya',
            'category' => $category,
            'ai_label' => $aiLabel->value,
            'ai_confidence' => fake()->randomFloat(3, 0.62, 0.99),
            'ai_uncertain' => false,
            'status' => ReportStatus::Pending,
        ];
    }

    public function status(ReportStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
