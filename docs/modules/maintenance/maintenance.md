# Módulo Maintenance - Órdenes y Registros de Mantenimiento

## 1. Overview

El módulo **Maintenance** gestiona órdenes de mantenimiento preventivo y correctivo para activos fijos. Registra el ciclo completo de mantenimiento desde la creación de la orden, asignación, ejecución, hasta la finalización.

**Responsabilidades principales:**
- Crear órdenes de mantenimiento preventivo y correctivo
- Asignar órdenes a técnicos/responsables
- Registrar estado y progreso de ejecución
- Estimar y registrar costos reales
- Mantener historial de cambios de estado
- Generar reportes de mantenimiento realizado

**Stack técnico:**
- Backend: Laravel Controllers, Models
- Frontend: React/Inertia.js
- Base de datos: Relacional con soft deletes

---

## 2. Domain Model

### Entidades Principales

#### **MaintenanceOrder**
Tabla: `maintenance_orders`

Representa una orden de mantenimiento asociada a un activo.

**Atributos:**
- `numero` (string, única) - Numeración automática (MTO-YYYY-NNNNN)
- `asset_id` (FK) - Activo que requiere mantenimiento
- `tipo` (enum: 'preventivo', 'correctivo')
  - Preventivo: Mantenimiento programado
  - Correctivo: Reparación de averías
- `estado` (enum) - Ver estados
- `descripcion` (text, nullable) - Detalle del trabajo a realizar
- `fecha_programada` (date, nullable) - Cuándo se realizará
- `fecha_completada` (date, nullable) - Cuándo se completó
- `asignado_a_id` (FK, nullable) - Técnico asignado
- `usuario_id` (FK) - Quién creó la orden
- `costo_estimado` (decimal, nullable) - Presupuesto inicial
- `costo_real` (decimal, nullable) - Costo final actualizado
- `created_at`, `updated_at`, `deleted_at` (timestamps)

**Relaciones:**
- `activo()`: BelongsTo Asset
- `asignadoA()`: BelongsTo User (técnico)
- `usuario()`: BelongsTo User (creador)
- `historial()`: HasMany MaintenanceHistory - Registro de cambios

**Ubicación:** [app/Modules/Maintenance/Models/MaintenanceOrder.php](../../app/Modules/Maintenance/Models/MaintenanceOrder.php)

**Estados:**
```
- 'pendiente' - Orden creada, sin asignar
- 'programado' - Asignada, esperando fecha
- 'en_ejecucion' - Actualmente en reparación
- 'completado' - Finalizado y cerrado
- 'cancelado' - Cancelada sin realizar
```

#### **MaintenanceHistory**
Tabla: `maintenance_history`

Auditoría de transiciones de estado de cada orden.

**Atributos:**
- `maintenance_order_id` (FK)
- `estado_anterior` (enum) - Estado previo
- `estado_nuevo` (enum) - Nuevo estado
- `observaciones` (text, nullable) - Notas sobre el cambio
- `usuario_id` (FK) - Quién realizó el cambio
- `created_at` - Cuándo

**Ubicación:** [app/Modules/Maintenance/Models/MaintenanceHistory.php](../../app/Modules/Maintenance/Models/MaintenanceHistory.php)

---

## 3. Flujos Principales

### Flujo 1: Crear Orden de Mantenimiento

```
Usuario → POST /api/maintenance
   ↓
MaintenanceController::store()
   ├─ Validar campos: asset_id, tipo, fecha_programada (opcional)
   ├─ Generar número automático: MTO-YYYY-NNNNN
   ├─ Crear MaintenanceOrder con estado='pendiente'
   ├─ usuario_id = Usuario autenticado
   └─ Response: Orden creada (201)
```

### Flujo 2: Asignar Orden

```
Usuario → PUT /api/maintenance/{id}
   ├─ Actualizar: asignado_a_id, fecha_programada
   ├─ Si es primer cambio: estado = 'programado'
   ├─ Crear registro en MaintenanceHistory
   └─ Response: Orden actualizada
```

### Flujo 3: Cambiar Estado

```
Usuario → PUT /api/maintenance/{id}/status
   ├─ Validar transición de estado válida
   ├─ Actualizar estado
   ├─ Si estado='completado': registrar fecha_completada
   ├─ Crear MaintenanceHistory con cambio
   └─ Response: Estado actualizado
```

### Flujo 4: Registrar Costo Real

```
Usuario → PUT /api/maintenance/{id}
   ├─ Actualizar costo_real
   ├─ Si estado != 'completado': puede actualizar
   └─ Response: Costo actualizado
```

### Flujo 5: Ver Historial

```
GET /api/maintenance/{id}/history
   ├─ Obtener MaintenanceHistory ordenado cronológicamente
   └─ Response: Array de cambios de estado
```

---

