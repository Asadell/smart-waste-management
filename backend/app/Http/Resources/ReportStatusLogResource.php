<?php

namespace App\Http\Resources;

use App\Models\ReportStatusLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReportStatusLog */
class ReportStatusLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'from_status' => $this->from_status?->value,
            'to_status' => $this->to_status->value,
            'to_status_label' => $this->to_status->label(),
            'note' => $this->note,
            'changed_by' => $this->whenLoaded('changer', fn () => $this->changer ? [
                'id' => $this->changer->id,
                'name' => $this->changer->name,
            ] : null),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
