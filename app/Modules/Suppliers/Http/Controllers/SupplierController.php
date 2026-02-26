<?php

namespace App\Modules\Suppliers\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Suppliers\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $query = Supplier::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', "%{$search}%")
                  ->orWhere('codigo', 'like', "%{$search}%")
                  ->orWhere('nit', 'like', "%{$search}%");
            });
        }

        $perPage = $request->get('per_page', 15);
        return response()->json($query->paginate($perPage));
    }

    public function show(Supplier $supplier)
    {
        $supplier->load('activos');
        return response()->json($supplier);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'codigo' => 'required|string|max:50|unique:suppliers,codigo',
            'nit' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string',
            'ciudad' => 'nullable|string|max:255',
        ]);

        try {
            $supplier = Supplier::create($validated);
            return response()->json(['mensaje' => 'Proveedor creado exitosamente', 'proveedor' => $supplier], 201);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al crear proveedor: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, Supplier $supplier)
    {
        $validated = $request->validate([
            'nombre' => 'nullable|string|max:255',
            'codigo' => 'nullable|string|max:50|unique:suppliers,codigo,' . $supplier->id,
            'nit' => 'nullable|string|max:50',
            'email' => 'nullable|email|max:255',
            'telefono' => 'nullable|string|max:50',
            'direccion' => 'nullable|string',
            'ciudad' => 'nullable|string|max:255',
        ]);

        try {
            $supplier->update(array_filter($validated, fn($v) => $v !== null));
            return response()->json(['mensaje' => 'Proveedor actualizado exitosamente', 'proveedor' => $supplier]);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al actualizar proveedor: ' . $e->getMessage()], 500);
        }
    }

    public function destroy(Supplier $supplier)
    {
        try {
            if ($supplier->activos()->count() > 0) {
                return response()->json(['error' => 'No se puede eliminar: el proveedor tiene activos asociados'], 422);
            }
            $supplier->delete();
            return response()->json(['mensaje' => 'Proveedor eliminado exitosamente']);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al eliminar proveedor: ' . $e->getMessage()], 500);
        }
    }
}
