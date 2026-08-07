# Módulo Inventory - Ciclos de Inventario y Auditorías

## 1. Overview

El módulo **Inventory** gestiona dos tipos de operaciones:

1. **Ciclos de Inventario**: Procesos de control sistemático de existencia de activos por ubicación
2. **Auditorías de Inventario (Levantamientos)**: Verificación exhaustiva con filtros por categoría, ubicación y responsable

**Responsabilidades principales:**
- Creación y gestión de ciclos de inventario
- Captura de códigos QR durante auditoría
- Identificación de discrepancias (faltantes, ubicación incorrecta)
- Seguimiento de estado de discrepancias (detectada → pendiente aprobación → aprobada/rechazada → resuelta)
- Auditoría de transiciones de estado
- Reporte de hallazgos

**Stack técnico:**
- Backend: Laravel Controllers, Models, Services, Events
- Frontend: React/Inertia.js con scanner QR
- Base de datos: Relacional con soft deletes, transiciones auditadas

---

## 2. Domain Model

### Entidades Principales

#### **InventoryAudit** (Levantamiento de Inventario)
Tabla: `inventory_audits`

Define un levantamiento completo con criterios de filtrado.

**Atributos:**
- `codigo` (string, única) - Código único del levantamiento
- `nombre` (string) - Nombre descriptivo
- `descripcion` (text, nullable) - Detalles del levantamiento
- `criterios` (json) - Filtros aplicados al levantamiento:
  - `category_ids`: Categorías de activos a auditar
  - `location_ids`: Ubicaciones específicas
  - `employee_ids`: Responsables de bienes a verificar
- `estado` (enum) - Ver estados
- `total_activos_esperados` (integer) - Cantidad esperada según filtros
- `total_activos_encontrados` (integer) - Cantidad efectivamente encontrada
- `created_by` (FK) - Usuario que creó el levantamiento
- `fecha_inicio` (datetime) - Cuando inició
- `fecha_finalizacion` (datetime, nullable) - Cuando finalizó

**Relaciones:**
- `creator()`: BelongsTo User
- `items()`: HasMany InventoryAuditItem - Items escaneados/verificados
- `findings()`: HasMany InventoryAuditFinding - Hallazgos/discrepancias
- `itemsEncontrados()`: Scope para items con estado 'found'
- `itemsFaltantes()`: Scope para items con estado 'missing'
- `itemsDiscrepantes()`: Scope para items con estado 'discrepant'

**Ubicación:** [app/Modules/Inventory/Models/InventoryAudit.php](../../app/Modules/Inventory/Models/InventoryAudit.php)

**Estados:**
```
- 'planeado' - Creado pero no iniciado
- 'en_ejecucion' - Escaneo en progreso
- 'captura_completa' - Todos los items escaneados
- 'en_reconciliacion' - Analizando discrepancias
- 'completado' - Finalizado y aprobado
```

#### **InventoryAuditItem**
Tabla: `inventory_audit_items`

Registro de cada activo verificado en el levantamiento.

**Atributos:**
- `audit_id` (FK) - Levantamiento al que pertenece
- `asset_id` (FK) - Activo verificado
- `estado` (enum: 'found', 'missing', 'discrepant') - Resultado del escaneo
- `fecha_escaneo` (datetime) - Cuándo se escaneó
- `usuario_id` (FK) - Quién lo escaneó

**Relaciones:**
- `audit()`: BelongsTo InventoryAudit
- `asset()`: BelongsTo Asset

#### **InventoryAuditFinding**
Tabla: `inventory_audit_findings`

Hallazgos/discrepancias detectadas durante el levantamiento.

**Atributos:**
- `audit_id` (FK)
- `asset_id` (FK)
- `tipo` (enum) - Tipo de hallazgo
- `descripcion` (text) - Detalle del hallazgo
- `severidad` (enum: 'baja', 'media', 'alta') - Gravedad

**Tipos de Hallazgo:**
```
- 'faltante' - Activo esperado no encontrado
- 'ubicacion_incorrecta' - Activo en ubicación diferente a la registrada
- 'responsable_incorrecto' - Responsable diferente al registrado
- 'estado_incorrecto' - Estado diferente al registrado
- 'activo_no_esperado' - Activo encontrado pero no esperado
- 'otro' - Otro hallazgo
```

**Ubicación:** [app/Modules/Inventory/Models/InventoryAuditFinding.php](../../app/Modules/Inventory/Models/InventoryAuditFinding.php)

#### **InventoryCycle** (Ciclo de Inventario)
Tabla: `inventory_cycles`

Define un ciclo de inventario para una ubicación específica.

