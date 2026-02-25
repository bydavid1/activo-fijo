<?php

namespace App\Modules\Assets\Listeners;

use App\Modules\Assets\Events\AssetRevalued;
use Spatie\Activitylog\Facades\LogActivity;

class LogAssetRevalued
{
    public function handle(AssetRevalued $event): void
    {
        $valuation = $event->valuation;

        LogActivity::causedBy(auth()->user() ?? null)
            ->performedOn($valuation->asset)
            ->withProperties([
                'valor_anterior' => $valuation->valor_anterior,
                'valor_nuevo' => $valuation->valor_nuevo,
                'metodo' => $valuation->metodo,
                'diferencia' => $valuation->valor_nuevo - $valuation->valor_anterior,
            ])
            ->log('Activo revaluado: ' . $valuation->valor_anterior . ' → ' . $valuation->valor_nuevo);
    }
}
