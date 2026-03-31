# Sistema de Gestión de Activos Fijos - Laravel + Inertia + React

## Estado Actual del Proyecto (25/02/2026)

### ✅ COMPLETADO

#### 1. Estructura Base del Proyecto
- [x] Proyecto Laravel 12 creado
- [x] Inertia.js + React + Prime React instalados
- [x] TailwindCSS + Recharts para gráficos
- [x] Spatie Permissions, Activity Log, Excel, DOMPDF instalados
- [x] 8 módulos organizados (Assets, Suppliers, Employees, Movements, Inventory, Maintenance, Reports, Accounting)

#### 2. Migrations de Base de Datos
- [x] Tabla `asset_categories` - Categorías de activos
- [x] Tabla `asset_locations` - Ubicaciones físicas
- [x] Tabla `suppliers` - Proveedores
- [x] Tabla `assets` - Registro maestro de activos
- [x] Tabla `qr_accesses` - Auditoría de acceso a QR
- [x] Tabla `asset_valuations` - Valuaciones y revaluos
- [x] Tabla `asset_depreciation` - Depreciación calculada
- [x] Tabla `asset_movements` - Historial de movimientos
- [x] Tabla `employees` - Empleados (local)
- [x] Tabla `employee_integrations` - Integraciones con APIs externas
- [x] Tabla `employee_sync_logs` - Log de sincronización
- [x] Tabla `inventory_cycles` - Ciclos de inventario
- [x] Tabla `inventory_captures` - Capturas de inventario
- [x] Tabla `inventory_discrepancies` - Discrepancias detectadas
- [x] Tabla `discrepancy_transitions` - Auditoría de transiciones
- [x] Tabla `maintenance_orders` - Órdenes de mantenimiento
- [x] Tabla `maintenance_history` - Historial de mantenimiento

#### 3. Models y Relaciones
- [x] AssetCategory, AssetLocation, Asset, AssetValuation, AssetDepreciation, AssetMovement, QRAccess
- [x] Employee, EmployeeIntegration, EmployeeSyncLog
- [x] InventoryCycle, InventoryCapture, InventoryDiscrepancy, DiscrepancyTransition
- [x] MaintenanceOrder, MaintenanceHistory
- [x] Supplier
- [x] Todas las relaciones between models configuradas

#### 4. Services Core
- [x] **DepreciationCalculator** - Cálculo de depreciación lineal (extensible)
- [x] **LinearDepreciation** - Implementación de depreciación lineal
- [x] **QRCodeGenerator** - Generación de QR on-the-fly (sin almacenar)
- [x] **EmployeeSyncService** - Sincronización manual de empleados desde APIs externas

#### 5. Contratos e Interfaces
- [x] DepreciationMethod - Interfaz para métodos de depreciación futuros
- [x] ExternalEmployeeProvider - Interfaz para proveedores externos de empleados

#### 6. Eventos y Auditoría
- [x] **Events**: AssetCreated, AssetMoved, AssetRevalued, AssetDisposed, DiscrepancyDetected, DiscrepancyApproved
- [x] **Listeners**: LogAssetCreated, LogAssetMoved, LogAssetRevalued, LogDiscrepancyApproved
- [x] **EventServiceProvider** - Registración de eventos y listeners
- [x] **PublishToAccountingQueue** - Listener stub para integración contable futura
- [x] Integración con Spatie Activity Log para auditoría

---

### ⏳ POR HACER (PRÓXIMAS FASES)

#### Fase 1: Configuración e Instalación (Setup)
- [ ] Crear wizard de configuración inicial
  - [ ] Elegir tipo de empleados (API externa O registro local)
  - [ ] Configurar método de depreciación
  - [ ] Crear usuario administrador inicial
- [ ] Archivo de configuración `config/app-config.php`

#### Fase 2: API Endpoints y Controladores
- [x] **Assets Controller**: CRUD para activos
  - [x] GET `/api/assets` - Listar activos
  - [x] GET `/api/assets/{id}` - Ver detalles
  - [x] GET `/api/assets/{id}/qr` - Descargar QR PNG
  - [x] POST `/api/assets` - Crear activo
  - [x] PUT `/api/assets/{id}` - Actualizar activo
  - [x] DELETE `/api/assets/{id}` - Eliminar activo
  - [x] POST `/api/assets/{id}/movements` - Registrar movimiento
  
- [x] **Employees Controller**: CRUD + Sincronización
  - [x] GET `/api/employees` - Listar empleados
  - [x] POST `/api/employees` - Crear empleado (solo si es local)
  - [x] POST `/api/employees/sync` - Sincronizar desde API externa
  
