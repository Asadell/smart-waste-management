<?php

namespace App\Http\Resources;

use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Report */
class ReportResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'photo_url' => $this->photoUrl(),
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'address' => $this->address,
            'category' => $this->category->value,
            'ai_label' => $this->ai_label,
            'ai_confidence' => $this->ai_confidence,
            'ai_uncertain' => $this->ai_uncertain,
            'ai_match' => $this->ai_label ? $this->ai_label === $this->category->value : null,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'admin_note' => $this->admin_note,
            'user' => $this->whenLoaded('user', fn () => [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
            ]),
            'status_logs' => ReportStatusLogResource::collection($this->whenLoaded('statusLogs')),
            'can' => $request->user() ? [
                'update' => $request->user()->can('update', $this->resource),
                'delete' => $request->user()->can('delete', $this->resource),
                'update_status' => $request->user()->isAdmin(),
            ] : null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
