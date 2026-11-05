<?php

namespace App\Models;

use App\Enums\ReportStatus;
use App\Enums\WasteCategory;
use Database\Factories\ReportFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

#[Fillable([
    'user_id', 'title', 'description', 'photo_path', 'latitude', 'longitude', 'address',
    'category', 'ai_label', 'ai_confidence', 'ai_uncertain', 'status', 'admin_note',
])]
class Report extends Model
{
    /** @use HasFactory<ReportFactory> */
    use HasFactory, SoftDeletes;

    protected $attributes = [
        'status' => 'pending',
        'ai_uncertain' => false,
    ];

    protected function casts(): array
    {
        return [
            'latitude' => 'float',
            'longitude' => 'float',
            'ai_confidence' => 'float',
            'ai_uncertain' => 'boolean',
            'category' => WasteCategory::class,
            'status' => ReportStatus::class,
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(ReportStatusLog::class)->latest('created_at')->latest('id');
    }

    public function photoUrl(): ?string
    {
        return $this->photo_path ? Storage::disk('public')->url($this->photo_path) : null;
    }

    /** Users only see their own reports; admins see everything. */
    public function scopeVisibleTo(Builder $query, User $user): Builder
    {
        return $user->isAdmin() ? $query : $query->where('user_id', $user->id);
    }

    /**
     * @param  array<string, mixed>  $filters
     */
    public function scopeFilter(Builder $query, array $filters): Builder
    {
        return $query
            ->when($filters['search'] ?? null, function (Builder $q, string $search) {
                $term = '%'.mb_strtolower($search).'%';
                $q->where(fn (Builder $w) => $w
                    ->whereRaw('LOWER(title) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(description) LIKE ?', [$term])
                    ->orWhereRaw('LOWER(address) LIKE ?', [$term]));
            })
            ->when($filters['status'] ?? null, fn (Builder $q, string $v) => $q->where('status', $v))
            ->when($filters['category'] ?? null, fn (Builder $q, string $v) => $q->where('category', $v))
            ->when($filters['user_id'] ?? null, fn (Builder $q, $v) => $q->where('user_id', $v))
            ->when($filters['date_from'] ?? null, fn (Builder $q, string $v) => $q->whereDate('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn (Builder $q, string $v) => $q->whereDate('created_at', '<=', $v));
    }

    /** Accepts "created_at", "-created_at", "title", "-status", ... */
    public function scopeSorted(Builder $query, ?string $sort): Builder
    {
        $sort = $sort ?: '-created_at';
        $direction = str_starts_with($sort, '-') ? 'desc' : 'asc';
        $column = ltrim($sort, '-');

        if (! in_array($column, ['created_at', 'updated_at', 'title', 'status', 'category'], true)) {
            $column = 'created_at';
        }

        return $query->orderBy($column, $direction)->orderBy('id', $direction);
    }
}
