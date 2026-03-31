<?php

namespace App\Http\Controllers;

use App\Models\SystemSetting;
use App\Modules\Assets\Models\AssetType;
use Illuminate\Http\Request;

class SystemSettingsController extends Controller
{
    /**
     * Obtener todas las configuraciones (API)
     */
    public function index()
    {
        $settings = SystemSetting::allSettings();

        // Agregar los tipos de bien existentes para la UI de tasas
        $assetTypes = AssetType::select('id', 'nombre', 'codigo', 'es_depreciable', 'vida_util_default')
            ->orderBy('nombre')
            ->get();

        return response()->json([
            'settings' => $settings,
            'asset_types' => $assetTypes,
        ]);
    }

    /**
     * Actualizar configuraciones (API)
     */
    public function update(Request $request)
    {
        $validated = $request->validate([
            'metodo_calculo' => 'sometimes|string|in:depreciacion,amortizacion',
            'valor_residual_porcentaje' => 'sometimes|numeric|min:0|max:100',
            'periodicidad_default' => 'sometimes|string|in:diaria,mensual,anual',
            'aplicar_regla_dia_15' => 'sometimes|boolean',
            'tasas_por_tipo' => 'sometimes|array',
            'tasas_por_tipo.*.tasa' => 'required_with:tasas_por_tipo|numeric|min:0|max:100',
            'tasas_por_tipo.*.descripcion' => 'sometimes|string',
        ]);

        foreach ($validated as $key => $value) {
            SystemSetting::set($key, $value, null, 'depreciacion');
        }

        return response()->json([
            'mensaje' => 'Configuración actualizada exitosamente',
            'settings' => SystemSetting::allSettings(),
        ]);
    }
}
