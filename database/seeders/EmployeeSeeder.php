<?php

namespace Database\Seeders;

use App\Modules\Employees\Models\Employee;
use Illuminate\Database\Seeder;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $employees = [
            [
                'codigo' => 'EMP-001',
                'nombre' => 'Juan García Rodríguez',
                'email' => 'juan.garcia@empresa.com',
                'departamento' => 'Administración',
                'puesto' => 'Gerente General',
                'telefono' => '+57 300 1234567',
            ],
            [
                'codigo' => 'EMP-002',
                'nombre' => 'María López Martínez',
                'email' => 'maria.lopez@empresa.com',
                'departamento' => 'Activo Fijo',
                'puesto' => 'Jefe de Activo Fijo',
                'telefono' => '+57 300 2345678',
            ],
            [
                'codigo' => 'EMP-003',
                'nombre' => 'Carlos Pérez Gómez',
                'email' => 'carlos.perez@empresa.com',
                'departamento' => 'IT',
                'puesto' => 'Especialista en TI',
                'telefono' => '+57 300 3456789',
            ],
            [
                'codigo' => 'EMP-004',
                'nombre' => 'Sandra Rodríguez Silva',
                'email' => 'sandra.rodriguez@empresa.com',
                'departamento' => 'Mantenimiento',
                'puesto' => 'Coordinador de Mantenimiento',
                'telefono' => '+57 300 4567890',
            ],
            [
                'codigo' => 'EMP-005',
                'nombre' => 'Roberto Martínez López',
                'email' => 'roberto.martinez@empresa.com',
                'departamento' => 'Almacén',
                'puesto' => 'Encargado de Almacén',
                'telefono' => '+57 300 5678901',
            ],
            [
                'codigo' => 'EMP-006',
                'nombre' => 'Catalina Fernández Castro',
                'email' => 'catalina.fernandez@empresa.com',
                'departamento' => 'Finanzas',
                'puesto' => 'Contadora',
                'telefono' => '+57 300 6789012',
            ],
        ];

        foreach ($employees as $employee) {
            Employee::create($employee);
        }
    }
}
