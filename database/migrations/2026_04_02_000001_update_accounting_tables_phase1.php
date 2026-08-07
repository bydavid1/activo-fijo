<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('accounting_accounts', 'permite_movimientos')) {
            Schema::table('accounting_accounts', function (Blueprint $table) {
                $table->boolean('permite_movimientos')->default(true)->after('nivel');
            });
        }

        Schema::table('journal_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('journal_entries', 'numero_asiento')) {
                $table->string('numero_asiento')->nullable()->unique()->after('id');
            }
            if (!Schema::hasColumn('journal_entries', 'anulado_por_id')) {
                $table->foreignId('anulado_por_id')->nullable()->constrained('journal_entries')->nullOnDelete()->after('tipo_origen');
            }
            if (!Schema::hasColumn('journal_entries', 'contabilizado_en')) {
                $table->timestamp('contabilizado_en')->nullable()->after('anulado_por_id');
            }
            if (!Schema::hasColumn('journal_entries', 'contabilizado_por_id')) {
                $table->foreignId('contabilizado_por_id')->nullable()->constrained('users')->nullOnDelete()->after('contabilizado_en');
            }
        });

        if (DB::getDriverName() === 'mysql') {
            // Cambiar a VARCHAR primero para permitir cambiar 'validado' por 'contabilizado'
            DB::statement("ALTER TABLE journal_entries MODIFY COLUMN estado VARCHAR(255) NOT NULL DEFAULT 'borrador'");
        }

        // Actualizar registros existentes con estado 'validado' a 'contabilizado'
        DB::table('journal_entries')
            ->where('estado', 'validado')
            ->update(['estado' => 'contabilizado']);

        if (DB::getDriverName() === 'mysql') {
            // Cambiar el tipo de columna a ENUM con la nueva lista de estados
            DB::statement("ALTER TABLE journal_entries MODIFY COLUMN estado ENUM('borrador', 'contabilizado', 'anulado') NOT NULL DEFAULT 'borrador'");
        }

        if (!Schema::hasColumn('journal_entry_lines', 'concepto')) {
            Schema::table('journal_entry_lines', function (Blueprint $table) {
                $table->string('concepto')->nullable()->after('haber');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('journal_entry_lines', 'concepto')) {
            Schema::table('journal_entry_lines', function (Blueprint $table) {
                $table->dropColumn('concepto');
            });
        }

        DB::statement("ALTER TABLE journal_entries MODIFY COLUMN estado VARCHAR(255) NOT NULL DEFAULT 'validado'");
        DB::table('journal_entries')
            ->where('estado', 'contabilizado')
            ->update(['estado' => 'validado']);
        DB::statement("ALTER TABLE journal_entries MODIFY COLUMN estado ENUM('borrador', 'validado', 'anulado') NOT NULL DEFAULT 'validado'");

        Schema::table('journal_entries', function (Blueprint $table) {
            if (Schema::hasColumn('journal_entries', 'contabilizado_por_id')) {
                $table->dropForeign(['contabilizado_por_id']);
                $table->dropColumn('contabilizado_por_id');
            }
            if (Schema::hasColumn('journal_entries', 'anulado_por_id')) {
                $table->dropForeign(['anulado_por_id']);
                $table->dropColumn('anulado_por_id');
            }
            if (Schema::hasColumn('journal_entries', 'contabilizado_en')) {
                $table->dropColumn('contabilizado_en');
            }
            if (Schema::hasColumn('journal_entries', 'numero_asiento')) {
                $table->dropColumn('numero_asiento');
            }
        });

        if (Schema::hasColumn('accounting_accounts', 'permite_movimientos')) {
            Schema::table('accounting_accounts', function (Blueprint $table) {
                $table->dropColumn('permite_movimientos');
            });
        }
    }
};