**Atributos:**
- `nombre` (string)
- `estado` (enum) - Ver estados
- `fecha_inicio` (date, nullable)
- `fecha_fin` (date, nullable)
- `ubicacion_id` (FK) - Ubicación a inventariar
- `usuario_responsable_id` (FK) - Usuario responsable del ciclo
- `notas` (text, nullable)

**Estados:**
```
- 'planeado' - Planificado
- 'en_ejecucion' - Captura en curso
- 'captura_completa' - Todos capturados
- 'en_reconciliacion' - Análisis de discrepancias
- 'completado' - Finalizado
```

**Relaciones:**
- `ubicacion()`: BelongsTo AssetLocation
- `usuarioResponsable()`: BelongsTo User
- `capturas()`: HasMany InventoryCapture - Items capturados
- `discrepancias()`: HasMany InventoryDiscrepancy - Discrepancias

**Ubicación:** [app/Modules/Inventory/Models/InventoryCycle.php](../../app/Modules/Inventory/Models/InventoryCycle.php)

#### **InventoryCapture**
Tabla: `inventory_captures`

Registro de cada captura durante un ciclo.

**Atributos:**
- `cycle_id` (FK)
- `asset_id` (FK)
- `capturado_por_id` (FK) - Usuario que capturó
- `metodo` (enum: 'manual', 'qr') - Cómo se capturó
- `timestamp` - Cuándo

#### **InventoryDiscrepancy**
Tabla: `inventory_discrepancies`

Discrepancias identificadas durante ciclo de inventario.

**Atributos:**
- `cycle_id` (FK)
- `asset_id` (FK)
- `estado` (enum) - Ver estados
- `tipo_discrepancia` (enum) - faltante, ubicacion_incorrecta, otro
- `descripcion` (text, nullable) - Descripción de la discrepancia
- `usuario_id` (FK) - Quién la reportó
- `aprobado_por_id` (FK, nullable) - Quién la aprobó/rechazó
- `notas_aprobacion` (text, nullable) - Razón de aprobación/rechazo

**Estados de Discrepancia:**
```
- 'detectada' - Identificada, sin revisión
- 'pendiente_aprobacion' - En cola de revisión
- 'aprobada' - Aprobada por responsable
- 'rechazada' - Rechazada, se descarta
- 'resuelta' - Resuelta (activo encontrado, ubicación corregida, etc.)
```

**Ubicación:** [app/Modules/Inventory/Models/InventoryDiscrepancy.php](../../app/Modules/Inventory/Models/InventoryDiscrepancy.php)

#### **DiscrepancyTransition**
Tabla: `discrepancy_transitions`

Auditoría de todos los cambios de estado de una discrepancia.

**Atributos:**
- `discrepancy_id` (FK)
- `estado_anterior` (string) - Estado anterior
- `estado_nuevo` (string) - Nuevo estado
- `usuario_id` (FK) - Quién hizo el cambio
- `razon` (text, nullable) - Motivo del cambio
- `created_at` - Cuándo

---

## 3. Flujos Principales

### Flujo 1: Crear Levantamiento de Inventario

```
Usuario → POST /api/inventory-audits
   ↓
InventoryAuditController::store()
   ├─ Validar campos: nombre, criterios (categorías/ubicaciones/responsables)
   ├─ Generar código único (AUDIT-YYYYMMDD-NNNN)
   ├─ Calcular total_activos_esperados según criterios
   ├─ Crear InventoryAudit con estado='planeado'
   └─ Response: Auditoría creada (201)
```

### Flujo 2: Iniciar Levantamiento

```
POST /api/inventory-audits/{id}/iniciar
   ├─ Cambiar estado a 'en_ejecucion'
   ├─ Registrar fecha_inicio
   └─ Response: Levantamiento iniciado
```

### Flujo 3: Escanear Código QR

```
User en Scanner → Escanea QR de activo
   ↓
POST /api/inventory-audits/{id}/escanear
   ├─ Leer código QR → obtener asset_id
   ├─ Crear InventoryAuditItem con:
   │  ├─ estado = 'found' (se encontró)
   │  ├─ asset_id = escaneado
   │  └─ usuario_id = usuario actual
   ├─ Comparar con criterios del levantamiento:
   │  ├─ Si activo NO cumple criterios → Warning (¿Incluir?)
   │  ├─ Si activo SÍ cumple → Marcar como encontrado
   │  └─ Si activo ya estaba en espera → Actualizar estado
   ├─ Calcular parciales
   └─ Response: Item registrado
```

### Flujo 4: Finalizar Levantamiento

