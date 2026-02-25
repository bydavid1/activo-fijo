<?php

namespace App\Modules\Employees\Services;

use App\Modules\Employees\Models\Employee;
use App\Modules\Employees\Models\EmployeeIntegration;
use App\Modules\Employees\Models\EmployeeSyncLog;
use App\Modules\Employees\Contracts\ExternalEmployeeProvider;
use Exception;

class EmployeeSyncService
{
    public function __construct(
        private ?ExternalEmployeeProvider $provider = null
    ) {}

    /**
     * Establecer proveedor externo
     */
    public function setProvider(ExternalEmployeeProvider $provider): self
    {
        $this->provider = $provider;
        return $this;
    }

    /**
     * Sincronizar empleados desde API externa
     */
    public function syncFromExternal(): array
    {
        if (!$this->provider) {
            return [
                'exitoso' => 0,
                'errores' => 0,
                'mensajes' => ['No hay proveedor configurado'],
            ];
        }

        $resultado = [
            'creados' => 0,
            'actualizados' => 0,
            'errores' => 0,
            'mensajes' => [],
        ];

        try {
            $empleadosExternos = $this->provider->getEmployees();

            foreach ($empleadosExternos as $datosExternos) {
                try {
                    $result = $this->syncEmployee($datosExternos);

                    if ($result['accion'] === 'creado') {
                        $resultado['creados']++;
                    } elseif ($result['accion'] === 'actualizado') {
                        $resultado['actualizados']++;
                    }

                    $resultado['mensajes'][] = $result['mensaje'];

                } catch (Exception $e) {
                    $resultado['errores']++;
                    $email = $datosExternos['email'] ?? 'N/A';
                    $resultado['mensajes'][] = "Error sincronizando empleado {$email}: {$e->getMessage()}";
                }
            }

        } catch (Exception $e) {
            $resultado['errores']++;
            $resultado['mensajes'][] = "Error al conectar con API externa: {$e->getMessage()}";
        }

        return $resultado;
    }

    /**
     * Sincronizar un empleado individual
     */
    private function syncEmployee(array $datosExternos): array
    {
        $email = $datosExternos['email'] ?? null;
        $idExterno = $datosExternos['id'] ?? $datosExternos['external_id'] ?? null;

        if (!$email || !$idExterno) {
            throw new Exception('Datos incompletos del empleado');
        }

        // Buscar si existe integración
        $integracion = EmployeeIntegration::where('id_externo', $idExterno)
            ->where('sistema_externo', $this->provider->getProviderName())
            ->first();

        if ($integracion) {
            // Actualizar empleado existente
            $empleado = $integracion->employee;
            $empleado->update($this->mapearDatos($datosExternos));
            $integracion->update(['ultima_sincronizacion' => now()]);

            $this->logSync($empleado->id, 'actualizado', true);

            return [
                'accion' => 'actualizado',
                'mensaje' => "Empleado {$email} actualizado",
                'empleado_id' => $empleado->id,
            ];
        } else {
            // Crear nuevo empleado
            $empleado = Employee::firstOrCreate(
                ['email' => $email],
                $this->mapearDatos($datosExternos)
            );

            // Crear integración
            EmployeeIntegration::create([
                'employee_id' => $empleado->id,
                'sistema_externo' => $this->provider->getProviderName(),
                'id_externo' => $idExterno,
                'ultima_sincronizacion' => now(),
                'metadata' => json_encode($datosExternos),
            ]);

            $this->logSync($empleado->id, 'creado', true);

            return [
                'accion' => 'creado',
                'mensaje' => "Empleado {$email} creado",
                'empleado_id' => $empleado->id,
            ];
        }
    }

    /**
     * Mapear datos externos al formato interno
     */
    private function mapearDatos(array $datosExternos): array
    {
        return [
            'codigo' => $datosExternos['codigo'] ?? $datosExternos['employee_code'] ?? '',
            'nombre' => $datosExternos['nombre'] ?? $datosExternos['name'] ?? '',
            'email' => $datosExternos['email'] ?? '',
            'departamento' => $datosExternos['departamento'] ?? $datosExternos['department'] ?? null,
            'puesto' => $datosExternos['puesto'] ?? $datosExternos['position'] ?? null,
            'telefono' => $datosExternos['telefono'] ?? $datosExternos['phone'] ?? null,
        ];
    }

    /**
     * Registrar log de sincronización
     */
    private function logSync(int $employeeId, string $accion, bool $exitoso): void
    {
        EmployeeSyncLog::create([
            'employee_id' => $employeeId,
            'accion' => $accion,
            'estado' => $exitoso ? 'exitoso' : 'error',
        ]);
    }

    /**
     * Crear empleado local
     */
    public function createLocal(array $data): Employee
    {
        return Employee::create([
            'codigo' => $data['codigo'],
            'nombre' => $data['nombre'],
            'email' => $data['email'],
            'departamento' => $data['departamento'] ?? null,
            'puesto' => $data['puesto'] ?? null,
            'telefono' => $data['telefono'] ?? null,
        ]);
    }
}
