<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Movimientos de activos
        Schema::create('asset_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('assets');

            $table->foreignId('ubicacion_anterior_id')->nullable()->constrained('asset_locations');
            $table->foreignId('ubicacion_nueva_id')->constrained('asset_locations');
            $table->foreignId('responsable_anterior_id')->nullable()->constrained('users');
            $table->foreignId('responsable_nuevo_id')->nullable()->constrained('users');

            $table->enum('tipo', ['traslado', 'reubicacion', 'mantenimiento', 'otro'])->default('traslado');
            $table->text('motivo')->nullable();
            $table->foreignId('usuario_id')->constrained('users');

            $table->timestamps();
            $table->softDeletes();

            // Índices
            $table->index(['asset_id', 'created_at']);
            $table->index('ubicacion_nueva_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('asset_movements');
    }
};
