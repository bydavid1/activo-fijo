<?php

namespace App\Modules\Assets\Services;

class AssetCreationBusinessRules
{
    public function applyAndValidate(array $data): array
    {
        $normalized = $this->applyDerivedValues($data);
        $errors = [];

        $checks = [
            fn(array $payload) => $this->validateComodatoAcquisition($payload),
            fn(array $payload) => $this->validateLeasing($payload),
            fn(array $payload) => $this->validateDonation($payload),
            fn(array $payload) => $this->validateThirdPartyDepreciation($payload),
        ];

        foreach ($checks as $check) {
            foreach ($check($normalized) as $field => $message) {
                $errors[$field][] = $message;
            }
        }

        return [
            'data' => $normalized,
            'errors' => $errors,
        ];
    }

    private function applyDerivedValues(array $data): array
    {
        $tipoAdquisicion = $data['tipo_adquisicion'] ?? null;
        $tipoLeasing = $data['tipo_leasing'] ?? null;

        if ($tipoAdquisicion === 'comodato') {
            $data['propiedad'] = 'tercero';
            $data['depreciable'] = false;
        }

        if ($tipoAdquisicion === 'leasing' && $tipoLeasing === 'operativo') {
            $data['propiedad'] = 'tercero';
            $data['depreciable'] = false;
        }

        if ($tipoAdquisicion === 'leasing' && $tipoLeasing === 'financiero') {
            $data['propiedad'] = 'propio';
            $data['depreciable'] = true;
        }

        if (in_array($tipoAdquisicion, ['compra', 'donacion', 'dacion_en_pago', 'proyecto'], true)) {
            $data['propiedad'] = 'propio';
        }

        if ($tipoAdquisicion === 'donacion') {
            $data['depreciable'] = true;
        }

        if (!array_key_exists('depreciable', $data)) {
            $data['depreciable'] = true;
        }

        if (!array_key_exists('propiedad', $data) || empty($data['propiedad'])) {
            $data['propiedad'] = 'propio';
        }

        if (!array_key_exists('estado', $data) || empty($data['estado'])) {
            $data['estado'] = 'disponible';
        }

        return $data;
    }

    private function validateComodatoAcquisition(array $data): array
    {
        if (($data['tipo_adquisicion'] ?? null) !== 'comodato') {
            return [];
        }

        $errors = [];

        if (($data['propiedad'] ?? null) !== 'tercero') {
            $errors['propiedad'] = 'Para tipo de adquisicion comodato, la propiedad debe ser tercero.';
        }

        if (($data['depreciable'] ?? null) !== false) {
            $errors['depreciable'] = 'Para tipo de adquisicion comodato, el activo no puede ser depreciable.';
        }

        if (empty($data['responsable_externo'])) {
            $errors['responsable_externo'] = 'El responsable externo es obligatorio para activos en comodato.';
        }

        if (empty($data['fecha_devolucion'])) {
            $errors['fecha_devolucion'] = 'La fecha de devolucion es obligatoria para activos en comodato.';
        }

        return $errors;
    }

    private function validateLeasing(array $data): array
    {
        if (($data['tipo_adquisicion'] ?? null) !== 'leasing') {
            return [];
        }

        $errors = [];
        $tipoLeasing = $data['tipo_leasing'] ?? null;

        if (!in_array($tipoLeasing, ['operativo', 'financiero'], true)) {
            $errors['tipo_leasing'] = 'Para adquisicion leasing debe definir tipo_leasing: operativo o financiero.';
            return $errors;
        }

        if ($tipoLeasing === 'operativo') {
            if (($data['propiedad'] ?? null) !== 'tercero') {
                $errors['propiedad'] = 'En leasing operativo la propiedad debe ser tercero.';
            }

            if (($data['depreciable'] ?? null) !== false) {
                $errors['depreciable'] = 'En leasing operativo el activo no puede ser depreciable.';
            }
        }

        if ($tipoLeasing === 'financiero') {
            if (($data['propiedad'] ?? null) !== 'propio') {
                $errors['propiedad'] = 'En leasing financiero la propiedad debe ser propio.';
            }

            if (($data['depreciable'] ?? null) !== true) {
                $errors['depreciable'] = 'En leasing financiero el activo debe ser depreciable.';
            }
        }

        return $errors;
    }

    private function validateDonation(array $data): array
    {
        if (($data['tipo_adquisicion'] ?? null) !== 'donacion') {
            return [];
        }

        $errors = [];

        if (empty($data['valor_estimado'])) {
            $errors['valor_estimado'] = 'Para donaciones debe registrar valor_estimado.';
        }

        if (($data['depreciable'] ?? null) !== true) {
            $errors['depreciable'] = 'Los activos por donacion deben ser depreciables.';
        }

        return $errors;
    }

    private function validateThirdPartyDepreciation(array $data): array
    {
        if (($data['propiedad'] ?? null) !== 'tercero') {
            return [];
        }

        if (($data['depreciable'] ?? null) === true) {
            return [
                'depreciable' => 'Los activos con propiedad tercero no pueden depreciarse.',
            ];
        }

        return [];
    }
}
