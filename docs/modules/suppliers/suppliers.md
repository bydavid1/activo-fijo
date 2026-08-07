# Módulo Suppliers - Gestión de Proveedores

## 1. Overview

El módulo **Suppliers** gestiona el registro de proveedores de activos fijos. Mantiene un catálogo centralizado de proveedores con información de contacto y comercial.

**Responsabilidades principales:**
- Registro y mantenimiento de proveedores
- Contacto y información comercial
- Vinculación con activos adquiridos
- Búsqueda y filtrado de proveedores

**Stack técnico:**
- Backend: Laravel Controller, Model
- Frontend: React/Inertia.js (componentes básicos)
- Base de datos: Tabla relacional con soft deletes

---

## 2. Domain Model

### Entidades Principales

#### **Supplier**
Tabla: `suppliers`

**Atributos:**
- `nombre` (string) - Razón social del proveedor
- `codigo` (string, única) - Identificador interno
- `nit` (string, nullable) - NIT/Número fiscal
- `email` (string, nullable) - Email de contacto
- `telefono` (string, nullable) - Teléfono
- `direccion` (text, nullable) - Dirección física
- `ciudad` (string, nullable) - Ciudad
- `created_at`, `updated_at`, `deleted_at` (timestamps)

**Relaciones:**
- `activos()`: HasMany Asset - Activos provisionados por este proveedor

**Ubicación:** [app/Modules/Suppliers/Models/Supplier.php](../../app/Modules/Suppliers/Models/Supplier.php)

**Índices:**
- Tabla indexada por código para búsqueda rápida

---

## 3. Flujos Principales

### Flujo 1: Crear Proveedor

```
Usuario → POST /api/suppliers
   ↓
SupplierController::store()
   ├─ Validar codigo (único)
   ├─ Validar nombre (requerido)
   ├─ Validar email (formato) y NIT (si aplica)
   ├─ Supplier::create()
   └─ Response: Supplier creado (201)
```

### Flujo 2: Listar Proveedores

```
GET /api/suppliers
   ├─ Filtrar por search (nombre, código, NIT)
   ├─ Paginar resultados
   └─ Response: Array de proveedores
```

### Flujo 3: Validar Eliminación

```
DELETE /api/suppliers/{id}
   ├─ Verificar si tiene activos asociados
   ├─ Si tiene: Response 422 (No se puede eliminar)
   └─ Si no: Soft delete → Response 200
```

---

## 4. API Endpoints

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/suppliers` | Listar proveedores | search, per_page |
| POST | `/api/suppliers` | Crear proveedor | nombre, codigo, nit, email, telefono, direccion, ciudad |
| GET | `/api/suppliers/{id}` | Ver detalles | - |
| PUT | `/api/suppliers/{id}` | Actualizar | Campos a actualizar |
| DELETE | `/api/suppliers/{id}` | Eliminar (si no tiene activos) | - |

### Parámetros

**GET /api/suppliers**
```
?search=ACME          // Busca en nombre, código, NIT
?per_page=25          // Registros por página (default: 15)
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "nombre": "Distribuidora ACME",
      "codigo": "SUPP-001",
      "nit": "123456789-1",
      "email": "info@acme.com",
      "telefono": "+34 666 555 444",
      "direccion": "Calle Principal 123",
      "ciudad": "Madrid"
    }
  ],
  "meta": { "current_page": 1, "total": 28 }
}
```

### Crear Proveedor - POST /api/suppliers

Validaciones:
- `nombre` (required, string, max 255)
- `codigo` (required, string, max 50, unique)
- `nit` (nullable, string, max 50)
- `email` (nullable, email)
- `telefono` (nullable, string, max 50)
- `direccion` (nullable, string)
- `ciudad` (nullable, string, max 255)

Request:
```json
{
  "nombre": "Proveedor XYZ S.A.",
  "codigo": "PROV-042",
  "nit": "987654321-0",
  "email": "ventas@xyz.com",
  "telefono": "+34 911 222 333",
  "direccion": "Avenida Tecnológica 456",
  "ciudad": "Barcelona"
}
```

### Actualizar - PUT /api/suppliers/{id}

Validaciones:
- `codigo` unique (excluyendo este proveedor)
- Los demás campos son opcionales

### Eliminar - DELETE /api/suppliers/{id}

Respuestas:
- **200 OK:** Proveedor eliminado (soft delete)
- **422 Unprocessable Entity:** Si tiene activos asociados
  ```json
  {
    "error": "No se puede eliminar: el proveedor tiene activos asociados"
  }
  ```

---

## 5. Componentes Clave

### Controllers

**SupplierController** ([app/Modules/Suppliers/Http/Controllers/SupplierController.php](../../app/Modules/Suppliers/Http/Controllers/SupplierController.php))

Métodos:
- `index()` - Listar con búsqueda y paginación
- `show()` - Ver detalles con activos asociados
- `store()` - Crear proveedor
- `update()` - Actualizar proveedor
- `destroy()` - Eliminar con validación

**Implementación:**
- Búsqueda por nombre, código, NIT
- Validación de unicidad de código
- Carga de relación `activos` en show

### Business Rules

1. **Código único:** No pueden existir dos proveedores con el mismo código
2. **Email válido:** Si se proporciona, debe ser formato válido
3. **No eliminable con activos:** Si tiene activos vinculados, no se puede eliminar
4. **Soft delete:** La eliminación es soft delete (no elimina datos)

---

## 6. Integración con Otros Módulos

### Assets
- **Relación:** Asset.proveedor_id → Supplier.id (FK)
- **Trazabilidad:** Cada activo registra quién fue el proveedor
- **Validación en eliminación:** No se elimina supplier si tiene activos

---

## 7. Gaps y Riesgos

### Gaps Identificados

1. **UI React**
   - Componente en [resources/js/Pages/Suppliers/Index.jsx](../../resources/js/Pages/Suppliers/Index.jsx) es basic
   - Necesita implementación completa

2. **Información de Contacto**
   - No hay campos para múltiples contactos
   - No hay campo de sitio web, horarios, etc.

3. **Categorización**
   - Sin clasificación de tipo de proveedor
   - Sin estados (activo, inactivo, suspendido)

4. **Historial de Compras**
   - No hay agregación de total comprado por proveedor
   - No hay análisis de plazos de entrega

### Riesgos

1. **Eliminación Accidental**
   - Aunque hay validación, usuario podría confundirse
   - No hay confirmación UI

2. **Duplicación**
   - Sin deduplicación automática (ej: mismo NIT con diferente nombre)

3. **Código Obligatorio**
   - Si es manual, riesgo de duplicación
   - Sin prefijo automático

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Suppliers/Models/Supplier.php](../../app/Modules/Suppliers/Models/Supplier.php) | Modelo principal |
| [app/Modules/Suppliers/Http/Controllers/SupplierController.php](../../app/Modules/Suppliers/Http/Controllers/SupplierController.php) | Endpoints CRUD |
| [database/migrations/2024_02_25_000001_create_asset_tables.php](../../database/migrations/2024_02_25_000001_create_asset_tables.php) | Schema (definido en migration de assets) |
| [resources/js/Pages/Suppliers/Index.jsx](../../resources/js/Pages/Suppliers/Index.jsx) | Listado (en desarrollo) |

**Documento generado:** 2026-08-07  
**Estado:** Implementación básica, funcionalidad CRUD completada
