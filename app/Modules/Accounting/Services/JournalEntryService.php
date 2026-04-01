<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use Exception;

class JournalEntryService
{
    /**
     * Valida y crea un nuevo asiento contable
     *
     * @param array $entryData (fecha, descripcion, tipo_origen, asset_id, etc.)
     * @param array $linesData Array de lineas con ['accounting_account_id', 'debe', 'haber']
     * @return JournalEntry
     * @throws Exception
     */
    public function createEntry(array $entryData, array $linesData): JournalEntry
    {
        if (empty($linesData) || count($linesData) < 2) {
            throw new Exception("Un asiento contable debe tener al menos dos líneas.");
        }

        $totalDebe = 0;
        $totalHaber = 0;

        foreach ($linesData as $line) {
            $debe = (float) ($line['debe'] ?? 0);
            $haber = (float) ($line['haber'] ?? 0);
            
            if ($debe > 0 && $haber > 0) {
                throw new Exception("Una misma línea no puede tener valores en el debe y el haber.");
            }
            if ($debe < 0 || $haber < 0) {
                throw new Exception("Los importes no pueden ser negativos.");
            }

            $totalDebe += $debe;
            $totalHaber += $haber;
        }

        // Validación de partida doble con una tolerancia aceptable para decimales
        if (abs($totalDebe - $totalHaber) > 0.001) {
            throw new Exception("El asiento está descuadrado. Total Debe: {$totalDebe}, Total Haber: {$totalHaber}");
        }

        return DB::transaction(function () use ($entryData, $linesData) {
            $entry = JournalEntry::create([
                'fecha' => $entryData['fecha'] ?? now()->toDateString(),
                'descripcion' => $entryData['descripcion'],
                'asset_id' => $entryData['asset_id'] ?? null,
                'tipo_origen' => $entryData['tipo_origen'] ?? 'manual',
                'estado' => $entryData['estado'] ?? 'validado',
            ]);

            foreach ($linesData as $lineData) {
                $entry->lines()->create([
                    'accounting_account_id' => $lineData['accounting_account_id'],
                    'debe' => $lineData['debe'] ?? 0,
                    'haber' => $lineData['haber'] ?? 0,
                ]);
            }

            return $entry;
        });
    }
}
