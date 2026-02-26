<?php

namespace App\Modules\Assets\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Assets\Models\AssetCategory;
use Illuminate\Http\Request;

class AssetCategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = AssetCategory::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function show(AssetCategory $category)
    {
        $category->load('assets');
        return response()->json($category);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:asset_categories,codigo',
            'descripcion' => 'nullable|string',
            'metodo_depreciacion' => 'nullable|string|in:lineal,acelerada,unidades_producidas',
        ]);

        try {
            $category = AssetCategory::create($validated);
            return response()->json(['mensaje' => 'Categoría creada exitosamente', 'categoria' => $category], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear categoría: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, AssetCategory $category)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string|max:255',
            'codigo' => 'nullable|string|max:50|unique:asset_categories,codigo,' . $category->id,
            'descripcion' => 'nullable|string',
            'metodo_depreciacion' => 'nullable|string|in:lineal,acelerada,unidades_producidas',
        ]);

        try {
            $category->update(array_filter($validated, fn($v) => $v !== null));
            return response()->json(['mensaje' => 'Categoría actualizada exitosamente', 'categoria' => $category]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar categoría: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(AssetCategory $category)
    {
        try {
            if ($category->assets()->count() > 0) {
                return response()->json(['error' => 'No se puede eliminar: la categoría tiene activos asociados'], 422);
            }
            $category->delete();
            return response()->json(['mensaje' => 'Categoría eliminada exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar categoría: ' . $e->getMessage()], 500);
        }
    }
}
