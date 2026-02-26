<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\AssetLocation;
use Illuminate\Http\Request;

class AssetLocationController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetLocation::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%")
                  ->orWhere('edificio', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function show(AssetLocation $location)
    {
        $location->load('assets');
        return response()->json($location);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asset_locations,codigo',
            'descripcion' => 'nullable|string',
            'edificio' => 'nullable|string|max:255',
            'piso' => 'nullable|string|max:50',
        ]);

        try {
            $location = AssetLocation::create($validated);
            return response()->json(['mensaje' => 'Ubicación creada exitosamente', 'ubicacion' => $location], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear ubicación: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, AssetLocation $location)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string|max:255',
            'codigo' => 'nullable|string|max:50|unique:asset_locations,codigo,' . $location->id,
            'descripcion' => 'nullable|string',
            'edificio' => 'nullable|string|max:255',
            'piso' => 'nullable|string|max:50',
        ]);

        try {
            $location->update(array_filter($validated, fn($v) => $v !== null));
            return response()->json(['mensaje' => 'Ubicación actualizada exitosamente', 'ubicacion' => $location]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar ubicación: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(AssetLocation $location)
    {
        try {
            if ($location->assets()->count() > 0) {
                return response()->json(['error' => 'No se puede eliminar: la ubicación tiene activos asociados'], 422);
            }
            $location->delete();
            return response()->json(['mensaje' => 'Ubicación eliminada exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar ubicación: ' . $e->getMessage()], 500);
        }
    }
}
