<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('title', 150);
            $table->text('description')->nullable();
            $table->string('photo_path');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('address')->nullable();
            // Final category chosen by the user (prefilled by the AI, may be overridden).
            $table->enum('category', ['organic', 'plastic', 'paper'])->index();
            // Raw AI guess, kept separately so we can measure real-world AI accuracy.
            $table->string('ai_label', 30)->nullable();
            $table->float('ai_confidence')->nullable();
            $table->boolean('ai_uncertain')->default(false);
            $table->enum('status', ['pending', 'in_progress', 'completed', 'rejected'])->default('pending')->index();
            $table->text('admin_note')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
