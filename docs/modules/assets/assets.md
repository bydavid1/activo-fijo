# Módulo Assets - Documentación Completa

## 1. Overview

El **módulo Assets** es el núcleo del sistema de gestión de activos fijos. Administra el ciclo de vida completo de bienes: desde la creación y adquisición, pasando por movimientos, depreciación, revalúos, hasta la baja o disposición.

**Estado Actual:** ✅ Completamente funcional  
**Ubicación:** `app/Modules/Assets/`  
**Última Actualización:** Marzo 2026

### Responsabilidades Principales

- **Registro maestro** de activos fijos con múltiples tipos de adquisición (compra, donación, comodato, leasing, dación en pago, proyectos, transferencias)
- **Gestión de depreciación** con métodos lineales, acelerados, y por unidades producidas
- **Seguimiento de movimientos** (traslado, asignación, comodato, devolución, baja, venta)
- **Valuaciones y revalúos** de bienes
- **Generación de códigos QR y códigos de barras** para identificación
- **Gestión de ubicaciones y responsables**
- **Gestión de categorías y tipos de bien**
- **Auditoría** a través de eventos y activity log

---

## 2. Domain Model

### Entidades Principales

#### **Asset** - Activo Fijo
Representa un bien individual en el sistema.

**Atributos clave:**
- `codigo` (string, única) - Identificador único del activo
- `nombre` (string) - Descripción del activo
- `descripcion` (text, nullable) - Detalles adicionales
- `marca`, `modelo`, `serie` (string, nullable) - Especificaciones
- `valor_compra` (decimal) - Valor de adquisición
- `valor_residual` (decimal) - Valor estimado al final de vida útil
- `vida_util_anos` (integer, nullable) - Años de vida útil
- `fecha_adquisicion` (date) - Fecha de compra/recepción
- `estado` (enum) - Ver sección de estados
- `tipo_adquisicion` (string) - Ver sección de tipos de adquisición
- `propiedad` (enum: 'propio', 'tercero') - Titularidad del bien
- `depreciable` (boolean) - Si se calcula depreciación
- `aplicar_regla_dia_15` (boolean) - Regla contable para inicio de depreciación
- `fecha_inicio_depreciacion` (date, nullable) - Fecha de inicio
- `metodo_depreciacion` (string) - lineal, acelerada, unidades_producidas
- `periodicidad_depreciacion` (string) - diaria, mensual, anual

**Campos específicos de adquisición:**
- `tipo_leasing` (enum: 'operativo', 'financiero') - Para activos en leasing
- `valor_estimado` (decimal) - Para donaciones
- `depreciacion_acumulada_transferencia` (decimal) - Para transferencias
- `vida_util_restante` (integer) - Para transferencias
- `responsable_externo` (string) - Para comodatos
- `fecha_devolucion` (date) - Para comodatos
- `proyecto_nombre` (string) - Para adquisiciones por proyecto
- `dacion_acreedor` (string) - Para dación en pago
- `dacion_deuda_original` (decimal) - Deuda original en dación
- `orden_compra`, `numero_factura` (string) - Documentos
- `donante_nombre`, `donacion_documento` (string) - Para donaciones

**Ubicación:** [app/Modules/Assets/Models/Asset.php](../../app/Modules/Assets/Models/Asset.php)

**Relaciones:**
```
Asset.tipoBien() -> AssetType (belongsTo)
Asset.categoria() -> AssetCategory (belongsTo)
Asset.ubicacion() -> AssetLocation (belongsTo)
Asset.proveedor() -> Supplier (belongsTo)
Asset.responsable() -> Employee (belongsTo)
Asset.movimientos() -> AssetMovement (hasMany)
Asset.valuaciones() -> AssetValuation (hasMany)
Asset.depreciaciones() -> AssetDepreciation (hasMany)
Asset.qrAccesses() -> QRAccess (hasMany)
Asset.attachments() -> AssetAttachment (hasMany)
Asset.fotoPrincipal() -> AssetAttachment (hasOne)
Asset.customValues() -> AssetCustomValue (hasMany)
```

**Accessors/Mutadores (Propiedades Calculadas):**
- `depreciacion_mensual` - Depreciación mensual calculada
- `depreciacion_anual` - Depreciación anual calculada
- `meses_depreciados` - Meses transcurridos desde inicio
- `depreciacion_acumulada` - Suma de depreciación hasta hoy
- `valor_en_libros` - Valor de compra menos depreciación acumulada
- `porcentaje_vida_util` - Porcentaje de vida útil transcurrido

#### **AssetType** - Tipo de Bien
Clasifica los activos y define propiedades personalizadas.

**Atributos:**
- `nombre` (string) - Nombre del tipo
- `codigo` (string, única) - Código del tipo
- `descripcion` (text)
- `es_depreciable` (boolean) - Si los activos de este tipo se deprecian
- `vida_util_default` (integer) - Años de vida útil por defecto
- `cuenta_contable` (string) - Referencia contable

**Relaciones:**
```
AssetType.properties() -> AssetTypeProperty (hasMany, ordenadas)
AssetType.assets() -> Asset (hasMany)
AssetType.expenseAccount() -> AccountingAccount (belongsTo)
AssetType.accumulatedAccount() -> AccountingAccount (belongsTo)
```

**Ubicación:** [app/Modules/Assets/Models/AssetType.php](../../app/Modules/Assets/Models/AssetType.php)

#### **AssetCategory** - Categoría
Agrupa activos por tipo: inmuebles, muebles, equipos, etc.

**Atributos:**
- `nombre`, `codigo` (string, única)
- `descripcion` (text)
- `metodo_depreciacion` (string) - Default para activos en esta categoría

**Ubicación:** [app/Modules/Assets/Models/AssetCategory.php](../../app/Modules/Assets/Models/AssetCategory.php)

#### **AssetLocation** - Ubicación Física
Define lugares donde se almacenan o utilizan los activos.

**Atributos:**
- `nombre`, `codigo` (string, única)
- `descripcion` (text)
- `edificio`, `piso` (string) - Estructura física

**Ubicación:** [app/Modules/Assets/Models/AssetLocation.php](../../app/Modules/Assets/Models/AssetLocation.php)

#### **AssetMovement** - Movimiento
Registra cambios de ubicación, responsable, o estado.

**Atributos:**
- `asset_id` (FK) - Activo movido
- `ubicacion_anterior_id`, `ubicacion_nueva_id` (FK)
- `responsable_anterior_id`, `responsable_nuevo_id` (FK)
- `tipo` (enum) - Ver tipos de movimiento
- `motivo` (text) - Razón del movimiento
- `usuario_id` (FK) - Quién registró el movimiento

