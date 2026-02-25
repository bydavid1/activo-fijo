<?php

namespace App\Modules\Employees\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Employees\Models\Employee;
use App\Modules\Employees\Services\EmployeeSyncService;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    private EmployeeSyncService $syncService;

    public function __construct(EmployeeSyncService $syncService)
    {
        $this->syncService = $syncService;
    }

    /**
     * Listar empleados
     */
    public function index(Request $request)
    {
        $query = Employee::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('codigo', 'like', "%{$search}%")
                  ->orWhere('nombre', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($request->has('departamento')) {
            $query->where('departamento', $request->departamento);
        }

        $perPage = $request->get('per_page', 15);
        $empleados = $query->paginate($perPage);

        return response()->json($empleados);
    }

    /**
     * Ver detalles de un empleado
     */
    public function show(Employee $employee)
    {
        $employee->load(['integraciones', 'sinronizacionLogs' => function ($q) {
            $q->latest()->limit(5);
        }]);

        return response()->json($employee);
    }

    /**
     * Crear empleado (solo si es registro local)
     */
    public function store(Request $request)
    {
        // Verificar si está habilitado registro local
        $config = config('app-config');
        if ($config && $config['employee_source'] === 'external_api') {
            return response()->json(['error' => 'El registro de empleados está configurado para API externa'], 403);
        }

        $validated = $request->validate([
            'codigo' => 'required|unique:employees,codigo',
            'nombre' => 'required|string',
            'email' => 'required|unique:employees,email|email',
            'departamento' => 'nullable|string',
            'puesto' => 'nullable|string',
            'telefono' => 'nullable|string',
        ]);

        try {
            $empleado = $this->syncService->createLocal($validated);
            return response()->json(['mensaje' => 'Empleado creado exitosamente', 'empleado' => $empleado], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear empleado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Actualizar empleado
     */
    public function update(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string',
            'email' => 'nullable|email|unique:employees,email,' . $employee->id,
            'departamento' => 'nullable|string',
            'puesto' => 'nullable|string',
            'telefono' => 'nullable|string',
        ]);

        try {
            $employee->update($validated);
            return response()->json(['mensaje' => 'Empleado actualizado exitosamente', 'empleado' => $employee]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar empleado: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Sincronizar empleados desde API externa (Manual)
     */
    public function syncExternal(Request $request)
    {
        try {
            // TODO: Obtener configuración del provider desde BD o .env
            // Por ahora es solo un stub
            $resultado = $this->syncService->syncFromExternal();

            return response()->json([
                'exitoso' => true,
                'resultado' => $resultado,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'exitoso' => false,
                'error' => 'Error en sincronización: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener logs de sincronización
     */
    public function getSyncLogs(Employee $employee)
    {
        $logs = $employee->sinronizacionLogs()
            ->latest()
            ->limit(20)
            ->get();

        return response()->json($logs);
    }
}