## 4. API Endpoints

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/maintenance` | Listar órdenes | estado, asset_id, tipo, per_page |
| POST | `/api/maintenance` | Crear orden | asset_id, tipo, descripcion, fecha_programada, costo_estimado |
| GET | `/api/maintenance/options` | Opciones para select | - |
| GET | `/api/maintenance/{id}` | Ver detalle | - |
| PUT | `/api/maintenance/{id}` | Actualizar orden | asignado_a_id, fecha_programada, descripcion, costo_estimado, costo_real |
| PUT | `/api/maintenance/{id}/status` | Cambiar estado | estado |
| DELETE | `/api/maintenance/{id}` | Eliminar orden | - |
| GET | `/api/maintenance/{id}/history` | Historial de cambios | - |

### Parámetros Comunes

**GET /api/maintenance**
```
?estado=en_ejecucion   // Filtrar por estado
?asset_id=42           // Filtrar por activo
?tipo=preventivo        // Filtrar por tipo
?per_page=25           // Registros por página
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "numero": "MTO-2026-00001",
      "asset": { "id": 42, "codigo": "ACT-001", "nombre": "Laptop Dell" },
      "tipo": "preventivo",
      "estado": "en_ejecucion",
      "descripcion": "Limpieza y actualización de BIOS",
      "fecha_programada": "2026-08-15",
      "fecha_completada": null,
      "asignado_a": { "id": 10, "nombre": "Carlos López" },
      "costo_estimado": 150.00,
      "costo_real": null,
      "created_at": "2026-08-07"
    }
  ],
  "meta": { "current_page": 1, "total": 42 }
}
```

### Crear Orden - POST /api/maintenance

Validaciones:
- `asset_id` (required, exists)
- `tipo` (required, in: preventivo, correctivo)
- `descripcion` (nullable, string)
- `fecha_programada` (nullable, date, >= today)
- `costo_estimado` (nullable, numeric, >= 0)

### Cambiar Estado - PUT /api/maintenance/{id}/status

Transiciones válidas:
```
pendiente → programado
programado → en_ejecucion
en_ejecucion → completado
(cualquier estado) → cancelado
```

Payload:
```json
{
  "estado": "en_ejecucion"
}
```

---

## 5. Componentes Clave

### Controllers

**MaintenanceController** ([app/Modules/Maintenance/Http/Controllers/MaintenanceController.php](../../app/Modules/Maintenance/Http/Controllers/MaintenanceController.php))

Métodos:
- `index()` - Listar órdenes con filtros
- `store()` - Crear orden
- `show()` - Ver detalles con historial
- `update()` - Actualizar datos de orden
- `updateStatus()` - Cambiar estado
- `destroy()` - Eliminar (soft delete)
- `getOptions()` - Opciones para selects
- `getHistory()` - Historial de cambios

### Business Rules

1. **Numeración automática:** Formato MTO-YYYY-NNNNN (contador anual)
2. **Tipos:**
   - Preventivo: Mantenimiento programado, puede tener costo estimado
   - Correctivo: Reparación de averías, generalmente imprevisto
3. **Estados permitidos:** Solo transiciones válidas
4. **Costo:** Se estima al crear, se actualiza al completar
5. **Asignación:** Orden puede no estar asignada (en_progreso)

---

## 6. Integración con Otros Módulos

### Assets
- **Relación:** MaintenanceOrder.asset_id → Asset.id
- **Estado:** Activo puede estar en estado 'mantenimiento'
- **Bloqueos:** No se pueden mover activos en mantenimiento

### Employees
- **Asignación:** MaintenanceOrder.asignado_a_id → Employee.id o User.id
- **Técnicos:** Generalmente asignado a usuario técnico

### Reports
- **Reportes:** Reporte de órdenes de mantenimiento
  - Histórico por activo
  - Costos por período
  - Órdenes pendientes

---

## 7. Gaps y Riesgos

### Gaps Identificados

1. **Categorización de Mantenimiento**
   - No hay clasificación por tipo (eléctrico, mecánico, software, etc.)
   - No hay especialidades de técnicos

2. **Partes y Repuestos**
   - No hay registro de piezas utilizadas
   - No hay inventario de repuestos

3. **SLAs y Alertas**
   - No hay tiempo máximo de reparación
   - No hay alertas de órdenes retrasadas

4. **Integración Contable**
   - Costos no se registran en asientos contables
   - No hay vínculo con gastos de mantenimiento

5. **Documentación**
   - No hay campo para documentar trabajo realizado
   - No hay photos de antes/después

### Riesgos

1. **Costo Descontrolado**
   - Costo real puede cambiarse sin validación
   - Sin control de presupuesto

2. **Estados Inconsistentes**
   - Si se cancela una orden: ¿qué pasa con costos?
   - No hay rollback de cambios

3. **Asignación Sin Confirmación**
   - Técnico no confirma recibimiento de orden
   - Puede no enterarse de la asignación

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Maintenance/Models/MaintenanceOrder.php](../../app/Modules/Maintenance/Models/MaintenanceOrder.php) | Modelo orden |
| [app/Modules/Maintenance/Models/MaintenanceHistory.php](../../app/Modules/Maintenance/Models/MaintenanceHistory.php) | Modelo historial |
| [app/Modules/Maintenance/Http/Controllers/MaintenanceController.php](../../app/Modules/Maintenance/Http/Controllers/MaintenanceController.php) | Endpoints |
| [database/migrations/2024_02_25_000005_create_maintenance_tables.php](../../database/migrations/2024_02_25_000005_create_maintenance_tables.php) | Schema |
| [resources/js/Pages/Maintenance/Index.jsx](../../resources/js/Pages/Maintenance/Index.jsx) | Listado |

**Documento generado:** 2026-08-07  
**Estado:** Implementación básica, sin gestión de repuestos o documentación de trabajo