- [x] **Inventory Controller**: Ciclos y discrepancias
  - [x] GET `/api/inventory-cycles` - Listar ciclos
  - [x] POST `/api/inventory-cycles` - Crear ciclo
  - [x] POST `/api/inventory-cycles/{id}/capture` - Capturar activo
  - [x] GET `/api/inventory-cycles/{id}/discrepancies` - Listar discrepancias
  - [x] PUT `/api/inventory-discrepancies/{id}/approve` - Aprobar discrepancia
  - [x] PUT `/api/inventory-discrepancies/{id}/reject` - Rechazar discrepancia

- [x] **Maintenance Controller**: Órdenes de mantenimiento
  - [x] GET `/api/maintenance-orders` - Listar
  - [x] POST `/api/maintenance-orders` - Crear
  - [x] PUT `/api/maintenance-orders/{id}` - Actualizar estado

- [x] **Reports Controller**: Reportes y exportación
  - [x] GET `/api/reports/asset-list` - Reporte de activos
  - [x] GET `/api/reports/depreciation` - Reporte de depreciación
  - [x] GET `/api/reports/book-value` - Valor en libros
  - [x] GET `/api/reports/movements` - Movimientos
  - [x] GET `/api/reports/discrepancies` - Discrepancias
  - [x] GET `/api/reports/{type}/export?format=excel|pdf` - Exportar

#### Fase 3: Componentes React y Frontend
- [x] **Layout Principal**
  - [x] Navbar con navegación
  - [x] Sidebar con menú de módulos
  - [x] Footer

- [x] **Dashboard**: Vista de resumen
  - [x] Tarjetas KPI (total activos, valor total, depreciación acumulada)
  - [x] Gráficos Recharts (depreciación acumulada, activos por categoría, tendencias)
  - [x] Últimas operaciones

- [x] **Módulo Assets**
  - [x] Página listado de activos (tabla filtrable, paginada)
  - [x] Formulario crear/editar activo
  - [x] Visor de QR (con descarga PNG)
  - [x] Historial de movimientos

- [x] **Módulo Employees**
  - [x] Tabla de empleados
  - [x] Botón "Sincronizar Ahora" con loader
  - [x] Notificación de resultado de sincronización
  - [x] Formulario crear empleado (si es local)

- [x] **Módulo Inventory**
  - [x] Página ciclos de inventario
  - [x] Crear ciclo
  - [x] Scanner QR para capturar activos
  - [x] Tabla de capturas
  - [x] Listado de discrepancias con estado
  - [x] Panel de aprobación (Asset Manager)
  - [x] Historial de transiciones

- [x] **Módulo Maintenance**
  - [x] Tabla de órdenes de mantenimiento
  - [x] Crear orden
  - [x] Cambiar estado
  - [x] Historial de cambios

- [x] **Módulo Reports**
  - [x] Selector de tipo de reporte
  - [x] Filtros (rango de fechas, categoría, ubicación, responsable)
  - [x] Tabla de datos con paginación
  - [x] Gráficos incrustados (Recharts)
  - [x] Botones exportar (Excel, PDF)

- [x] **Auditoría**
  - [x] Log de cambios (activity_log)
  - [x] Filtros por usuario, fecha, tipo de acción

#### Fase 4: Servicios Avanzados
- [x] Servicio de valoración (AssetValuationService)
- [x] Servicio de movimientos (AssetMovementService)
- [x] Servicio de discrepancias y aprobación
- [x] Servicio de generación de reportes (QueryObjects, caching)
- [x] Exportadores (Excel, PDF)

#### Fase 5: Integración de APIs Externas
- [ ] Implementar adaptadores de ejemplo (SAP, Adobe, etc.)
- [ ] Manejo de errores y reintentos
- [ ] Encriptación de credenciales

#### Fase 6: Pruebas y Deployment
- [ ] Tests unitarios (Pest PHP)
- [ ] Tests funcionales
- [ ] Seeders para datos de prueba
- [ ] Documentación de API

---

## Requisitos para Continuar

### Base de Datos
- [ ] Tener MySQL/MariaDB ejecutándose en `localhost:3306`
- [ ] Crear BD `activo_fijo`
- [ ] O actualizar `.env` con credenciales correctas

### Ejecutar Migraciones
```bash
php artisan migrate
```

### Crear Usuario Admin Inicial
```bash
php artisan tinker
>>> User::create(['name' => 'Admin', 'email' => 'admin@example.com', 'password' => bcrypt('password')])
```

