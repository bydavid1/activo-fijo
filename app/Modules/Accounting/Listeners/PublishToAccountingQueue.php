<?php

namespace App\Modules\Accounting\Listeners;

use App\Modules\Assets\Events\AssetCreated;
use App\Modules\Assets\Events\AssetRevalued;
use App\Modules\Assets\Events\AssetDisposed;

/**
 * Listener stub para integración con módulo de contabilidad
 * En el futuro, este listener publicará eventos a un sistema contable
 * o ejecutará comandos que generen asientos automáticos
 */
class PublishToAccountingQueue
{
    /**
     * Manejar creación de activo
     * En el futuro: Generar asiento de débito (activo) y crédito (efectivo)
     */
    public function handleAssetCreated(AssetCreated $event): void
    {
        // TODO: Publicar evento de contabilidad
        // if (config('accounting.integration_enabled')) {
        //     PublishAssetCreationJob::dispatch($event->asset);
        // }
    }

    /**
     * Manejar revaluación de activo
     * En el futuro: Ajuste al valor en libros
     */
    public function handleAssetRevalued(AssetRevalued $event): void
    {
        // TODO: Publicar evento de contabilidad
        // PublishAssetRevaluationJob::dispatch($event->valuation);
    }

    /**
     * Manejar disposición de activo
     * En el futuro: Asiento de baja y reconocimiento de pérdida/ganancia
     */
    public function handleAssetDisposed(AssetDisposed $event): void
    {
        // TODO: Publicar evento de contabilidad
        // PublishAssetDisposalJob::dispatch($event->asset, $event->valorResidual);
    }
}
