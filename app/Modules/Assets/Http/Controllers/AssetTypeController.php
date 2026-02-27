<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\AssetType;
use App\Modules\Assets\Models\AssetTypeProperty;
use Illuminate\Http\Request;

class AssetTypeController extends Controller
{
    /**
     * Listar tipos de bien con sus propiedades
     */
    public function index(Request $request)
    {
        $query = AssetType::with('properties')->withCount('assets');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 50);
        return response()->json($query->paginate($perPage));
    }

    /**
     * Ver detalle de un tipo con sus propiedades
     */
    public function show(AssetType $assetType)
    {
        $assetType->load('properties');
        return response()->json($assetType);
    }

    /**
     * Crear tipo de bien
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asset_types,codigo',
            'descripcion' => 'nullable|string',
            'es_depreciable' => 'required|boolean',
            'vida_util_default' => 'nullable|integer|min:1',
            'cuenta_contable' => 'nullable|string|max:50',
        ]);

        $assetType = AssetType::create($validated);

        return response()->json([
            'mensaje' => 'Tipo de bien creado exitosamente',
            'tipo' => $assetType->load('properties'),
        ], 201);
    }

    /**
     * Actualizar tipo de bien
     */
    public function update(Request $request, AssetType $assetType)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string|max:255',
            'descripcion' => 'nullable|string',
            'es_depreciable' => 'nullable|boolean',
            'vida_util_default' => 'nullable|integer|min:1',
            'cuenta_contable' => 'nullable|string|max:50',
        ]);

        $assetType->update($validated);

        return response()->json([
            'mensaje' => 'Tipo de bien actualizado',
            'tipo' => $assetType->load('properties'),
        ]);
    }

    /**
     * Eliminar tipo de bien (solo si no tiene activos)
     */
    public function destroy(AssetType $assetType)
    {
        if ($assetType->assets()->exists()) {
            return response()->json([
                'message' => 'No se puede eliminar: hay activos asociados a este tipo.',
            ], 422);
        }

        $assetType->delete();
        return response()->json(['mensaje' => 'Tipo de bien eliminado']);
    }

    // ═══════════════ PROPIEDADES ═══════════════

    /**
     * Agregar propiedad a un tipo de bien
     */
    public function storeProperty(Request $request, AssetType $assetType)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'etiqueta' => 'required|string|max:255',
            'tipo_dato' => 'required|in:texto,numero,decimal,fecha,booleano,seleccion,textarea',
            'opciones' => 'nullable|array',
            'opciones.*' => 'string',
            'requerido' => 'nullable|boolean',
            'orden' => 'nullable|integer',
        ]);

        // Verificar duplicado
        if ($assetType->properties()->where('nombre', $validated['nombre'])->exists()) {
            return response()->json([
                'message' => "Ya existe una propiedad con el nombre '{$validated['nombre']}' en este tipo.",
            ], 422);
        }

        // Asignar orden si no viene
        if (!isset($validated['orden'])) {
            $validated['orden'] = $assetType->properties()->max('orden') + 1;
        }

        $property = $assetType->properties()->create($validated);

        return response()->json([
            'mensaje' => 'Propiedad agregada',
            'propiedad' => $property,
        ], 201);
    }

    /**
     * Actualizar propiedad
     */
    public function updateProperty(Request $request, AssetType $assetType, AssetTypeProperty $property)
    {
        // Verificar que la propiedad pertenece al tipo
        if ($property->asset_type_id !== $assetType->id) {
            return response()->json(['message' => 'La propiedad no pertenece a este tipo.'], 404);
        }

        $validated = $request->validate([
            'etiqueta' => 'nullable|string|max:255',
            'tipo_dato' => 'nullable|in:texto,numero,decimal,fecha,booleano,seleccion,textarea',
            'opciones' => 'nullable|array',
            'opciones.*' => 'string',
            'requerido' => 'nullable|boolean',
            'orden' => 'nullable|integer',
        ]);

        $property->update($validated);

        return response()->json([
            'mensaje' => 'Propiedad actualizada',
            'propiedad' => $property,
        ]);
    }

    /**
     * Eliminar propiedad (y sus valores en cascada por FK)
     */
    public function destroyProperty(AssetType $assetType, AssetTypeProperty $property)
    {
        if ($property->asset_type_id !== $assetType->id) {
            return response()->json(['message' => 'La propiedad no pertenece a este tipo.'], 404);
        }

        $property->delete();

        return response()->json(['mensaje' => 'Propiedad eliminada']);
    }
}
