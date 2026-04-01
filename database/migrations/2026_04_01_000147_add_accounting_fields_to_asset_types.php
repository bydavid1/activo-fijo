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
        Schema::table('asset_types', function (Blueprint $table) {
            $table->foreignId('cuenta_gasto_depreciacion_id')->nullable()->after('cuenta_contable')->constrained('accounting_accounts')->nullOnDelete();
            $table->foreignId('cuenta_depreciacion_acumulada_id')->nullable()->after('cuenta_gasto_depreciacion_id')->constrained('accounting_accounts')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('asset_types', function (Blueprint $table) {
            $table->dropForeign(['cuenta_gasto_depreciacion_id']);
            $table->dropForeign(['cuenta_depreciacion_acumulada_id']);
            $table->dropColumn(['cuenta_gasto_depreciacion_id', 'cuenta_depreciacion_acumulada_id']);
        });
    }
};
