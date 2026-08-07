<?php

namespace App\Modules\Accounting\Services;

use App\Modules\Accounting\Models\AccountingAccount;
use App\Modules\Accounting\Models\JournalEntry;
use App\Modules\Accounting\Models\JournalEntryLine;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;

class JournalEntryService
{
    /**
     * Valida y crea un nuevo asiento contable
     *
     * @param array $entryData (fecha, descripcion, tipo_origen, asset_id, estado, etc.)
     * @param array $linesData Array de líneas con ['accounting_account_id', 'debe', 'haber', 'concepto']
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
        $hasDebe = false;
        $hasHaber = false;

        $accountIds = array_column($linesData, 'accounting_account_id');
        if (in_array(null, $accountIds, true) || in_array('', $accountIds, true)) {
            throw new Exception("Todas las líneas deben tener una cuenta contable obligatoria.");
        }

        // Cargar cuentas para verificar estado y si permiten movimientos
        $accounts = AccountingAccount::whereIn('id', array_filter($accountIds))->get()->keyBy('id');

        foreach ($linesData as $index => $line) {
            $lineNum = $index + 1;
            $accountId = $line['accounting_account_id'] ?? null;

            if (!$accountId || !isset($accounts[$accountId])) {
                throw new Exception("La cuenta contable especificada en la línea {$lineNum} no es válida.");
            }

            $account = $accounts[$accountId];

            if ($account->estado !== 'activo') {
                throw new Exception("La cuenta '{$account->codigo} - {$account->nombre}' está inactiva y no puede recibir movimientos.");
            }

            if (!$account->permite_movimientos) {
                throw new Exception("La cuenta '{$account->codigo} - {$account->nombre}' es una cuenta agrupadora y no permite movimientos.");
            }

            $debe = (float) ($line['debe'] ?? 0);
            $haber = (float) ($line['haber'] ?? 0);

            if ($debe < 0 || $haber < 0) {
                throw new Exception("Los importes no pueden ser negativos (línea {$lineNum}).");
            }

            if ($debe > 0 && $haber > 0) {
                throw new Exception("Una misma línea no puede tener valores en el debe y el haber simultáneamente (línea {$lineNum}).");
            }

            if ($debe == 0 && $haber == 0) {
                throw new Exception("Una línea no puede quedar con ambos valores en cero (línea {$lineNum}).");
            }

            if ($debe > 0) {
                $hasDebe = true;
            }
            if ($haber > 0) {
                $hasHaber = true;
            }

            $totalDebe += $debe;
            $totalHaber += $haber;
        }

        if (!$hasDebe) {
            throw new Exception("Debe existir al menos una línea con importe en el Debe.");
        }

        if (!$hasHaber) {
            throw new Exception("Debe existir al menos una línea con importe en el Haber.");
        }

        // Validación de partida doble con una tolerancia aceptable para decimales
        if (abs($totalDebe - $totalHaber) > 0.001) {
            throw new Exception("El asiento está descuadrado. Total Debe: {$totalDebe}, Total Haber: {$totalHaber}");
        }

        $fecha = $entryData['fecha'] ?? now()->toDateString();
        $numeroAsiento = $entryData['numero_asiento'] ?? $this->generateNextNumber($fecha);

        return DB::transaction(function () use ($entryData, $linesData, $fecha, $numeroAsiento) {
            $estado = $entryData['estado'] ?? 'borrador';
            $contabilizadoEn = $estado === 'contabilizado' ? now() : null;
            $contabilizadoPor = $estado === 'contabilizado' ? (auth()->id() ?? null) : null;

            $entry = JournalEntry::create([
                'numero_asiento' => $numeroAsiento,
                'fecha' => $fecha,
                'descripcion' => $entryData['descripcion'],
                'asset_id' => $entryData['asset_id'] ?? null,
                'tipo_origen' => $entryData['tipo_origen'] ?? 'manual',
                'estado' => $estado,
                'contabilizado_en' => $contabilizadoEn,
                'contabilizado_por_id' => $contabilizadoPor,
            ]);

            foreach ($linesData as $lineData) {
                $entry->lines()->create([
                    'accounting_account_id' => $lineData['accounting_account_id'],
                    'debe' => $lineData['debe'] ?? 0,
                    'haber' => $lineData['haber'] ?? 0,
                    'concepto' => $lineData['concepto'] ?? null,
                ]);
            }

            return $entry;
        });
    }

    /**
     * Contabiliza un asiento que está en borrador
     */
    public function postEntry(JournalEntry $entry, ?int $userId = null): JournalEntry
    {
        if ($entry->estado !== 'borrador') {
            throw new Exception("Solo se pueden contabilizar asientos que estén en estado borrador.");
        }

        $entry->update([
            'estado' => 'contabilizado',
            'contabilizado_en' => now(),
            'contabilizado_por_id' => $userId ?? auth()->id(),
        ]);

        return $entry;
    }

    /**
     * Anula un asiento contabilizado mediante un asiento de contrapartida
     */
    public function voidEntry(JournalEntry $entry, string $motivo = 'Anulación de asiento', ?int $userId = null): JournalEntry
    {
        if ($entry->estado === 'borrador') {
            $entry->delete();
            return $entry;
        }

        if ($entry->estado === 'anulado') {
            throw new Exception("El asiento ya se encuentra anulado.");
        }

        return DB::transaction(function () use ($entry, $motivo, $userId) {
            $entry->load('lines');
            
            // Asiento de reversión (contrapartida)
            $linesData = [];
            foreach ($entry->lines as $line) {
                $linesData[] = [
                    'accounting_account_id' => $line->accounting_account_id,
                    'debe' => $line->haber,
                    'haber' => $line->debe,
                    'concepto' => "Reversión: " . ($line->concepto ?? $motivo),
                ];
            }

            $reversalEntry = $this->createEntry([
                'fecha' => now()->toDateString(),
                'descripcion' => "Anulación de asiento {$entry->numero_asiento}: {$motivo}",
                'asset_id' => $entry->asset_id,
                'tipo_origen' => 'anulacion',
                'estado' => 'contabilizado',
            ], $linesData);

            $entry->update([
                'estado' => 'anulado',
                'anulado_por_id' => $reversalEntry->id,
            ]);

            return $reversalEntry;
        });
    }

    /**
     * Genera el siguiente número correlativo para asientos
     */
    public function generateNextNumber(string $fecha): string
    {
        $prefix = 'ASI-' . Carbon::parse($fecha)->format('Ym') . '-';
        
        $lastNumber = JournalEntry::where('numero_asiento', 'like', "{$prefix}%")
            ->orderBy('numero_asiento', 'desc')
            ->value('numero_asiento');

        if ($lastNumber) {
            $sequence = (int) substr($lastNumber, strlen($prefix)) + 1;
        } else {
            $sequence = 1;
        }

        return $prefix . str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }
}
