<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Órdenes de mantenimiento
        Schema::create('maintenance_orders', function (Blueprint $table) {
            $table->id();
            $table->string('numero')->unique();
            $table->foreignId('asset_id')->constrained('assets');

            $table->enum('tipo', ['preventivo', 'correctivo'])->default('correctivo');
            $table->enum('estado', ['pendiente', 'programado', 'en_ejecucion', 'completado', 'cancelado'])->default('pendiente');

            $table->date('fecha_programada')->nullable();
            $table->date('fecha_completada')->nullable();
            $table->text('descripcion')->nullable();

            $table->foreignId('asignado_a_id')->nullable()->constrained('users');
            $table->foreignId('usuario_id')->constrained('users');

            $table->decimal('costo_estimado', 15, 2)->nullable();
            $table->decimal('costo_real', 15, 2)->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('asset_id');
            $table->index('estado');
            $table->index(['estado', 'fecha_programada']);
        });

        // Historial de mantenimiento
        Schema::create('maintenance_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('maintenance_order_id')->constrained('maintenance_orders')->cascadeOnDelete();

            $table->enum('estado_anterior', ['pendiente', 'programado', 'en_ejecucion', 'completado', 'cancelado']);
            $table->enum('estado_nuevo', ['pendiente', 'programado', 'en_ejecucion', 'completado', 'cancelado']);
            $table->text('observaciones')->nullable();

            $table->foreignId('usuario_id')->constrained('users');
            $table->timestamps();

            $table->index(['maintenance_order_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('maintenance_history');
        Schema::dropIfExists('maintenance_orders');
    }
};
