<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Usuario de prueba
        User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);

        // Seeders del sistema de activo fijo
        $this->call([
            // Datos base (requeridos para otros seeders)
            AssetCategorySeeder::class,
            AssetLocationSeeder::class,
            SupplierSeeder::class,
            EmployeeSeeder::class,
            AssetTypeSeeder::class,

            // Assets base
            AssetSeeder::class,
            EnhancedAssetSeeder::class,

            // Datos transaccionales (requieren assets existentes)
            AssetMovementSeeder::class,
            AssetDepreciationSeeder::class,
            AssetValuationSeeder::class,
            AssetSalesSeeder::class,
            MaintenanceOrderSeeder::class,
            InventoryAuditSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }
}