**Campos específicos por tipo:**
- Para comodato: `responsable_externo`, `empresa_externa`, `fecha_devolucion_esperada`, `fecha_devolucion`
- Para baja: `motivo_baja`, `fecha_baja`, `ganancia_perdida`
- Para venta: `tipo_venta`, `tipo_pago`, `condicion_pago`, `precio_venta`, `comprador_nombre`, `comprador_documento`, `comprador_telefono`, `documento_venta`

**Ubicación:** [app/Modules/Assets/Models/AssetMovement.php](../../app/Modules/Assets/Models/AssetMovement.php)

**Tipos de Movimiento:**
- `asignacion` - Asignar a un responsable
- `traslado` - Cambiar ubicación
- `comodato` - Préstamo a tercero
- `devolucion` - Retorno de comodato
- `reubicacion` - Cambio interno de ubicación
- `mantenimiento` - Envío a mantenimiento
- `prestamo` - Préstamo interno
- `venta` - Venta del activo
- `baja` - Retiro del inventario
- `otro` - Otro movimiento

#### **AssetValuation** - Valuación/Revalúo
Registra cambios en el valor de un activo.

**Atributos:**
- `asset_id` (FK)
- `valor_anterior`, `valor_nuevo` (decimal)
- `fecha_efectiva` (date)
- `metodo` (enum: 'contable', 'mercado', 'pericia')
- `tipo_revaluo` (enum: 'revalorizacion', 'deterioro', 'ajuste_inflacion', 'tasacion')
- `perito_nombre`, `documento_respaldo`, `notas` (text)
- `usuario_id` (FK)

**Ubicación:** [app/Modules/Assets/Models/AssetValuation.php](../../app/Modules/Assets/Models/AssetValuation.php)

#### **AssetDepreciation** - Depreciación Calculada
Almacena el cálculo de depreciación período a período.

**Atributos:**
- `asset_id` (FK)
- `tipo_depreciacion` (enum: 'fiscal', 'financiera')
- `periodo` (integer) - Número de período
- `ano`, `mes` (integer) - Año y mes del período
- `depreciacion_valor` (decimal) - Depreciación del período
- `depreciacion_acumulada` (decimal) - Acumulado hasta el período
- `valor_en_libros` (decimal) - Valor del activo al final del período

**Ubicación:** [app/Modules/Assets/Models/AssetDepreciation.php](../../app/Modules/Assets/Models/AssetDepreciation.php)

#### **AssetAttachment** - Archivos Adjuntos
Almacena fotos, facturas, garantías, etc.

**Atributos:**
- `asset_id` (FK)
- `archivo_path` (string) - Ruta en storage
- `tipo` (enum: 'foto', 'factura', 'orden_compra', 'garantia', 'manual', 'otro')
- `descripcion` (text)
- `es_principal` (boolean) - Si es la foto principal del activo

**Ubicación:** [app/Modules/Assets/Models/AssetAttachment.php](../../app/Modules/Assets/Models/AssetAttachment.php)

### Enumeraciones y Estados

#### Estados de Activo
```
- 'activo' (legacy) - Activo en uso
- 'disponible' - Disponible para asignar
- 'asignado' - Asignado a un responsable
- 'en_comodato' - Prestado a tercero
- 'mantenimiento' - En reparación/mantenimiento
- 'baja' - Retirado del inventario
- 'inactivo' - No está en uso
- 'descartado' - Eliminado del sistema
- 'retirado' - Retirado definitivamente
- 'vendido' - Vendido
```

#### Tipos de Adquisición
```
- 'compra' - Compra directa (propio, depreciable)
- 'donacion' - Donativo recibido (propio, depreciable, requiere valor_estimado)
- 'transferencia' - Trasferencia de otra entidad
- 'comodato' - Préstamo (tercero, no depreciable, requiere responsable_externo)
- 'leasing' - Arrendamiento:
  * 'operativo' -> propiedad: tercero, depreciable: false
  * 'financiero' -> propiedad: propio, depreciable: true
- 'dacion_en_pago' - Pago con bien (propio, depreciable)
- 'proyecto' - Adquisición para proyecto específico (requiere proyecto_nombre)
```

#### Tipos de Venta
```
- 'directa' - Venta al contado a comprador
- 'subasta' - Venta en subasta
- 'licitacion' - Venta por licitación
```

#### Tipos de Pago
```
- 'efectivo'
- 'transferencia'
- 'cheque'
- 'tarjeta'
- 'otro'
```

#### Condiciones de Pago
```
- 'contado' - Pago inmediato
- 'credito_30' - Crédito a 30 días
- 'credito_60' - Crédito a 60 días
- 'credito_90' - Crédito a 90 días
- 'otro' - Otro
```

#### Motivos de Baja
```
- 'perdida' - Pérdida del activo
- 'obsolescencia' - Ya no es funcional
- 'robo' - Robo reportado
- 'otro' - Otro motivo
```

---

## 3. Flujos Principales

### 3.1 Crear Activo
```
User -> Create Form (React)
  ↓
POST /api/assets
  ↓
AssetController::store()
  ├─ Validación de entrada
  ├─ AssetCreationBusinessRules::applyAndValidate()
  │  ├─ validateComodatoAcquisition()
  │  ├─ validateLeasing()
  │  ├─ validateDonation()
  │  └─ validateThirdPartyDepreciation()
  ├─ Aplicar defaults (valor residual, vida útil del tipo)
  ├─ Asset::create()
  ├─ Guardar valores personalizados (customValues)
  ├─ Guardar archivos adjuntos
  ├─ DepreciationCalculator::saveDepreciation()
  ├─ Disparar evento AssetCreated
  └─ Response: Asset creado (201)
  
Listeners del evento:
  └─ LogAssetCreated -> Registra en activity_log
```

**Archivo:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `store()` método

**Business Rules:**
- Comodato: Requiere `responsable_externo` y `fecha_devolucion`
- Leasing operativo: `propiedad=tercero`, `depreciable=false`
- Leasing financiero: `propiedad=propio`, `depreciable=true`
- Donación: Requiere `valor_estimado`
- Transferencia: Puede incluir `depreciacion_acumulada_transferencia` y `vida_util_restante`

### 3.2 Registrar Movimiento
```
User -> Asset Detail Page -> Record Movement Dialog
  ↓
POST /api/assets/{id}/movements
  ↓
AssetController::recordMovement()
  ├─ Validación de entrada
  ├─ AssetMovementBusinessRules::validate()
  │  ├─ validateAssetNotDisposed() - No permite si está en baja/retirado/vendido
  │  ├─ validateComodatoMovement() - Valida campos requeridos
  │  └─ validateDevolucionMovement() - Solo si estaba en comodato
  ├─ Crear AssetMovement
  ├─ Actualizar Asset:
  │  ├─ ubicacion_id = nueva ubicación
  │  ├─ responsable_id = nuevo responsable
  │  └─ estado = calculado por nextState()
  ├─ Disparar evento AssetMoved
  └─ Response: Movimiento registrado (201)

Estados calculados según tipo:
  'comodato' -> 'en_comodato'
  'devolucion' -> 'disponible'
  'asignacion' -> 'asignado'
```

