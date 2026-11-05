<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'role' => $this->role->value,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar_path ? Storage::disk('public')->url($this->avatar_path) : null,
            'is_active' => $this->is_active,
            'reports_count' => $this->whenCounted('reports'),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
