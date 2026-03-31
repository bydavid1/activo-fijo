<?php

namespace App\Modules\Assets\Services;

use App\Modules\Assets\Models\Asset;

class AssetMovementBusinessRules
{
    public function validate(Asset $asset, array $data): array
    {
        $errors = [];

        $checks = [
            fn() => $this->validateAssetNotDisposed($asset),
            fn() => $this->validateComodatoMovement($asset, $data),
            fn() => $this->validateDevolucionMovement($asset, $data),
        ];

        foreach ($checks as $check) {
            foreach ($check() as $field => $message) {
                $errors[$field][] = $message;
            }
        }

        return $errors;
    }

    public function nextState(Asset $asset, array $data): ?string
    {
        $tipo = $data['tipo'] ?? null;

        if ($tipo === 'comodato') {
            return 'en_comodato';
        }

        if ($tipo === 'devolucion') {
            return 'disponible';
        }

        if ($tipo === 'asignacion') {
            return 'asignado';
        }

        return $asset->estado;
    }

    private function validateAssetNotDisposed(Asset $asset): array
    {
        if (!in_array($asset->estado, ['baja', 'retirado', 'vendido'], true)) {
            return [];
        }

        return [
            'estado' => 'No se pueden registrar movimientos para activos en estado baja, retirado o vendido.',
        ];
    }

    private function validateComodatoMovement(Asset $asset, array $data): array
    {
        if (($data['tipo'] ?? null) !== 'comodato') {
            return [];
        }

        $errors = [];

        if (($asset->propiedad ?? 'propio') !== 'propio') {
            $errors['propiedad'] = 'Solo se permite movimiento de comodato en activos con propiedad propio.';
        }

        if (empty($data['responsable_externo'])) {
            $errors['responsable_externo'] = 'El responsable_externo es obligatorio para el movimiento comodato.';
        }

        if (empty($data['empresa_externa'])) {
            $errors['empresa_externa'] = 'La empresa_externa es obligatoria para el movimiento comodato.';
        }

        if (empty($data['fecha_devolucion'])) {
            $errors['fecha_devolucion'] = 'La fecha_devolucion es obligatoria para el movimiento comodato.';
        }

        return $errors;
    }

    private function validateDevolucionMovement(Asset $asset, array $data): array
    {
        if (($data['tipo'] ?? null) !== 'devolucion') {
            return [];
        }

        if ($asset->estado !== 'en_comodato') {
            return [
                'estado' => 'Solo se puede registrar devolucion cuando el activo esta en estado en_comodato.',
            ];
        }

        return [];
    }
}