**Archivo:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `recordMovement()` método  
**Servicio de reglas:** [app/Modules/Assets/Services/AssetMovementBusinessRules.php](../../app/Modules/Assets/Services/AssetMovementBusinessRules.php)

### 3.3 Calcular Depreciación
```
Cuando se crea, actualiza o revalúa un activo depreciable, el flujo real es:

AssetController::store()/update()/revalue()
  ├─ Validar datos del activo
  ├─ Persistir el activo
  ├─ DepreciationCalculator::saveDepreciation(asset)
  │   ├─ Resolver método (lineal/acelerada/unidades)
  │   ├─ Resolver vida útil:
  │   │  1. Explícita en activo
  │   │  2. Derivada de tasa en system_settings
  │   │  3. Default del tipo de bien
  │   │  4. Fallback: 5 años
  │   ├─ Determinar periodicidad (mensual/anual)
  │   ├─ Construir la fecha de inicio usando la regla del día 15
  │   ├─ Calcular por período: depreciación, acumulada y valor en libros
  │   ├─ Guardar registros en asset_depreciation con año/mes/periodo
  │   └─ Disparar AssetDepreciated
  └─ EventServiceProvider -> CreateDepreciationJournalEntry
      └─ Crear asiento contable si existen cuentas configuradas
```

**Métodos de Depreciación:**
- **Lineal:** Depreciación = (Valor - Residual) / Vida útil
- **Acelerada:** Factor de aceleración aplicado
- **Unidades:** Basado en unidades producidas, con distribución uniforme por defecto

**Ubicación:** [app/Modules/Assets/Services/DepreciationCalculator.php](../../app/Modules/Assets/Services/DepreciationCalculator.php)

**Regla del Día 15:** Si `fecha_adquisicion` es después del día 15, la depreciación comienza el primer día del mes siguiente. Controlado por `aplicar_regla_dia_15`.

**Importante:** La depreciación se recalcula al crear, actualizar o revaluar un activo. La tabla [app/Modules/Assets/Models/AssetDepreciation.php](../../app/Modules/Assets/Models/AssetDepreciation.php) usa `ano`, `mes`, `periodo` y `depreciacion_valor` para alimentar cierres mensuales y reportes.

### 3.4 Revaluar Activo
```
User -> Asset Detail -> Revalue Dialog
  ↓
POST /api/assets/{id}/revalue
  ↓
AssetController::revalue()
  ├─ Validar entrada (valor_nuevo, fecha_efectiva, metodo)
  ├─ Guardar AssetValuation con valores anterior/nuevo
  ├─ Actualizar Asset.valor_compra = valor_nuevo
  ├─ Recalcular depreciación
  ├─ Disparar evento AssetRevalued
  └─ Response: Valuation creada (200)

Métodos de valuación:
  'contable' - Método contable
  'mercado' - Valor de mercado
  'pericia' - Valuación pericial
```

**Archivo:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `revalue()` método

### 3.5 Dar de Baja Activo
```
User -> Asset Detail -> Dispose Dialog
  ↓
POST /api/assets/{id}/dispose
  ↓
AssetController::dispose()
  ├─ Obtener último valor en libros
  ├─ Calcular ganancia/pérdida = valor_venta - valor_en_libros
  ├─ Cambiar estado a 'baja'
  ├─ Registrar movimiento tipo 'baja' con motivo categorizado
  ├─ Disparar evento AssetDisposed
  └─ Response: Baja registrada (200)

Motivos de baja:
  'perdida', 'obsolescencia', 'robo', 'otro'
```

**Archivo:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `dispose()` método

### 3.6 Vender Activo
```
POST /api/assets/{id}/sell
  ├─ Tipo de venta: directa, subasta, licitación
  ├─ Tipo de pago: efectivo, transferencia, cheque, tarjeta, otro
  ├─ Condición: contado, crédito 30/60/90 días
  ├─ Registrar detalles del comprador
  └─ Cambiar estado a 'vendido'
```

---

## 4. API Endpoints

### Assets (Activos)

| Método | Ruta | Controlador | Descripción |
|--------|------|-------------|-------------|
| **GET** | `/api/assets` | AssetController::index | Listar activos con filtros y paginación |
| **POST** | `/api/assets` | AssetController::store | Crear nuevo activo |
| **GET** | `/api/assets/{id}` | AssetController::show | Ver detalles de activo |
| **PUT** | `/api/assets/{id}` | AssetController::update | Actualizar activo |
| **DELETE** | `/api/assets/{id}` | AssetController::destroy | Eliminar activo (soft delete) |
| **GET** | `/api/assets/options` | AssetController::getOptions | Opciones para selects (categorías, ubicaciones, etc.) |
| **GET** | `/api/assets/{id}/qr` | AssetController::generateQR | Generar código QR en PNG |
| **GET** | `/api/assets/{id}/barcode` | AssetController::generateBarcode | Generar código de barras en PNG |
| **GET** | `/api/assets/{id}/label` | AssetController::generateLabel | Generar etiqueta completa en PNG |
| **POST** | `/api/assets/batch-labels` | AssetController::generateBatchLabels | Generar múltiples etiquetas |
| **POST** | `/api/assets/{id}/movements` | AssetController::recordMovement | Registrar movimiento |
| **POST** | `/api/assets/{id}/dispose` | AssetController::dispose | Dar de baja el activo |
| **POST** | `/api/assets/{id}/revalue` | AssetController::revalue | Revaluar activo |
| **POST** | `/api/assets/{id}/sell` | AssetController::sellAsset | Registrar venta |
| **POST** | `/api/assets/{id}/attachments` | AssetController::uploadAttachment | Subir archivo adjunto |
| **DELETE** | `/api/assets/{id}/attachments/{id}` | AssetController::deleteAttachment | Eliminar archivo |

**Autenticación:** Todas requieren `auth:web` (middleware)

### Parámetros Comunes

#### Listar Activos - `GET /api/assets`
Query Parameters:
- `categoria_id` (integer) - Filtrar por categoría
- `ubicacion_id` (integer) - Filtrar por ubicación
- `estado` (string) - Filtrar por estado
- `responsable_id` (integer) - Filtrar por responsable
- `search` (string) - Buscar en código, nombre, serie
- `per_page` (integer, default: 15) - Registros por página

