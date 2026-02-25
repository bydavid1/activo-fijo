<?php

namespace App\Modules\Inventory\Listeners;

use App\Modules\Inventory\Events\DiscrepancyApproved;
use Spatie\Activitylog\Facades\LogActivity;

class LogDiscrepancyApproved
{
    public function handle(DiscrepancyApproved $event): void
    {
        $discrepancy = $event->discrepancy;

        LogActivity::causedBy(auth()->user() ?? null)
            ->performedOn($discrepancy)
            ->withProperties([
                'tipo_discrepancia' => $discrepancy->tipo_discrepancia,
                'aprobado_por' => $discrepancy->aprobadoPor?->name,
                'notas' => $discrepancy->notas_aprobacion,
            ])
            ->log('Discrepancia aprobada: ' . $discrepancy->tipo_discrepancia);
    }
}