```
POST /api/inventory-audits/{id}/finalizar
   ├─ Validar que se escanearon todos los esperados (o permitir finalizar con diferencias)
   ├─ Calcular discrepancias automáticamente:
   │  ├─ Activos esperados pero NO encontrados → tipo 'faltante'
   │  ├─ Activos encontrados pero NO esperados → tipo 'no_esperado'
   │  └─ Ubicación/responsable incorrecto → tipo 'ubicacion_incorrecta'
   ├─ Crear registros de InventoryAuditFinding
   ├─ Cambiar estado a 'captura_completa'
   ├─ Registrar fecha_finalizacion
   └─ Response: Levantamiento finalizado
```

### Flujo 5: Generar Reporte

```
GET /api/inventory-audits/{id}/reporte
   ├─ Obtener auditoría con items y findings
   ├─ Compilar estadísticas:
   │  ├─ Total esperado vs encontrado
   │  ├─ Porcentaje de coincidencia
   │  └─ Distribución de discrepancias por tipo
   └─ Response: Datos para reporte
```

### Flujo 6: Ciclo de Inventario (Alternativo)

```
Usuario → POST /api/inventory/cycles
   ├─ Crear ciclo para ubicación específica
   ├─ Estado inicial: 'planeado'
   └─ Response: Ciclo creado

PUT /api/inventory/cycles/{id}/status
   ├─ Cambiar estado: planeado → en_ejecucion → captura_completa → ...
   └─ Response: Estado actualizado

POST /api/inventory/cycles/{id}/captures
   ├─ Registrar captura de activo
   ├─ Crear InventoryCapture
   └─ Response: Captura registrada
```

---

## 4. API Endpoints

