<?php

namespace App\Modules\Accounting\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Accounting\Models\AccountingAccount;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AccountingAccountController extends Controller
{
    /**
     * Mostrar la vista principal del catálogo de cuentas
     */
    public function index()
    {
        return Inertia::render('Accounting/Accounts/Index');
    }

    /**
     * Obtener el listado de cuentas para API (árbol o plano)
     */
    public function apiIndex(Request $request)
    {
        $query = AccountingAccount::with('parent')->orderBy('codigo');

        if ($request->has('tipo') && $request->tipo) {
            $query->where('tipo', $request->tipo);
        }

        if ($request->has('plano')) {
            return response()->json($query->get());
        }

        // Si es jerárquico (para un TreeTable), filtramos solo padres de nivel 1
        $cuentas = $query->get();
        return response()->json($this->buildTree($cuentas));
    }

    /**
     * Construir el árbol en memoria para PrimeReact TreeTable
     */
    private function buildTree($elements, $parentId = null)
    {
        $branch = [];

        foreach ($elements as $element) {
            if ($element->parent_id == $parentId) {
                $children = $this->buildTree($elements, $element->id);
                $data = [
                    'key' => $element->id,
                    'data' => [
                        'id' => $element->id,
                        'codigo' => $element->codigo,
                        'nombre' => $element->nombre,
                        'tipo' => $element->tipo,
                        'estado' => $element->estado,
                        'nivel' => $element->nivel,
                    ]
                ];

                if ($children) {
                    $data['children'] = $children;
                }

                $branch[] = $data;
            }
        }

        return $branch;
    }

    /**
     * Almacenar una nueva cuenta contable
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:accounting_accounts,id',
            'codigo' => 'required|string|unique:accounting_accounts,codigo',
            'nombre' => 'required|string|max:255',
            'tipo' => 'required|in:activo,pasivo,patrimonio,ingreso,gasto',
            'estado' => 'required|in:activo,inactivo',
        ]);

        $nivel = 1;
        if ($request->parent_id) {
            $parent = AccountingAccount::find($request->parent_id);
            $nivel = $parent->nivel + 1;
            // Asegurarnos que una subcuenta tenga el mismo tipo que la cuenta principal
            $validated['tipo'] = $parent->tipo;
        }

        $validated['nivel'] = $nivel;

        $account = AccountingAccount::create($validated);

        return response()->json([
            'message' => 'Cuenta contable creada con éxito',
            'account' => $account
        ], 201);
    }

    /**
     * Actualizar una cuenta contable
     */
    public function update(Request $request, AccountingAccount $account)
    {
        $validated = $request->validate([
            'parent_id' => 'nullable|exists:accounting_accounts,id',
            'codigo' => 'required|string|unique:accounting_accounts,codigo,' . $account->id,
            'nombre' => 'required|string|max:255',
            'estado' => 'required|in:activo,inactivo',
        ]);

        if ($request->parent_id && $request->parent_id !== $account->parent_id) {
            if ($request->parent_id == $account->id) {
               return response()->json(['message' => 'Una cuenta no puede ser recursiva a sí misma'], 422);
            }
            $parent = AccountingAccount::find($request->parent_id);
            $account->nivel = $parent->nivel + 1;
            $account->tipo = $parent->tipo;
        }

        $account->update($validated);

        return response()->json([
            'message' => 'Cuenta contable actualizada con éxito',
            'account' => $account
        ]);
    }
}
