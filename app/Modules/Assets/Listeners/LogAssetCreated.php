<?php

namespace App\Modules\Assets\Listeners;

use App\Modules\Assets\Events\AssetCreated;
use Spatie\Activitylog\Facades\LogActivity;

class LogAssetCreated
{
    public function handle(AssetCreated $event): void
    {
        LogActivity::causedBy(auth()->user() ?? null)
            ->performedOn($event->asset)
            ->withProperties($event->asset->toArray())
            ->log('Activo creado: ' . $event->asset->nombre);
    }
}
