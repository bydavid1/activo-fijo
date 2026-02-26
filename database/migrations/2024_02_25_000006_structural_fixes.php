<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar metodo_depreciacion a assets (override por activo, default desde categoría)
        Schema::table('assets', function (Blueprint $table) {
            $table->string('metodo_depreciacion')->default('lineal')->after('vida_util_anos');
        });

        // 2. Copiar metodo_depreciacion de cada categoría a sus activos existentes
        DB::statement('
            UPDATE assets
            INNER JOIN asset_categories ON assets.categoria_id = asset_categories.id
            SET assets.metodo_depreciacion = asset_categories.metodo_depreciacion
        ');

        // 3. Cambiar responsable_id en assets: de users a employees
        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['responsable_id']);
        });
        Schema::table('assets', function (Blueprint $table) {
            $table->foreign('responsable_id')->references('id')->on('employees')->nullOnDelete();
        });

        // 4. Cambiar responsable_anterior_id y responsable_nuevo_id en asset_movements: de users a employees
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropForeign(['responsable_anterior_id']);
            $table->dropForeign(['responsable_nuevo_id']);
        });
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->foreign('responsable_anterior_id')->references('id')->on('employees')->nullOnDelete();
            $table->foreign('responsable_nuevo_id')->references('id')->on('employees')->nullOnDelete();
        });

        // 5. Cambiar enum tipo en asset_movements para incluir prestamo, devolucion, baja
        // MySQL requiere ALTER COLUMN para cambiar enum values
        DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado','reubicacion','mantenimiento','prestamo','devolucion','baja','otro') DEFAULT 'traslado'");

        // 6. Agregar fecha_devolucion_esperada a asset_movements
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->date('fecha_devolucion_esperada')->nullable()->after('motivo');
        });
    }

    public function down(): void
    {
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropColumn('fecha_devolucion_esperada');
        });

        DB::statement("ALTER TABLE asset_movements MODIFY COLUMN tipo ENUM('traslado','reubicacion','mantenimiento','otro') DEFAULT 'traslado'");

        Schema::table('asset_movements', function (Blueprint $table) {
            $table->dropForeign(['responsable_anterior_id']);
            $table->dropForeign(['responsable_nuevo_id']);
        });
        Schema::table('asset_movements', function (Blueprint $table) {
            $table->foreign('responsable_anterior_id')->references('id')->on('users')->nullOnDelete();
            $table->foreign('responsable_nuevo_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropForeign(['responsable_id']);
        });
        Schema::table('assets', function (Blueprint $table) {
            $table->foreign('responsable_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('assets', function (Blueprint $table) {
            $table->dropColumn('metodo_depreciacion');
        });
    }
};