### Levantamientos (Auditorías)

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/inventory-audits` | Listar levantamientos | estado, search, per_page |
| POST | `/api/inventory-audits` | Crear levantamiento | nombre, descripcion, criterios |
| GET | `/api/inventory-audits/options` | Opciones para select | - |
| GET | `/api/inventory-audits/{id}` | Ver detalles | - |
| DELETE | `/api/inventory-audits/{id}` | Eliminar levantamiento | - |
| POST | `/api/inventory-audits/{id}/iniciar` | Iniciar levantamiento | - |
| POST | `/api/inventory-audits/{id}/escanear` | Escanear código QR | codigo_qr, asset_id |
| POST | `/api/inventory-audits/{id}/finalizar` | Finalizar levantamiento | - |
| GET | `/api/inventory-audits/{id}/reporte` | Generar reporte | - |

### Ciclos de Inventario

| Método | Ruta | Función |
|--------|------|---------|
| GET | `/api/inventory/cycles` | Listar ciclos |
| POST | `/api/inventory/cycles` | Crear ciclo |
| PUT | `/api/inventory/cycles/{id}/status` | Actualizar estado |
| POST | `/api/inventory/cycles/{id}/captures` | Registrar captura |
| GET | `/api/inventory/cycles/{id}/discrepancies` | Listar discrepancias |

### Discrepancias

| Método | Ruta | Función |
|--------|------|---------|
| PUT | `/api/inventory/discrepancies/{id}/approve` | Aprobar discrepancia |
| PUT | `/api/inventory/discrepancies/{id}/reject` | Rechazar discrepancia |
| GET | `/api/inventory/discrepancies/{id}/transitions` | Historial de transiciones |

### Parámetros Comunes

**GET /api/inventory-audits**
```
?estado=en_ejecucion     // Filtrar por estado
?search=audit-001        // Buscar por código/nombre/descripción
?per_page=25
```

**POST /api/inventory-audits**
```json
{
  "nombre": "Auditoría Oficinas Planta 1",
  "descripcion": "Verificación semestral",
  "criterios": {
    "category_ids": [1, 2, 3],
    "location_ids": [5],
    "employee_ids": [10, 12]
  }
}
```

**POST /api/inventory-audits/{id}/escanear**
```json
{
  "codigo_qr": "ACT-2024-00001",
  "asset_id": 42
}
```

---

## 5. Componentes Clave

### Controllers

**InventoryAuditController** ([app/Modules/Inventory/Http/Controllers/InventoryAuditController.php](../../app/Modules/Inventory/Http/Controllers/InventoryAuditController.php))

Métodos:
- `index()` - Listar auditorías con filtros
- `store()` - Crear auditoría
- `show()` - Ver detalles
- `destroy()` - Eliminar
- `iniciar()` - Cambiar a 'en_ejecucion'
- `escanearCodigo()` - Procesar escaneo QR
- `finalizar()` - Completar y generar discrepancias
- `reporte()` - Generar reporte de hallazgos

**InventoryController** ([app/Modules/Inventory/Http/Controllers/InventoryController.php](../../app/Modules/Inventory/Http/Controllers/InventoryController.php))

Métodos para ciclos de inventario:
- `listCycles()` - Listar ciclos
- `createCycle()` - Crear ciclo
- `updateCycleStatus()` - Cambiar estado del ciclo
- `captureAsset()` - Registrar captura
- `listDiscrepancies()` - Listar discrepancias de ciclo
- `approveDiscrepancy()` - Aprobar discrepancia
- `rejectDiscrepancy()` - Rechazar discrepancia
- `getTransitions()` - Historial de estado

### Business Rules

1. **Creación de Auditoría:**
   - Criterios pueden estar vacíos (audita todos)
   - Nombre obligatorio
   - Se calcula total_activos_esperados al crear

2. **Escaneo QR:**
   - Un activo puede escanearse múltiples veces (se registra cada una)
   - Si activo NO cumple criterios: Se incluye como "no esperado" pero se registra
   - Si ya fue escaneado: Se ignora la duplicación (o se cuenta como re-verificación)

3. **Finalización:**
   - Se generan hallazgos automáticamente comparando esperados vs encontrados
   - No impide finalizar aunque haya diferencias

4. **Discrepancias:**
   - Estados tienen transiciones válidas definidas
   - Cada cambio se audita en DiscrepancyTransition
   - Aprobación/rechazo requiere usuario y nota

---

## 6. Integración con Otros Módulos

### Assets
- **Relación:** InventoryAuditItem.asset_id → Asset.id
- **Verificación:** Ciclos y auditorías verifican existencia física de activos
- **Estados:** Estado de activo puede cambiar tras discrepancias

### Locations
- **Relación:** InventoryCycle.ubicacion_id → AssetLocation.id
- **Ciclos por ubicación:** Se crean ciclos de inventario por ubicación

### Employees
- **Responsables:** Usuario responsable del ciclo/auditoría
- **Filtros:** Auditoría puede filtrar activos por responsable

---

## 7. Gaps y Riesgos

### Gaps Identificados

1. **Interfaz de Scanner QR**
   - Componente InventoryAudits/Scanner en web-routes pero UI en desarrollo
   - Necesita scanner en tiempo real

2. **Validación de Códigos**
   - No hay validación que código QR corresponda a asset_id enviado
   - Riesgo de inconsistencia

3. **Filtros de Auditoría**
   - Criterios almacenados en JSON pero no hay UI clara para selección
   - Puede ser confuso qué se está auditando

4. **Resolución de Discrepancias**
   - No hay flujo claro de cómo se "resuelven" las discrepancias
   - Estado 'resuelta' pero no hay acción asociada

5. **Reporte PDF**
   - No hay generación de reporte PDF
   - Solo datos JSON disponibles

### Riesgos

1. **Duplicación de Escaneos**
   - Si usuario escanea dos veces accidentalmente: se registra dos veces
   - Podría inflar números

2. **No Atomicidad**
   - Si finalización falla a mitad: estado inconsistente
   - Falta transacción de base de datos

3. **Perdida de Criterios**
   - Criterios están en JSON, difícil de actualizar post-creación
   - Si se quiere cambiar filtro: debe crear nueva auditoría

4. **Performance**
   - Finalizando con muchos activos: cálculo de discrepancias puede ser lento
   - Sin índices adecuados en busquedas

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Inventory/Models/InventoryAudit.php](../../app/Modules/Inventory/Models/InventoryAudit.php) | Modelo levantamiento |
| [app/Modules/Inventory/Models/InventoryCycle.php](../../app/Modules/Inventory/Models/InventoryCycle.php) | Modelo ciclo |
| [app/Modules/Inventory/Models/InventoryDiscrepancy.php](../../app/Modules/Inventory/Models/InventoryDiscrepancy.php) | Modelo discrepancia |
| [app/Modules/Inventory/Http/Controllers/InventoryAuditController.php](../../app/Modules/Inventory/Http/Controllers/InventoryAuditController.php) | Endpoints auditoría |
| [app/Modules/Inventory/Http/Controllers/InventoryController.php](../../app/Modules/Inventory/Http/Controllers/InventoryController.php) | Endpoints ciclos |
| [database/migrations/2024_02_25_000004_create_inventory_tables.php](../../database/migrations/2024_02_25_000004_create_inventory_tables.php) | Schema |
| [resources/js/Pages/InventoryAudits/Index.jsx](../../resources/js/Pages/InventoryAudits/Index.jsx) | Listado auditorías |
| [resources/js/Pages/InventoryAudits/Scanner.jsx](../../resources/js/Pages/InventoryAudits/Scanner.jsx) | Scanner QR (en desarrollo) |
| [resources/js/Pages/InventoryAudits/Report.jsx](../../resources/js/Pages/InventoryAudits/Report.jsx) | Reporte (en desarrollo) |

**Documento generado:** 2026-08-07  
**Estado:** Estructura definida, scanner y reportes en desarrollo