Response:
```json
{
  "data": [
    {
      "id": 1,
      "codigo": "ACT-001",
      "nombre": "Laptop Dell",
      "estado": "asignado",
      "valor_compra": 1200.00,
      "ubicacion": {...},
      "responsable": {...},
      "categoria": {...},
      "info_depreciacion": {
        "depreciacion_mensual": 40.00,
        "valor_en_libros": 960.00,
        "porcentaje_vida_util": 16.67
      }
    }
  ],
  "meta": { "current_page": 1, "per_page": 15, "total": 142 }
}
```

#### Ver Detalle - `GET /api/assets/{id}`
Response incluye:
- Asset con todas sus relaciones
- Últimos 10 movimientos
- Últimas valuaciones
- Últimas 12 depreciaciones
- Información de depreciación calculada
- Attachments y foto principal

#### Crear Activo - `POST /api/assets`
Validaciones:
- `codigo` (required, unique) - Identificador único
- `nombre` (required, string)
- `categoria_id` (required, exists) - FK a categories
- `ubicacion_id` (required, exists) - FK a locations
- `valor_compra` (required, numeric, min:0)
- `fecha_adquisicion` (required, date)
- `tipo_adquisicion` (nullable, in: compra, donacion, transferencia, comodato, leasing, dacion_en_pago, proyecto)
- `responsable_externo` (required_if: tipo_adquisicion, comodato)
- `fecha_devolucion` (required_if: tipo_adquisicion, comodato)
- `valor_estimado` (required_if: tipo_adquisicion, donacion)
- `tipo_leasing` (required_if: tipo_adquisicion, leasing; in: operativo, financiero)
- Otros campos opcionales según tipo de adquisición

#### Registrar Movimiento - `POST /api/assets/{id}/movements`
Payload:
```json
{
  "ubicacion_nueva_id": 5,
  "responsable_nuevo_id": 12,
  "tipo": "comodato",
  "motivo": "Préstamo al departamento de IT",
  "responsable_externo": "Carlos López",
  "empresa_externa": "Tech Solutions",
  "fecha_devolucion": "2026-12-31"
}
```

Validaciones:
- `ubicacion_nueva_id` (required, exists)
- `tipo` (required, in: asignacion, traslado, comodato, devolucion, baja, reubicacion, mantenimiento, prestamo, otro)
- Para comodato: `responsable_externo`, `empresa_externa`, `fecha_devolucion` obligatorios

#### Dar de Baja - `POST /api/assets/{id}/dispose`
Payload:
```json
{
  "motivo": "Equipo obsoleto",
  "motivo_baja": "obsolescencia",
  "valor_venta": 0,
  "fecha_baja": "2026-08-07"
}
```

#### Revaluar - `POST /api/assets/{id}/revalue`
Payload:
```json
{
  "valor_nuevo": 1500.00,
  "fecha_efectiva": "2026-08-07",
  "metodo": "mercado",
  "observaciones": "Valuación según cotización actual"
}
```

#### Vender - `POST /api/assets/{id}/sell`
Payload:
```json
{
  "tipo_venta": "directa",
  "tipo_pago": "transferencia",
  "condicion_pago": "contado",
  "precio_venta": 800.00,
  "comprador_nombre": "Juan Pérez",
  "comprador_documento": "1234567",
  "comprador_telefono": "+34 666 555 444",
  "documento_venta": "FAC-2026-0001"
}
```

### Movimientos

| Método | Ruta | Descripción |
|--------|------|-------------|
| **GET** | `/api/movements` | Listar todos los movimientos con filtros |

### Categorías

| Método | Ruta | Controlador | Descripción |
|--------|------|-------------|-------------|
| **GET** | `/api/categories` | AssetCategoryController::index | Listar categorías |
| **POST** | `/api/categories` | AssetCategoryController::store | Crear categoría |
| **GET** | `/api/categories/{id}` | AssetCategoryController::show | Ver categoría |
| **PUT** | `/api/categories/{id}` | AssetCategoryController::update | Actualizar categoría |
| **DELETE** | `/api/categories/{id}` | AssetCategoryController::destroy | Eliminar categoría (si no tiene activos) |

### Tipos de Bien

| Método | Ruta | Controlador | Descripción |
|--------|------|-------------|-------------|
| **GET** | `/api/asset-types` | AssetTypeController::index | Listar tipos con propiedades |
| **POST** | `/api/asset-types` | AssetTypeController::store | Crear tipo |
| **GET** | `/api/asset-types/{id}` | AssetTypeController::show | Ver detalle |
| **PUT** | `/api/asset-types/{id}` | AssetTypeController::update | Actualizar |
| **DELETE** | `/api/asset-types/{id}` | AssetTypeController::destroy | Eliminar (si no hay activos) |
| **POST** | `/api/asset-types/{id}/properties` | AssetTypeController::storeProperty | Agregar propiedad |
| **PUT** | `/api/asset-types/{id}/properties/{id}` | AssetTypeController::updateProperty | Actualizar propiedad |
| **DELETE** | `/api/asset-types/{id}/properties/{id}` | AssetTypeController::destroyProperty | Eliminar propiedad |

### Ubicaciones

| Método | Ruta | Controlador | Descripción |
|--------|------|-------------|-------------|
| **GET** | `/api/locations` | AssetLocationController::index | Listar ubicaciones |
| **POST** | `/api/locations` | AssetLocationController::store | Crear ubicación |
| **GET** | `/api/locations/{id}` | AssetLocationController::show | Ver ubicación |
| **PUT** | `/api/locations/{id}` | AssetLocationController::update | Actualizar ubicación |
| **DELETE** | `/api/locations/{id}` | AssetLocationController::destroy | Eliminar (si no tiene activos) |

---

## 5. Componentes Clave

### Controllers

#### **AssetController**
**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php)

Inyecciones:
- `QRCodeGenerator` - Generación de códigos
- `DepreciationCalculator` - Cálculos de depreciación
- `AssetCreationBusinessRules` - Validaciones de creación
- `AssetMovementBusinessRules` - Validaciones de movimientos

Métodos públicos:
- `index()` - Lista paginada de activos
- `show()` - Detalle completo de activo
- `store()` - Crear activo nuevo
- `update()` - Actualizar activo
- `destroy()` - Soft delete
- `getOptions()` - Opciones para formularios
- `generateQR()`, `generateBarcode()`, `generateLabel()` - Códigos
- `generateBatchLabels()` - Etiquetas en lote
- `recordMovement()` - Registrar movimiento
- `dispose()` - Dar de baja
- `revalue()` - Revaluar
- `listMovements()` - Listar movimientos
- `sellAsset()` - Registrar venta
- `uploadAttachment()` - Subir archivo
- `deleteAttachment()` - Eliminar archivo

