<?php

namespace App\Modules\Assets\Listeners;

use App\Modules\Assets\Events\AssetMoved;
use Spatie\Activitylog\Facades\LogActivity;

class LogAssetMoved
{
    public function handle(AssetMoved $event): void
    {
        $movement = $event->movement;

        LogActivity::causedBy(auth()->user() ?? null)
            ->performedOn($movement->asset)
            ->withProperties([
                'ubicacion_anterior' => $movement->ubicacionAnterior?->nombre,
                'ubicacion_nueva' => $movement->ubicacionNueva->nombre,
                'tipo' => $movement->tipo,
                'motivo' => $movement->motivo,
            ])
            ->log('Activo trasladado a: ' . $movement->ubicacionNueva->nombre);
    }
}
