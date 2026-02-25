<?php

namespace Database\Seeders;

use App\Modules\Assets\Models\Supplier;
use Illuminate\Database\Seeder;

class SupplierSeeder extends Seeder
{
    public function run(): void
    {
        $suppliers = [
            [
                'nombre' => 'TechWorld Colombia',
                'codigo' => 'TECH-001',
                'nit' => '800.123.456-7',
                'email' => 'contacto@techworld.com',
                'telefono' => '+57 1 2345678',
                'ciudad' => 'Bogotá',
                'direccion' => 'Carrera 7 #45-89, Bogotá D.C.',
            ],
            [
                'nombre' => 'Office Solutions S.A.',
                'codigo' => 'OFF-001',
                'nit' => '800.234.567-8',
                'email' => 'ventas@officesolutions.com',
                'telefono' => '+57 2 5678901',
                'ciudad' => 'Cali',
                'direccion' => 'Avenida 6 #34-21, Cali',
            ],
            [
                'nombre' => 'Equipos Industriales Ltda',
                'codigo' => 'IND-001',
                'nit' => '800.345.678-9',
                'email' => 'info@equiposindustriales.com',
                'telefono' => '+57 4 9876543',
                'ciudad' => 'Medellín',
                'direccion' => 'Transversal 45 #56-78, Medellín',
            ],
            [
                'nombre' => 'Distribuidora de Herramientas',
                'codigo' => 'HERB-001',
                'nit' => '800.456.789-0',
                'email' => 'distribuidora@herramientas.com',
                'telefono' => '+57 5 5432109',
                'ciudad' => 'Cartagena',
                'direccion' => 'Calle 32 #12-45, Cartagena',
            ],
            [
                'nombre' => 'Proveedora de Mobiliario',
                'codigo' => 'MOB-001',
                'nit' => '800.567.890-1',
                'email' => 'contacto@mobiliario.com',
                'telefono' => '+57 1 1234567',
                'ciudad' => 'Bogotá',
                'direccion' => 'Calle 80 #23-67, Bogotá D.C.',
            ],
        ];

        foreach ($suppliers as $supplier) {
            Supplier::create($supplier);
        }
    }
}
