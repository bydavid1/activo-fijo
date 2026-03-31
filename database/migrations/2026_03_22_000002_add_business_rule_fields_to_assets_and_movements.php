<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assets', function (Blueprint $table) {
            $table->enum('propiedad', ['propio', 'tercero'])->default('propio')->after('tipo_adquisicion');
            $table->boolean('depreciable')->default(true)->after('propiedad');
            $table->enum('tipo_leasing', ['operativo', 'financiero'])->nullable()->after('depreciable');
            $table->decimal('valor_estimado', 15, 2)->nullable()->after('tipo_leasing');
            $table->decimal('depreciacion_acumulada_transferencia', 15, 2)->nullable()->after('valor_estimado');
            $table->integer('vida_util_restante')->nullable()->after('depreciacion_acumulada_transferencia');
            $table->string('responsable_externo')->nullable()->after('vida_util_restante');
            $table->date('fecha_devolucion')->nullable()->after('responsable_externo');
        });

        DB::statement("ALTER TABLE assets MODIFY COLUMN estado ENUM('activo','disponible','asignado','en_comodato','mantenimiento','baja','inactivo','descartado','retirado','vendido') DEFAULT 'disponible'");

        Schema::table('asset_movements', function (Blueprint $table) {
            $table->string('responsable_externo')->nullable()->after('fecha_devolucion_esperada');
            $table->string('empresa_externa')->nullable()->after('responsable_externo');
            $table->date('fecha_devolucion')->nullable()->after('empresa_externa');
        });

        DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('asignacion','traslado','reubicacion','mantenimiento','prestamo','comodato','devolucion','venta','baja','otro') DEFAULT 'traslado'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado','reubicacion','mantenimiento','prestamo','devolucion','comodato','venta','baja','otro') DEFAULT 'traslado'");

        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropColumn(['responsable_externo', 'empresa_externa', 'fecha_devolucion']);
        });

        DB::statement("ALTER TABLE assets MODIFY COLUMN estado ENUM('activo','mantenimiento','inactivo','descartado','retirado','vendido') DEFAULT 'activo'");

        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn([
                'propiedad',
                'depreciable',
                'tipo_leasing',
                'valor_estimado',
                'depreciacion_acumulada_transferencia',
                'vida_util_restante',
                'responsable_externo',
                'fecha_devolucion',
            ]);
        });
    }
};
