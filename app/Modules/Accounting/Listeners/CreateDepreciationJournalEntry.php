<?php

namespace App\Modules\Accounting\Listeners;

use App\Modules\Assets\Events\AssetDepreciated;
use App\Modules\Accounting\Services\JournalEntryService;
use Exception;
use Illuminate\Support\Facades\Log;

class CreateDepreciationJournalEntry
{
    protected JournalEntryService $journalService;

    public function __construct(JournalEntryService $journalService)
    {
        $this->journalService = $journalService;
    }

    /**
     * Handle the event.
     *
     * @param  AssetDepreciated  $event
     * @return void
     */
    public function handle(AssetDepreciated $event)
    {
        $asset = $event->asset;
        $depreciaciones = $event->depreciacionesNuevas;

        // Se requiere el tipo de bien configurado para saber las cuentas
        if (!$asset->tipoBien) {
            return;
        }

        $cuentaGastoId = $asset->tipoBien->cuenta_gasto_depreciacion_id;
        $cuentaAcumuladaId = $asset->tipoBien->cuenta_depreciacion_acumulada_id;

        // Si no hay cuentas configuradas, no podemos generar asiento
        if (!$cuentaGastoId || !$cuentaAcumuladaId) {
            return;
        }

        $montoDepreciadoMes = 0;
        foreach ($depreciaciones as $dep) {
            // Asumiremos que el evento envía la última depreciación procesada o 
            // calcularemos el monto recién insertado para el periodo actual.
            $montoDepreciadoMes += $dep['depreciacion_valor'];
            // Ojo: Dependiendo de si se recalcó toda la historia o solo el mes actual.
            // Por el requerimiento "Cuando se calcule la depreciación mensual...", registraremos
            // el total del valor depreciado arrojado, usualmente 1 periodo.
        }

        if ($montoDepreciadoMes <= 0) {
            return; // No hay nada que depreciar/asentar
        }

        try {
            $this->journalService->createEntry(
                [
                    'fecha' => now()->toDateString(),
                    'descripcion' => "Depreciación de activo: {$asset->codigo} - {$asset->nombre}",
                    'asset_id' => $asset->id,
                    'tipo_origen' => 'depreciacion',
                    'estado' => 'validado'
                ],
                [
                    // Linea 1: Debe a Gasto
                    [
                        'accounting_account_id' => $cuentaGastoId,
                        'debe' => $montoDepreciadoMes,
                        'haber' => 0
                    ],
                    // Linea 2: Haber a Depreciación Acumulada
                    [
                        'accounting_account_id' => $cuentaAcumuladaId,
                        'debe' => 0,
                        'haber' => $montoDepreciadoMes
                    ]
                ]
            );
        } catch (Exception $e) {
            // Guardar en log si falla el asiento contable por alguna razón
            Log::error("Error registrando asiento de depreciación para {$asset->codigo}: " . $e->getMessage());
        }
    }
}