Métodos privados:
- `guardarArchivo()` - Guardar en storage

#### **AssetCategoryController**
**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetCategoryController.php](../../app/Modules/Assets/Http/Controllers/AssetCategoryController.php)

CRUD completo para categorías.

#### **AssetTypeController**
**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetTypeController.php](../../app/Modules/Assets/Http/Controllers/AssetTypeController.php)

CRUD completo para tipos de bien + gestión de propiedades personalizadas.

#### **AssetLocationController**
**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetLocationController.php](../../app/Modules/Assets/Http/Controllers/AssetLocationController.php)

CRUD completo para ubicaciones.

### Services

#### **DepreciationCalculator**
**Ubicación:** [app/Modules/Assets/Services/DepreciationCalculator.php](../../app/Modules/Assets/Services/DepreciationCalculator.php)

Responsabilidades:
- Resolver método de depreciación (lineal/acelerada/unidades)
- Resolver vida útil desde múltiples fuentes
- Calcular depreciación por período
- Guardar registros en BD

Métodos públicos:
- `setMethod(DepreciationMethod)` - Establecer método
- `resolveMethod(Asset)` - Resolver automáticamente
- `resolveVidaUtil(Asset)` - Determinar vida útil
- `calculateForAsset(Asset)` - Calcular todos los períodos
- `saveDepreciation(Asset)` - Guardar en BD

Soporte para múltiples métodos de depreciación implementados como clases separadas.

#### **AssetCreationBusinessRules**
**Ubicación:** [app/Modules/Assets/Services/AssetCreationBusinessRules.php](../../app/Modules/Assets/Services/AssetCreationBusinessRules.php)

Responsabilidades:
- Validar reglas de negocio para creación/actualización
- Aplicar valores derivados automáticamente

Métodos públicos:
- `applyAndValidate(array $data)` - Aplica reglas y retorna errores

Validaciones:
- **Comodato:** Requiere responsable_externo y fecha_devolucion, propiedad=tercero, depreciable=false
- **Leasing:** Operativo (propiedad=tercero, depreciable=false), Financiero (propiedad=propio, depreciable=true)
- **Donación:** Requiere valor_estimado, depreciable=true
- **Tercero (general):** Aplica validaciones adicionales

#### **AssetMovementBusinessRules**
**Ubicación:** [app/Modules/Assets/Services/AssetMovementBusinessRules.php](../../app/Modules/Assets/Services/AssetMovementBusinessRules.php)

Responsabilidades:
- Validar reglas de negocio para movimientos
- Determinar estado siguiente según tipo de movimiento

Métodos públicos:
- `validate(Asset, array $data)` - Retorna array de errores
- `nextState(Asset, array $data)` - Retorna nuevo estado o null

#### **QRCodeGenerator**
**Ubicación:** [app/Modules/Assets/Services/QRCodeGenerator.php](../../app/Modules/Assets/Services/QRCodeGenerator.php)

Responsabilidades:
- Generar códigos QR on-the-fly (sin almacenar)
- Generar códigos de barras
- Generar etiquetas con información del activo
- Registrar acceso en QRAccess para auditoría

Métodos públicos:
- `generateQRCodeBinary(Asset)` - Retorna PNG binario
- `generateBarcodeBinary(Asset)` - Retorna PNG binario
- `generateLabelBinary(Asset)` - Retorna etiqueta completa
- `generateBatchLabels(array $assets, int $columns)` - Múltiples etiquetas
- `logAccess(Asset)` - Registra acceso en QRAccess

### Contratos/Interfaces

#### **DepreciationMethod**
**Ubicación:** [app/Modules/Assets/Contracts/DepreciationMethod.php](../../app/Modules/Assets/Contracts/DepreciationMethod.php)

Interfaz para implementar métodos de depreciación:
```php
interface DepreciationMethod {
    public function calculate(
        float $valorCompra,
        float $valorResidual,
        int $vidaUtil,
        int $periodo
    ): float;
}
```

Implementaciones:
- [LinearDepreciation](../../app/Modules/Assets/Services/Depreciation/LinearDepreciation.php) - Línea recta
- [AcceleratedDepreciation](../../app/Modules/Assets/Services/Depreciation/AcceleratedDepreciation.php) - Método acelerado
- [UnitsOfProductionDepreciation](../../app/Modules/Assets/Services/Depreciation/UnitsOfProductionDepreciation.php) - Por unidades

---

## 6. Business Rules (Reglas de Negocio)

### 6.1 Tipos de Adquisición y sus Reglas

#### Compra
- `propiedad` = 'propio'
- `depreciable` = true (si es tipo depreciable)
- Requiere: `valor_compra`, `fecha_adquisicion`

#### Donación
- `propiedad` = 'propio'
- `depreciable` = true
- **Requiere:** `valor_estimado` (valuación del bien donado)
- No requiere: factura, orden de compra
- Requiere: `donante_nombre`, `donacion_documento` (documento del donante)

#### Transferencia
- `propiedad` = 'propio' (ya lo era en la entidad anterior)
- `depreciable` = true o false (según el tipo)
- Puede incluir:
  - `depreciacion_acumulada_transferencia` - Depreciación acumulada en origen
  - `vida_util_restante` - Años de vida útil aún disponibles
  - `valor_estimado` - Nuevo valor si aplica ajuste

#### Comodato
- `propiedad` = 'tercero' ⚠️
- `depreciable` = false ⚠️ (No se deprecian préstamos)
- **Requiere:**
  - `responsable_externo` - Nombre del tercero responsable
  - `fecha_devolucion` - Fecha de retorno esperado
- Estado inicial: 'en_comodato'

#### Leasing Operativo
- `propiedad` = 'tercero'
- `depreciable` = false
- El arrendador conserva propiedad del bien
- No genera gasto de depreciación

#### Leasing Financiero
- `propiedad` = 'propio' (la organización es dueña después de período)
- `depreciable` = true
- Genera gasto de depreciación desde inicio

#### Dación en Pago
- `propiedad` = 'propio'
- `depreciable` = true
- **Requiere:**
  - `dacion_acreedor` - Nombre del acreedor
  - `dacion_deuda_original` - Deuda que cancela con el bien

#### Proyecto
- `propiedad` = 'propio'
- `depreciable` = true
- **Requiere:** `proyecto_nombre` - Nombre del proyecto al que pertenece

### 6.2 Reglas de Depreciación

#### Inicio de Depreciación
- **Sin regla del día 15:** Comienza el primer día del mes de adquisición
- **Con regla del día 15:**
  - Si `fecha_adquisicion` es ≤ día 15: Inicia el primer día del mes actual
  - Si `fecha_adquisicion` es > día 15: Inicia el primer día del mes siguiente

