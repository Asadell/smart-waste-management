<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::factory()->admin()->create([
            'name' => 'Admin SWM',
            'email' => 'admin@swm.test',
            'phone' => '081200000001',
        ]);

        User::factory()->create(['name' => 'Budi Santoso', 'email' => 'user@swm.test', 'phone' => '081234567890']);
        User::factory()->create(['name' => 'Siti Aminah', 'email' => 'siti@swm.test']);
        User::factory()->create(['name' => 'Andi Wijaya', 'email' => 'andi@swm.test']);
        User::factory()->inactive()->create(['name' => 'Rudi Hartono', 'email' => 'rudi@swm.test']);

        $this->call(ReportSeeder::class);
    }
}
