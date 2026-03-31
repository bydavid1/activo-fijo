<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // ═══════════ EXPANDIR tipo_adquisicion EN assets ═══════════
        // MySQL requiere ALTER COLUMN para cambiar enum values
        DB::statement("ALTER TABLE assets MODIFY COLUMN tipo_adquisicion ENUM('compra','donacion','transferencia','comodato','leasing','dacion_en_pago','proyecto') DEFAULT 'compra'");

        // Agregar columnas para dación en pago y proyecto
        Schema::table('assets', function (Blueprint $table) {
            $table->string('proyecto_nombre')->nullable()->after('donacion_documento');
            $table->string('dacion_acreedor')->nullable()->after('proyecto_nombre');
            $table->decimal('dacion_deuda_original', 15, 2)->nullable()->after('dacion_acreedor');
        });

        // ═══════════ EXPANDIR periodicidad_depreciacion EN assets ═══════════
        DB::statement("ALTER TABLE assets MODIFY COLUMN periodicidad_depreciacion ENUM('diaria','mensual','anual') DEFAULT 'mensual'");

        // ═══════════ AGREGAR campos de baja a asset_movements ═══════════
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->enum('motivo_baja', ['perdida', 'obsolescencia', 'robo', 'otro'])->nullable()->after('motivo');
            $table->date('fecha_baja')->nullable()->after('motivo_baja');
            $table->decimal('ganancia_perdida', 15, 2)->nullable()->after('fecha_baja');
        });
    }

    public function down(): void
    {
        // Revertir asset_movements
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropColumn(['motivo_baja', 'fecha_baja', 'ganancia_perdida']);
        });

        // Revertir assets
        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn(['proyecto_nombre', 'dacion_acreedor', 'dacion_deuda_original']);
        });

        DB::statement("ALTER TABLE assets MODIFY COLUMN tipo_adquisicion ENUM('compra','donacion','transferencia','comodato','leasing') DEFAULT 'compra'");
        DB::statement("ALTER TABLE assets MODIFY COLUMN periodicidad_depreciacion ENUM('mensual','anual') DEFAULT 'mensual'");
    }
};