Controlado por campo `aplicar_regla_dia_15` (boolean)

#### Métodos de Depreciación Soportados
1. **Lineal (Línea Recta):**
   - Depreciación anual = (Valor - Residual) / Vida útil
   - Depreciación mensual = Depreciación anual / 12
   - Más común en normativa contable

2. **Acelerada:**
   - Mayor depreciación en primeros años
   - Útil cuando bien pierde valor rápidamente

3. **Unidades de Producción:**
   - Basada en producción/uso real del activo
   - Requiere track de producción/horas

#### Resolución de Vida Útil (Orden de Prioridad)
1. Valor explícito en campo `vida_util_anos` del activo
2. Tasa configurada en `system_settings` para el tipo de bien
3. Vida útil default del `AssetType`
4. Fallback: 5 años

#### Cálculo de Valor Residual
Si no se proporciona al crear:
```
valor_residual = valor_compra * (porcentaje_residual / 100)
```
Porcentaje obtenido de `system_settings` (default: 10%)

### 6.3 Reglas de Movimientos

#### No Permitidos
- No se puede mover un activo con estado: baja, retirado, vendido
- No se puede devolver un comodato que no está en estado 'en_comodato'

#### Comodato
- Solo activos con `propiedad='propio'`
- Requiere: `responsable_externo`, `empresa_externa`, `fecha_devolucion`
- Cambia estado a 'en_comodato'

#### Devolución
- Solo aplica si estado actual = 'en_comodato'
- Cambia estado a 'disponible'
- Limpia `responsable_externo`, `empresa_externa`

#### Cambio de Estado
Calculado automáticamente según tipo de movimiento:
```
asignacion -> 'asignado'
comodato -> 'en_comodato'
devolucion -> 'disponible'
(otros) -> estado actual (sin cambio)
```

### 6.4 Reglas de Baja

- El activo debe estar en estado activo/disponible/asignado/etc (no baja/retirado/vendido)
- Se registra un movimiento de tipo 'baja' con motivo categorizado
- Se calcula ganancia/pérdida: `precio_venta - valor_en_libros`
- Se dispara evento `AssetDisposed` para contabilidad

Motivos válidos:
- `perdida` - Activo perdido
- `obsolescencia` - Ya no funciona
- `robo` - Robo reportado
- `otro` - Otro motivo

### 6.5 Reglas de Valuación/Revalúo

- Se crea registro `AssetValuation` con valores antes/después
- Se actualiza `Asset.valor_compra` con nuevo valor
- Se recalcula depreciación automáticamente
- Se dispara evento `AssetRevalued`

Métodos de valuación:
- `contable` - Análisis contable
- `mercado` - Cotización actual en mercado
- `pericia` - Valuación por perito profesional

---

## 7. Componentes React (UI)

**Ubicación:** [resources/js/Pages/Assets/](../../resources/js/Pages/Assets/)

### **Assets/Index.jsx** - Listado de Activos
- **Propósito:** Pantalla principal para listar, buscar y filtrar activos
- **Componentes usados:** DataTable (PrimeReact), Dialog, Toast, Dropdown, InputText
- **Funcionalidades:**
  - Listado paginado de activos
  - Filtros por categoría, ubicación, estado, responsable
  - Búsqueda en código, nombre, serie
  - Diálogos para: Dar de baja, Revaluar, QR/Barcode, Vender
  - Acciones contextuales (editar, eliminar, ver detalles)
  - Generación de etiquetas en lote

**Props:**
- `user` - Usuario autenticado

**Estado local:**
- `assets` - Array de activos
- `loading` - Flag de carga
- `displayDialog` - Control de diálogos
- `disposeData`, `revalueData`, `sellData` - Datos de acciones

### **Assets/Create.jsx** - Crear Activo
- **Propósito:** Formulario para crear nuevo activo
- **Componentes:** Form fields (InputText, InputNumber, Calendar, Dropdown), FileUpload, Message
- **Funcionalidades:**
  - Formulario dinámico según tipo de adquisición
  - Validación en cliente
  - Cálculo automático de valor residual
  - Upload de foto y documentos
  - Secciones condicionales según tipo (comodato, leasing, donación, etc.)

**Campos principales:**
- Datos básicos: código, nombre, marca, modelo, serie
- Identificación: categoría, tipo, ubicación
- Financiero: valor compra, residual, vida útil
- Adquisición: tipo, propiedad, depreciable
- Personalizados según tipo de adquisición
- Archivos: foto, documentos

### **Assets/Show.jsx** - Ver Detalle
- **Propósito:** Pantalla de detalle con pestañas
- **Componentes:** TabView, DataTable, Image, ProgressBar, Dialog
- **Pestañas:**
  1. **Información General** - Datos del activo
  2. **Depreciación** - Historial y cálculos
  3. **Movimientos** - Historial de cambios
  4. **Valuaciones** - Revalúos realizados
  5. **Archivos** - Fotos, facturas, etc.
  6. **Acceso QR** - Auditoría de accesos

**Funcionalidades:**
- Vista completa del activo
- Información de depreciación calculada
- Historial de movimientos
- Upload de archivos adicionales
- Acceso a generación de QR/código de barras

### **Assets/Edit.jsx** - Editar Activo
- **Propósito:** Formulario para actualizar activo
- **Similar a Create.jsx** pero con datos precargados
- **Validaciones:** Debe cumplir reglas de negocio

### **Componentes Reutilizables**

#### **PermissionGate.jsx**
```jsx
<PermissionGate permission="assets.create">
  <Button>Crear Activo</Button>
</PermissionGate>
```

Controla visibilidad basada en permisos Spatie.

#### **QRScanner.jsx**
Componente para escanear códigos QR de activos (en inventarios).

### Composables (Hooks Personalizados)

#### **usePermissions()**
```javascript
const { hasPermission, can } = usePermissions();
```

Verificar permisos del usuario autenticado.

---

## 8. Integración con Otros Módulos

### Employees (Empleados)
- **Relación:** Asset.responsable_id → Employee.id
- **Uso:** Asignar activos a empleados, comodatos
- **En Movimientos:** `responsable_nuevo_id` FK a Employee
- **Servicio:** [EmployeeSyncService](../../app/Modules/Employees/Services/EmployeeSyncService.php) - Sincronizar empleados

### Suppliers (Proveedores)
- **Relación:** Asset.proveedor_id → Supplier.id
- **Uso:** Registrar de quién se compró el activo
- **Garanía:** Información del proveedor para reclamaciones

### Accounting (Contabilidad)
- **Integración:** Eventos disparan asientos contables
  - `AssetCreated` → Asiento de compra
  - `AssetDepreciated` → Gasto de depreciación
  - `AssetRevalued` → Ajuste de valor
  - `AssetDisposed` → Ganancia/Pérdida en venta
