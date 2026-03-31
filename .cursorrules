# Reglas y Estándares de Codificación para Agentes de IA

Este documento define los estándares arquitectónicos y de estilo de código que los agentes de IA (como este) y los desarrolladores deben seguir al trabajar en el Sistema de Gestión de Activos Fijos.

## 1. Stack Tecnológico Principal
- **Backend:** Laravel 12 (PHP 8.2+)
- **Frontend:** React 18+ con Inertia.js
- **Estilos:** Tailwind CSS
- **Componentes UI:** PrimeReact / Tailwind UI
- **Base de Datos:** MySQL/MariaDB

---

## 2. Arquitectura Backend (Modular Monolith)
El proyecto utiliza un enfoque de Monolito Modular basado en principios de Domain-Driven Design (DDD).

### Estructura de Módulos (`app/Modules/`)
Cualquier nueva característica (Feature) importante debe ser encapsulada en su propio módulo o pertenecer lógicamente a uno existente:
- **Assets** (Activos y Maestro)
- **Employees** (Empleados y Sincronización)
- **Inventory** (Ciclos de Inventario y Auditorías)
- **Maintenance** (Mantenimiento)
- **Reports** (Reportes y Exportación)
- **Suppliers** (Proveedores)

### Reglas de Creación en Backend:
1. **Controllers (`Http/Controllers/`)**:
   - Deben ser delgados. Sólo deben manejar peticiones (Request), llamar a Services/Actions y retornar una respuesta (Inertia view o JSON).
   - Nomenclatura: `PascalCase` terminado en `Controller` (Ej. `AssetValuationController`).
2. **Services (`Services/`)**:
   - Deben contener la lógica de negocio compleja.
   - Nomenclatura: `PascalCase` terminado en `Service` (Ej. `AssetMovementService`) o representar una regla de negocio clara (`DepreciationCalculator`).
3. **Models (`Models/`)**:
   - Deben escribirse en singular y `PascalCase` (Ej. `Asset`, No `Assets`).
   - Usar `$fillable` masivamente o protección contra asignación masiva.
   - Los métodos de relaciones deben usar `camelCase` (Ej. `public function assetCategory()`).
4. **Validaciones (`Http/Requests/`)**:
   - Mover la validación de los request a FormRequests siempre que sea posible.
   - Nomenclatura: `[Accion][Modelo]Request` (Ej. `StoreAssetRequest`).

---

## 3. Convenciones de Nomenclatura de Código

### Backend (PHP/Laravel)
- **Clases (Controllers, Models, Services, etc.):** `PascalCase` (Ej. `EmployeeSyncService`).
- **Métodos y Funciones:** `camelCase` (Ej. `calculateDepreciation()`).
- **Variables y Propiedades:** `camelCase` (Ej. `$totalValue`).
- **Constantes:** `UPPER_SNAKE_CASE` (Ej. `STATUS_ACTIVE`).
- **Tablas de Base de Datos:** `snake_case` plural (Ej. `asset_valuations`).
- **Columnas de Base de Datos:** `snake_case` (Ej. `purchase_price`, `asset_id`).
- **Rutas (URL):** `kebab-case` (Ej. `/api/asset-types`).
- **Rutas (Nombres):** `snake_case` con punto (Ej. `assets.create`).

### Frontend (React/JS/Inertia)
- **Componentes React:** `PascalCase` (Ej. `AssetList.jsx`, `QRScanner.jsx`).
- **Archivos de Componentes:** `.jsx` con el mismo nombre en `PascalCase`.
- **Hooks Personalizados:** Prefijo `use` en `camelCase` (Ej. `useInventoryStatus`).
- **Funciones y Variables:** `camelCase` (Ej. `handleFormSubmit`, `assetData`).
- **Props:** `camelCase` (Ej. `initialData`, `onStatusChange`).

---

## 4. Mejores Prácticas y Patrones

### Base de Datos y Transacciones
- Cualquier operación que modifique múltiples registros o requiera integridad relacionada (Ej. Crear un movimiento de activo y registrar la auditoría) **DEBE** ir envuelta en un `DB::transaction()`.
- Utilizar **Soft Deletes** (`SoftDeletes` trait) en los modelos principales para evitar pérdida de referencialidad.

### Eventos para Auditoría (Event-Driven)
- Aprovecha Spatie Activity Log para llevar trazabilidad de cambios en los Modelos (`LogsActivity` trait).
- Las acciones de negocio críticas deben disparar Eventos personalizados (Ej. `AssetRevalued`), y los Listeners deben registrar esto en la base de datos de ser necesario.

### Rutas
- Separar las llamadas web (vistas) de las llamadas asíncronas / API.
  - Vistas de Inertia deben ir en `routes/web.php` interactuando bajo las validaciones y policies apropiadas.
  - Las llamadas asíncronas (Axios) o consumo de recursos externos deben estar definidas en `routes/api.php`.

### Frontend y UI
- Las `Pages` actúan como Controllers de la vista. Toda la lógica de obtención/envío (Axios/Inertia router) de datos global debe pasar preferiblemente por la Page.
- Los `Components` deben ser agnósticos respecto al layout general, recibir data por Props y emitir eventos por callbacks (`onChange`, `onSubmit`).
- Para los estilos usar siempre utilidades de **Tailwind CSS**. Evitar CSS custom salvo en casos extremos.

---

## 5. Pruebas (Tests)
- Escribir pruebas unitarias en **Pest PHP** (`tests/Unit/` y `tests/Feature/`) cuando se añada un Servicio o Controlador crítico.
- Convención: Para lógica compleja (Ej. Calcular depreciación o Sincronizar APIs de empleados), siempre crear una prueba que contemple el camino feliz (Happy Path) y el manejo de errores.

## 6. Integración Externa
- Si se conectan APIs externas (Ej. SAP, Workday), usar el patrón Adapter.
- Proveer siempre una **Interfaz (Contract)** en la carpeta `Contracts/` para que la implementación sea fácilmente intercambiable (Ej. `ExternalEmployeeProvider`).
- Implementar logging detallado de reintentos y errores de red en la integración.