### Instalar Spatie Activity Log
```bash
php artisan activity-log:create-migration
php artisan migrate
```

### Dev Server
```bash
php artisan serve
npm run dev
```

---

## Arquitectura del Proyecto

```
app/
├── Modules/
│   ├── Assets/
│   │   ├── Models/ (Asset, AssetCategory, AssetLocation, etc.)
│   │   ├── Services/ (DepreciationCalculator, QRCodeGenerator, etc.)
│   │   ├── Controllers/ (AssetController, etc.)
│   │   ├── Events/ (AssetCreated, AssetMoved, etc.)
│   │   ├── Listeners/ (LogAssetCreated, etc.)
│   │   ├── Contracts/ (DepreciationMethod interface)
│   │   ├── Http/
│   │   └── Requests/ (Form validation)
│   ├── Employees/
│   │   ├── Models/ (Employee, EmployeeIntegration, EmployeeSyncLog)
│   │   ├── Services/ (EmployeeSyncService)
│   │   ├── Contracts/ (ExternalEmployeeProvider interface)
│   │   └── Controllers/
│   ├── Inventory/
│   │   ├── Models/ (InventoryCycle, InventoryCapture, InventoryDiscrepancy)
│   │   ├── Services/
│   │   ├── Events/ (DiscrepancyDetected, DiscrepancyApproved)
│   │   ├── Listeners/ (LogDiscrepancyApproved)
│   │   └── Controllers/
│   ├── Maintenance/
│   │   ├── Models/ (MaintenanceOrder, MaintenanceHistory)
│   │   └── Controllers/
│   ├── Suppliers/
│   │   ├── Models/ (Supplier)
│   │   └── Controllers/
│   ├── Movements/
│   ├── Reports/
│   └── Accounting/ (Stub para integración futura)
├── Providers/
│   └── EventServiceProvider.php

resources/js/
├── Pages/
│   ├── Dashboard.jsx
│   ├── Assets/
│   ├── Employees/
│   ├── Inventory/
│   ├── Maintenance/
│   ├── Reports/
│   └── Audit.jsx
├── Components/
│   ├── Layout/
│   ├── Common/
│   └── (componentes por módulo)
└── Hooks/

routes/
├── api.php
└── web.php

database/
├── migrations/
│   ├── 2024_02_25_000001_create_asset_tables.php
│   ├── 2024_02_25_000002_create_employee_tables.php
│   ├── 2024_02_25_000003_create_movement_tables.php
│   ├── 2024_02_25_000004_create_inventory_tables.php
│   └── 2024_02_25_000005_create_maintenance_tables.php
└── seeders/
```

---

## Decisiones de Arquitectura

### 1. **Modular Monolith con DDD**
- Cada módulo es independiente pero comparte BD
- Facilita mantenimiento y escalabilidad futura

### 2. **Event-Driven para Auditoría**
- Cada acción crítica dispara un evento
- Listeners registran en Activity Log
- Preparado para integración contable sin acoplamiento

### 3. **QR On-the-Fly**
- Se genera cada vez que se solicita, sin almacenar
- Reduce almacenamiento en BD
- Auditoría en tabla `qr_accesses`

### 4. **Depreciación Extensible**
- Interfaz `DepreciationMethod` permite agregar nuevos métodos
- Por defecto: Lineal
- Futuro: Acelerada, Unidades, etc.

### 5. **Sincronización Manual de Empleados**
- Interfaz `ExternalEmployeeProvider` para múltiples APIs
- Usuario controla sincronización manualmente
- Sin integración automática aún

### 6. **Discrepancias con Aprobación**
- Workflow: DETECTADA → PENDIENTE → APROBADA/RECHAZADA → RESUELTA
- Solo Asset Manager puede aprobar
- Auditoría completa de transiciones

### 7. **Permisos Temporales (Full Admin)**
- Actualmente todos los usuarios son admin
- Estructura de Spatie Permissions lista para implementación granular
- Fase 2: Implementar 6 roles

---

## Notas Importantes

- **Transacciones BD**: Operaciones críticas (movimientos, aprobaciones, valuaciones) usan transacciones
- **Soft Deletes**: Todos los modelos principales tienen soft delete para auditoría histórica
- **Índices**: Optimizados para queries frecuentes (asset_id, fecha, estado)
- **Caché de Reportes**: Configurado para Redis, 1 hora por defecto

---

Próximo paso: Crear rutas API y primeros controladores.
