# Módulo Employees - Gestión de Empleados

## 1. Overview

El módulo **Employees** gestiona el registro de empleados en el sistema. Soporta tanto registro local como integración con sistemas externos (SAP, Adobe, etc.) mediante APIs.

**Responsabilidades principales:**
- Registro y mantenimiento de empleados locales
- Sincronización con APIs externas
- Gestión de integraciones por sistema
- Audit trail de sincronización
- Validación de unicidad de email y código

**Stack técnico:**
- Backend: Laravel Controllers, Models, Services, Events
- Frontend: React/Inertia.js (componentes en desarrollo)
- Base de datos: Relacional con soft deletes

---

## 2. Domain Model

### Entidades Principales

#### **Employee**
Tabla: `employees`

**Atributos:**
- `codigo` (string, única) - Identificador único del empleado
- `nombre` (string) - Nombre completo
- `email` (string, única) - Email corporativo
- `departamento` (string, nullable) - Departamento o área
- `puesto` (string, nullable) - Cargo/posición
- `telefono` (string, nullable) - Teléfono de contacto
- `deleted_at` - Para soft delete

**Relaciones:**
- `integraciones()`: HasMany EmployeeIntegration - Integraciones con sistemas externos
- `sincronizacionLogs()`: HasMany EmployeeSyncLog - Historial de sincronización

**Ubicación:** [app/Modules/Employees/Models/Employee.php](../../app/Modules/Employees/Models/Employee.php)

#### **EmployeeIntegration**
Tabla: `employee_integrations`

Registra mapeos entre empleados locales e identificadores en sistemas externos.

**Atributos:**
- `employee_id` (FK)
- `sistema_externo` (string) - Ej: 'SAP', 'Adobe', 'LDAP'
- `id_externo` (string, única por sistema) - ID en el sistema externo
- `ultima_sincronizacion` (timestamp, nullable)
- `metadata` (json, nullable) - Datos adicionales del sistema

**Ubicación:** [app/Modules/Employees/Models/EmployeeIntegration.php](../../app/Modules/Employees/Models/EmployeeIntegration.php)

#### **EmployeeSyncLog**
Tabla: `employee_sync_logs`

Auditoría de todas las operaciones de sincronización.

**Atributos:**
- `employee_id` (FK, nullable)
- `accion` (enum: 'creado', 'actualizado', 'eliminado')
- `estado` (enum: 'exitoso', 'error')
- `respuesta` (json, nullable) - Respuesta del servidor externo
- `mensaje_error` (text, nullable) - Detalle de error si aplica

**Ubicación:** [app/Modules/Employees/Models/EmployeeSyncLog.php](../../app/Modules/Employees/Models/EmployeeSyncLog.php)

---

## 3. Flujos Principales

### Flujo 1: Crear Empleado Local

```
Usuario → POST /api/employees
   ↓
EmployeeController::store()
   ├─ Validar configuración (si employee_source != 'external_api')
   ├─ Validar campos: codigo (único), nombre, email (único)
   ├─ EmployeeSyncService::createLocal()
   │  ├─ Crear Employee
   │  └─ No crear integración (es local)
   ├─ Disparar evento EmployeeCreated
   └─ Response: Employee creado (201)
```

**Validaciones:**
- `codigo` único
- `nombre` requerido
- `email` único y formato válido

### Flujo 2: Sincronizar desde API Externa

```
Sistema (Scheduler) → Ejecuta sync job
   ↓
EmployeeController::syncExternal()
   ├─ Obtener proveedor configurado
   ├─ EmployeeSyncService::syncFromExternal()
   │  ├─ Obtener empleados de API: provider.getEmployees()
   │  ├─ Para cada empleado externo:
   │  │  ├─ syncEmployee(datosExternos)
   │  │  │  ├─ Buscar por id_externo en EmployeeIntegration
   │  │  │  ├─ Si existe: actualizar Employee y logs
   │  │  │  └─ Si no existe: crear Employee e integración
   │  │  └─ Registrar resultado en EmployeeSyncLog
   │  └─ Retornar resumen (creados, actualizados, errores)
   └─ Response: Resumen de sincronización
```

