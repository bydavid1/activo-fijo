<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounting_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('accounting_accounts')->nullOnDelete();
            $table->string('codigo')->unique();
            $table->string('nombre');
            $table->enum('tipo', ['activo', 'pasivo', 'patrimonio', 'ingreso', 'gasto']);
            $table->enum('estado', ['activo', 'inactivo'])->default('activo');
            $table->integer('nivel')->default(1);
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('journal_entries', function (Blueprint $table) {
            $table->id();
            $table->date('fecha');
            $table->string('descripcion');
            $table->foreignId('asset_id')->nullable()->constrained('assets')->nullOnDelete();
            $table->string('tipo_origen')->nullable()->comment('Ej: depreciacion, manual, baja');
            $table->enum('estado', ['borrador', 'validado', 'anulado'])->default('validado');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('journal_entry_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('journal_entry_id')->constrained('journal_entries')->cascadeOnDelete();
            $table->foreignId('accounting_account_id')->constrained('accounting_accounts')->restrictOnDelete();
            $table->decimal('debe', 15, 2)->default(0);
            $table->decimal('haber', 15, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('journal_entry_lines');
        Schema::dropIfExists('journal_entries');
        Schema::dropIfExists('accounting_accounts');
    }
};
