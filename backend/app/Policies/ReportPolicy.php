<?php

namespace App\Policies;

use App\Enums\ReportStatus;
use App\Models\Report;
use App\Models\User;

class ReportPolicy
{
    public function view(User $user, Report $report): bool
    {
        return $user->isAdmin() || $report->user_id === $user->id;
    }

    /** Owners may only edit while the report is still pending. */
    public function update(User $user, Report $report): bool
    {
        return $user->isAdmin()
            || ($report->user_id === $user->id && $report->status === ReportStatus::Pending);
    }

    public function delete(User $user, Report $report): bool
    {
        return $this->update($user, $report);
    }

    public function updateStatus(User $user): bool
    {
        return $user->isAdmin();
    }
}