- **Cuentas Contables:**
  - `AssetType.expenseAccount` - Cuenta de gasto (depreciación)
  - `AssetType.accumulatedAccount` - Cuenta de depreciación acumulada
- **Listeners:** [PublishToAccountingQueue](../../app/Modules/Assets/Listeners/PublishToAccountingQueue.php) (stub)

### Inventory (Inventario)
- **Sincronización:** Ciclos de inventario verifican existencia de activos
- **Discrepancias:** Se registran si no se encuentran activos
- **Estados:** Estado del activo se refleja en auditorías

### Maintenance (Mantenimiento)
- **Estado:** Activos en estado 'mantenimiento'
- **Órdenes:** Se pueden crear órdenes de mantenimiento desde Asset
- **Relación:** MaintenanceOrder.asset_id → Asset.id

### Reports (Reportes)
- **Reportes:** Generados desde Assets
  - Inventario de activos
  - Depreciación acumulada
  - Movimientos por período
  - Análisis de valuaciones
  - Activos por ubicación/responsable

---

## 9. Eventos y Listeners

### Eventos Disparados

#### **AssetCreated**
```php
event(new AssetCreated($asset));
```
**Cuándo:** Cuando se crea un activo nuevo
**Listeners:**
- `LogAssetCreated` - Registra en activity_log
- `PublishToAccountingQueue` - Publicar asiento (stub)

**Payload:**
```php
class AssetCreated {
    public function __construct(public Asset $asset) {}
}
```

#### **AssetMoved**
```php
event(new AssetMoved($movement));
```
**Cuándo:** Cuando se registra un movimiento
**Listeners:**
- `LogAssetMoved` - Registra en activity_log

#### **AssetRevalued**
```php
event(new AssetRevalued($valuation));
```
**Cuándo:** Cuando se revalúa un activo
**Listeners:**
- `LogAssetRevalued` - Registra en activity_log

#### **AssetDepreciated**
```php
event(new AssetDepreciated($asset, $depreciacion));
```
**Cuándo:** Cuando se calcula depreciación
**Listeners:** (puede usarse para cálculos contables)

#### **AssetDisposed**
```php
event(new AssetDisposed($asset, $valorEnLibros));
```
**Cuándo:** Cuando se da de baja un activo
**Listeners:**
- `PublishToAccountingQueue` - Registrar ganancia/pérdida

### Listeners

**Ubicación:** [app/Modules/Assets/Listeners/](../../app/Modules/Assets/Listeners/)

#### **LogAssetCreated.php**
Registra en Spatie Activity Log:
- Quién creó el activo
- Todas las propiedades del activo
- Marca: "Activo creado: [nombre]"

#### **LogAssetMoved.php**
Registra movimiento en activity log

#### **LogAssetRevalued.php**
Registra revalúo en activity log

### Registro de Eventos
**Ubicación:** [app/Providers/EventServiceProvider.php](../../app/Providers/EventServiceProvider.php)

```php
protected $listen = [
    AssetCreated::class => [LogAssetCreated::class, PublishToAccountingQueue::class],
    AssetMoved::class => [LogAssetMoved::class],
    AssetRevalued::class => [LogAssetRevalued::class],
    AssetDisposed::class => [PublishToAccountingQueue::class],
];
```

---

## 10. Validaciones y Rules

### Validaciones en Creación

**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `store()` method

Reglas básicas:
- `codigo` - required, unique:assets
- `nombre` - required, string
- `categoria_id` - required, exists:asset_categories
- `ubicacion_id` - required, exists:asset_locations
- `valor_compra` - required, numeric, min:0
- `fecha_adquisicion` - required, date

Reglas específicas por tipo de adquisición (ver AssetCreationBusinessRules).

### Validaciones en Movimiento

**Ubicación:** [app/Modules/Assets/Http/Controllers/AssetController.php](../../app/Modules/Assets/Http/Controllers/AssetController.php) - `recordMovement()` method

- `ubicacion_nueva_id` - required, exists
- `tipo` - required, in: [tipos válidos]
- Para comodato: `responsable_externo`, `empresa_externa`, `fecha_devolucion` obligatorios

---

## 11. Brecha de Migraciones (Importante)

⚠️ **Observación:** La migración [2024_02_25_000001_create_asset_tables.php](../../database/migrations/2024_02_25_000001_create_asset_tables.php) define una estructura inicial, pero **la estructura actual del modelo Asset.php tiene MUCHOS más campos que NO están en la migración original**.

**Campos faltantes en migración:**
- `asset_type_id` - Foreign key a asset_types
- `metodo_depreciacion`, `periodicidad_depreciacion`
- `aplicar_regla_dia_15`, `fecha_inicio_depreciacion`
- `tipo_adquisicion`, `propiedad`, `depreciable`
- `tipo_leasing`, `valor_estimado`
- `depreciacion_acumulada_transferencia`, `vida_util_restante`
- `responsable_externo`, `fecha_devolucion`
- `orden_compra`, `numero_factura`
- `donante_nombre`, `donacion_documento`
- `proyecto_nombre`
- `dacion_acreedor`, `dacion_deuda_original`

**Migraciones posteriores:** [2024_02_25_000006_structural_fixes.php](../../database/migrations/2024_02_25_000006_structural_fixes.php) podría contener estos campos.

⚠️ **Riesgo:** Potencialmente hay inconsistencias entre modelo y BD real. Verificar migraciones posteriores.

---

## 12. Gaps y Riesgos Identificados

### Gaps Funcionales

#### 1. **Métodos de Depreciación**
- ✅ Lineal: Implementado completamente
- ⚠️ Acelerada: Clase existe pero podría necesitar refinamiento
- ⚠️ Unidades de Producción: Estructura existe, falta integración de entrada de datos de producción
- **Riesgo:** No hay UI para registrar unidades producidas

#### 2. **Integración Contable**
- **Estado:** Listeners `PublishToAccountingQueue` son stubs
- **Falta:** Implementación real de asientos contables
- **Impacto:** Módulo de Accounting podría no recibir eventos
- **Recomendación:** Completar listeners antes de usar en producción

#### 3. **Depreciación Acumulada en Transferencias**
- Campo `depreciacion_acumulada_transferencia` existe
- **Falta:** Lógica para inicializar depreciación con saldo anterior
- **Riesgo:** Transferencias podrían recalcular desde cero incorrectamente

#### 4. **Estados Legados vs Nuevos**
- **Legacy:** 'activo', 'mantenimiento', 'inactivo', 'descartado', 'retirado'
- **Nuevos:** 'disponible', 'asignado', 'en_comodato', 'baja', 'vendido'
- **Problema:** Mezcla de esquemas
- **Impacto:** Confusión en lógica de transiciones de estado

