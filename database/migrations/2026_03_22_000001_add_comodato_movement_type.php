<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado','reubicacion','mantenimiento','prestamo','devolucion','comodato','venta','baja','otro') DEFAULT 'traslado'");
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado','reubicacion','mantenimiento','prestamo','devolucion','baja','otro') DEFAULT 'traslado'");
        }
    }
};
