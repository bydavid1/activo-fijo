<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class RolePermissionSeeder extends Seeder
{
    public function run()
    {
        // Crear permisos por módulo
        $this->createPermissions();

        // Crear roles
        $this->createRoles();

        // Crear usuario super admin
        $this->createSuperAdmin();
    }

    private function createPermissions()
    {
        // Módulo: Activos
        Permission::createForModule('assets', ['view', 'create', 'edit', 'delete', 'export'], 'Activos');

        // Módulo: Mantenimiento
        Permission::createForModule('maintenance', ['view', 'create', 'edit', 'delete', 'assign'], 'Mantenimiento');

        // Módulo: Inventario
        Permission::createForModule('inventory', ['view', 'create', 'edit', 'delete', 'audit'], 'Inventario');

        // Módulo: Reportes
        Permission::createForModule('reports', ['view', 'generate', 'export'], 'Reportes');

        // Módulo: Empleados
        Permission::createForModule('employees', ['view', 'create', 'edit', 'delete'], 'Empleados');

        // Módulo: Movimientos
        Permission::createForModule('movements', ['view', 'create', 'approve'], 'Movimientos');

        // Módulo: Administración
        Permission::createForModule('admin', ['manage_users', 'manage_roles', 'system_settings'], 'Administración');

        // Módulo: Configuración
        Permission::createForModule('config', ['categories', 'locations', 'suppliers', 'asset_types'], 'Configuración');
    }

    private function createRoles()
    {
        // Super Administrador
        $superAdmin = Role::create([
            'name' => 'super_admin',
            'display_name' => 'Super Administrador',
            'description' => 'Acceso completo al sistema'
        ]);
        $superAdmin->syncPermissions(Permission::all());

        // Administrador
        $admin = Role::create([
            'name' => 'admin',
            'display_name' => 'Administrador',
            'description' => 'Gestión completa excepto usuarios'
        ]);
        $adminPermissions = Permission::whereNotIn('name', ['admin.manage_users', 'admin.manage_roles'])->get();
        $admin->syncPermissions($adminPermissions);

        // Gerente
        $manager = Role::create([
            'name' => 'manager',
            'display_name' => 'Gerente',
            'description' => 'Gestión de activos y reportes'
        ]);
        $managerPermissions = Permission::whereIn('name', [
            'assets.view', 'assets.create', 'assets.edit',
            'maintenance.view', 'maintenance.create', 'maintenance.edit',
            'inventory.view', 'inventory.audit',
            'reports.view', 'reports.generate', 'reports.export',
            'employees.view',
            'movements.view', 'movements.create'
        ])->get();
        $manager->syncPermissions($managerPermissions);

        // Auditor
        $auditor = Role::create([
            'name' => 'auditor',
            'display_name' => 'Auditor',
            'description' => 'Solo lectura en todos los módulos'
        ]);
        $auditorPermissions = Permission::where('name', 'LIKE', '%.view')->get();
        $auditor->syncPermissions($auditorPermissions);

        // Usuario
        $user = Role::create([
            'name' => 'user',
            'display_name' => 'Usuario',
            'description' => 'Acceso básico solo lectura'
        ]);
        $userPermissions = Permission::whereIn('name', [
            'assets.view',
            'reports.view',
            'movements.view'
        ])->get();
        $user->syncPermissions($userPermissions);

        // Técnico
        $technician = Role::create([
            'name' => 'technician',
            'display_name' => 'Técnico',
            'description' => 'Especializado en mantenimiento'
        ]);
        $technicianPermissions = Permission::whereIn('name', [
            'assets.view',
            'maintenance.view', 'maintenance.edit',
            'movements.view',
            'reports.view'
        ])->get();
        $technician->syncPermissions($technicianPermissions);
    }

    private function createSuperAdmin()
    {
        $superAdmin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@sistema.com',
            'password' => Hash::make('admin123'),
            'is_active' => true,
        ]);

        $superAdmin->assignRole('super_admin');
    }
}