#### 5. **Venta de Activos**
- Endpoint `POST /api/assets/{id}/sell` mencionado pero no totalmente documentado
- **Falta:** Implementación completa de lógica de venta
- **UI:** Diálogo en Index.jsx pero podría estar incompleto

#### 6. **Archivos Adjuntos**
- Modelo `AssetAttachment` y endpoints existen
- **Falta:** Validación de tipos de archivo, almacenamiento seguro
- **Riesgo:** Potencial vulnerabilidad de carga de archivos

#### 7. **Valores Personalizados (Custom Values)**
- Estructura existe (`AssetCustomValue`, `AssetTypeProperty`)
- **Falta:** UI para gestionar propiedades personalizadas en Create/Edit
- **Impacto:** Funcionalidad no completamente accesible

#### 8. **QR/Barcode**
- ✅ Generación on-the-fly implementada
- **Falta:** Lectura/escaneo integrado (existe componente `QRScanner.jsx` pero no completamente usado)
- **Falta:** Integración con app mobile o lectores de códigos

#### 9. **Regla del Día 15**
- Implementada en el modelo
- **Falta:** UI clara en formularios para explicar/controlar esta regla
- **Riesgo:** Usuarios podrían no entender su efecto

#### 10. **Validación de Fechas**
- `fecha_devolucion` debe ser mayor a hoy (validator en create)
- **Falta:** Validación similar en movimientos/comodatos
- **Riesgo:** Pueden registrarse fechas incorrectas

### Riesgos Identificados

#### 1. **Inconsistencia Modelo-Migración**
- Modelo tiene ~40+ campos
- Migración original muy básica
- **Acción:** Verificar y completar migraciones

#### 2. **Depreciación y Transferencias**
- Campo `depreciacion_acumulada_transferencia` pero sin lógica de importación
- Podría recalcular erroneamente depreciación de bien transferido
- **Acción:** Validar en cada transferencia

#### 3. **Eventos sin Implementación**
- Listeners para Accounting son stubs
- Integraciones contables no funcionales
- **Acción:** Completar implementación antes de auditoría

#### 4. **Soft Deletes sin Cascada**
- Assets usa SoftDeletes pero relaciones usan constrained()
- Podría romper al intentar eliminar
- **Acción:** Revisar foreign keys y on delete behavior

#### 5. **Performance en Listados Grandes**
- Sin optimización de N+1 queries observable
- DataTable carga toda relación para cada activo
- **Acción:** Implementar lazy loading o eager loading condicional

#### 6. **Validación de Reglas de Negocio**
- AssetCreationBusinessRules es servicio separado
- Si se actualiza Asset directamente, reglas no se aplican
- **Acción:** Considerar pasar reglas al modelo (scopes/methods)

#### 7. **Seguridad de Permisos**
- Controllers verifica `auth:web` pero no hay checks de permiso granular
- Alguien autenticado puede ver/modificar cualquier activo
- **Acción:** Implementar Policies de Spatie (Asset policy)

#### 8. **Manejo de Errores en Upload**
- Upload de archivos poco documentado
- No se menciona límite de almacenamiento
- **Acción:** Documentar estrategia de almacenamiento

#### 9. **Revalúos Múltiples**
- Se permite revalúo frecuente sin restricciones
- Podría generar inconsistencias contables
- **Acción:** Considerar restricción de revalúos por período

#### 10. **Depreciación y Cambio de Activo_type**
- Si se cambia asset_type después de creación
- Vida útil default podría afectar depreciación
- No hay recálculo automático
- **Acción:** Validar que cambiar tipo no afecte depreciaciones existentes

### Recomendaciones

1. **Completar migraciones:** Asegurar que BD tenga todos los campos del modelo
2. **Implementar Policies:** Agregar seguridad basada en permisos para Assets
3. **Acabar Integración Contable:** Completar listeners de AssetCreated, AssetDisposed, AssetRevalued
4. **Pruebas E2E:** Probar flujos completos de adquisición → movimientos → depreciación → baja
5. **Documentar Regla del Día 15:** En UI y manuales de usuario
6. **Validar Transferencias:** Garantizar que depreciación acumulada se transfiera correctamente
7. **Agregar Políticas de Soft Delete:** Definir qué sucede al eliminar categorías/tipos con activos
8. **Performance:** Profiling de queries en listado de 1000+ activos
9. **Auditoría:** Registrar cambios críticos (baja, revalúo, cambio de responsable)
10. **Documentación de Usuario:** Guía sobre tipos de adquisición y reglas de depreciación

---

## 13. Configuración y Settings

**Ubicación:** `config/app-config.php` (propuesto)  
**Actual:** Sistema de settings se obtiene de `SystemSetting` model

Configuraciones usadas en Assets:
- `valor_residual_porcentaje` (default: 10) - Porcentaje para calcular residual
- `tasas_por_tipo` (array) - Tasas de depreciación por tipo de bien
- `depreciation_method` (default: 'lineal') - Método global

---

## 14. Testing

**Ubicación:** [tests/](../../tests/) - Pruebas unitarias y feature tests

Áreas a probar:
- CRUD de Assets con validaciones
- Business Rules (comodato, leasing, donación)
- Cálculo de Depreciación
- Movimientos y cambios de estado
- Generación de QR/Barcode
- Eventos y listeners
- Integraciones con Accounting

---

## 15. Resumen Rápido

| Aspecto | Estado |
|--------|--------|
| **CRUD Básico** | ✅ Completo |
| **Tipos de Adquisición** | ✅ Implementado |
| **Depreciación** | ✅ Lineal funcional |
| **Movimientos** | ✅ Funcional |
| **Revalúos** | ✅ Funcional |
| **QR/Códigos** | ✅ Generación on-the-fly |
| **Archivos Adjuntos** | ✅ Endpoints implementados |
| **Seguridad/Policies** | ⚠️ Solo auth, sin permisos granulares |
| **Integración Contable** | ⚠️ Stubs sin implementación |
| **UI React** | ✅ Páginas principales implementadas |
| **Métodos Depreciación** | ⚠️ Acelerada/Unidades estructuras sin refinamiento |

---

## Documentación Relacionada

- [Módulo Accounting](./accounting.md) - Para asientos contables
- [Módulo Employees](./employees.md) - Para responsables
- [Módulo Inventory](./inventory.md) - Para auditorías
- [Módulo Maintenance](./maintenance.md) - Para órdenes
- [API Routes](../../routes/api.php) - Rutas completas
- [Database Migrations](../../database/migrations/) - Esquema DB

---

**Última Actualización:** Agosto 2026  
**Documentado por:** Módulo Documentation Agent  
**Basado en inspección de código real**