**Registro del Log:**
- Acción: 'creado' | 'actualizado' | 'eliminado'
- Estado: 'exitoso' | 'error'
- Si error: guardar mensaje_error y respuesta

### Flujo 3: Ver Historial de Sincronización

```
Usuario → GET /api/employees/{id}/sync-logs
   ↓
EmployeeController::getSyncLogs()
   ├─ Obtener últimos logs del empleado
   └─ Response: Array de logs ordenados por fecha
```

---

## 4. API Endpoints

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/employees` | Listar empleados | search, departamento, per_page |
| POST | `/api/employees` | Crear empleado | codigo, nombre, email, departamento, puesto, telefono |
| GET | `/api/employees/{id}` | Ver detalles | - |
| PUT | `/api/employees/{id}` | Actualizar empleado | campos a actualizar |
| POST | `/api/employees/sync` | Sincronizar desde API | - |
| GET | `/api/employees/{id}/sync-logs` | Historial de sincronización | - |

### Parámetros de Listar

**GET /api/employees**
```
?search=john          // Buscar en código, nombre, email
?departamento=IT      // Filtrar por departamento
?per_page=25          // Registros por página (default: 15)
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "codigo": "EMP-001",
      "nombre": "John Doe",
      "email": "john@company.com",
      "departamento": "IT",
      "puesto": "Developer",
      "integraciones": [
        {
          "sistema_externo": "SAP",
          "id_externo": "SAP-12345"
        }
      ]
    }
  ],
  "meta": { "current_page": 1, "total": 42 }
}
```

### Crear Empleado - POST /api/employees

Validaciones:
- `codigo` (required, unique)
- `nombre` (required, string)
- `email` (required, unique, email)
- `departamento` (nullable, string)
- `puesto` (nullable, string)
- `telefono` (nullable, string)

Request:
```json
{
  "codigo": "EMP-042",
  "nombre": "Jane Smith",
  "email": "jane@company.com",
  "departamento": "HR",
  "puesto": "Manager",
  "telefono": "+34 666 555 444"
}
```

---

## 5. Componentes Clave

### Controllers

**EmployeeController** ([app/Modules/Employees/Http/Controllers/EmployeeController.php](../../app/Modules/Employees/Http/Controllers/EmployeeController.php))

Métodos:
- `index()` - Listar con filtros (search, departamento, per_page)
- `show()` - Ver detalles con integraciones y logs
- `store()` - Crear empleado local
- `update()` - Actualizar empleado
- `syncExternal()` - Disparar sincronización desde API
- `getSyncLogs()` - Obtener historial de sincronización

Inyecciones:
- `EmployeeSyncService` - Servicio de sincronización

### Services

**EmployeeSyncService** ([app/Modules/Employees/Services/EmployeeSyncService.php](../../app/Modules/Employees/Services/EmployeeSyncService.php))

Responsabilidades:
- Sincronizar con APIs externas
- Crear/actualizar registros locales desde datos externos
- Registrar logs de sincronización

Métodos públicos:
- `setProvider(ExternalEmployeeProvider)` - Establecer proveedor externo
- `syncFromExternal()` - Sincronizar todos desde API
- `syncEmployee(array $datosExternos)` - Sincronizar un empleado

Métodos privados:
- `createLocal(array $datos)` - Crear empleado local
- Métodos de mapeo de datos de API

Lógica de sincronización:
1. Obtiene empleados de API externa
2. Por cada empleado:
   - Busca registro con `sistema_externo` e `id_externo`
   - Si existe: actualiza campos locales y registra en log
   - Si no existe: crea nuevo Employee y EmployeeIntegration
3. Registra resultado (éxito/error) en EmployeeSyncLog

### Contratos/Interfaces

**ExternalEmployeeProvider** ([app/Modules/Employees/Contracts/ExternalEmployeeProvider.php](../../app/Modules/Employees/Contracts/ExternalEmployeeProvider.php))

```php
interface ExternalEmployeeProvider {
    public function getEmployees(): array;
    public function getEmployee(string $id): array;
}
```

Implementaciones (placeholder):
- SAPEmployeeProvider (por implementar)
- AdobeEmployeeProvider (por implementar)
- LDAPEmployeeProvider (por implementar)

---

## 6. Business Rules

### 6.1 Creación Local

- `codigo` debe ser único
- `email` debe ser único y válido
- `nombre` es obligatorio
- Otros campos opcionales

### 6.2 Sincronización Externa

- **Proveedor requerido:** Debe estar configurado un proveedor en `ExternalEmployeeProvider`
- **Mapeo:** Los datos externos se mapean a campos locales:
  - `external_id` → `EmployeeIntegration.id_externo`
  - `external_name` → `Employee.nombre`
  - `external_email` → `Employee.email`
- **Conflictos:** Si email/código local ya existe, se actualiza el registro existente
- **Logs:** Cada acción registra en `EmployeeSyncLog` con estado exitoso/error

### 6.3 Gestión de Integraciones

- Un empleado puede tener múltiples integraciones (SAP, Adobe, LDAP, etc.)
- Cada integración mapea a un único `id_externo` en ese sistema
- `ultima_sincronizacion` se actualiza en cada sync exitoso

---

## 7. Integración con Otros Módulos

### Assets
- **Relación:** Asset.responsable_id → Employee.id
- **Uso:** Asignar activos a empleados

### Accounting
- **No implementado:** Podría tener centro de costos por departamento

### Reporting
- Reporte de valor de activos por responsable (empleado)

---

## 8. Gaps y Riesgos

### Gaps Identificados

1. **UI React**
   - Componentes en [resources/js/Pages/Employees/](../../resources/js/Pages/Employees/) son mínimos
   - Necesita UI completa para Employees/Index y Employees/Create

2. **Validación de Código**
   - Sistema espera código único pero no hay generador automático
   - Riesgo de duplicación manual

3. **Sincronización Automática**
   - No hay job scheduler configurado para sincronización periódica
   - Debe ser disparado manualmente o a través de endpoint

4. **Proveedores Externos**
   - Solo hay interfaz, sin implementaciones concretas
   - SAP, Adobe, LDAP aún no implementados

5. **Versionado de Cambios**
   - No hay track completo de qué campo cambió en cada sincronización
   - Log solo registra acción general

### Riesgos

1. **Duplicación**
   - Si email/código duplicado en API externa: crea conflictos
   - No hay deduplicación automática

2. **Pérdida de Datos**
   - Sincronización no es bidireccional
   - Cambios locales se pierden si se sincroniza

3. **Performance**
   - Sincronización de muchos empleados puede tardar
   - Sin límite de registros por llamada de API

4. **Eliminación**
   - Enum 'eliminado' no se usa en controlador
   - No hay lógica para marcar empleados como eliminados en sync

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Employees/Models/Employee.php](../../app/Modules/Employees/Models/Employee.php) | Modelo principal |
| [app/Modules/Employees/Http/Controllers/EmployeeController.php](../../app/Modules/Employees/Http/Controllers/EmployeeController.php) | Endpoints CRUD y sincronización |
| [app/Modules/Employees/Services/EmployeeSyncService.php](../../app/Modules/Employees/Services/EmployeeSyncService.php) | Lógica de sincronización |
| [app/Modules/Employees/Contracts/ExternalEmployeeProvider.php](../../app/Modules/Employees/Contracts/ExternalEmployeeProvider.php) | Interfaz de proveedores |
| [database/migrations/2024_02_25_000002_create_employee_tables.php](../../database/migrations/2024_02_25_000002_create_employee_tables.php) | Schema |
| [resources/js/Pages/Employees/Index.jsx](../../resources/js/Pages/Employees/Index.jsx) | Listado (en desarrollo) |

**Documento generado:** 2026-08-07  
**Estado:** Implementación básica, proveedores externos pendientes, UI incompleta
