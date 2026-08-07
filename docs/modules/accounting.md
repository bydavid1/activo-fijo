# Módulo Accounting - Integración Contable

## 1. Overview

El módulo **Accounting** proporciona integración contable del sistema de activos fijos. Gestiona el catálogo de cuentas y registra asientos contables automáticamente a partir de eventos de activos (creación, depreciación, disposición, revaluación).

**Responsabilidades principales:**
- Mantener catálogo de cuentas contables (plan de cuentas)
- Registrar asientos contables automáticos por eventos de activos
- Cálculo automático de depreciación mensual
- Registro de ganancias/pérdidas en disposiciones
- Ajustes por revaluación
- Cierre de períodos contables
- Auditoría de asientos

**Stack técnico:**
- Backend: Laravel Controllers, Models, Services
- Frontend: React/Inertia.js con TreeTable (PrimeReact)
- Base de datos: Relacional jerárquica

---

## 2. Domain Model

### Entidades Principales

#### **AccountingAccount** (Cuenta Contable)
Tabla: `accounting_accounts`

Representa una cuenta en el plan de cuentas (estructura jerárquica).

**Atributos:**
- `parent_id` (FK, nullable) - Cuenta padre en jerarquía
- `codigo` (string, única) - Código contable (ej: 1110, 6210)
- `nombre` (string) - Descripción de la cuenta
- `tipo` (enum) - Ver tipos
- `estado` (enum: 'activo', 'inactivo') - Si se puede usar en asientos
- `nivel` (integer, default 1) - Profundidad en jerarquía
- `created_at`, `updated_at`, `deleted_at` (timestamps)

**Relaciones:**
- `parent()`: BelongsTo AccountingAccount (cuenta padre)
- `children()`: HasMany AccountingAccount (subcuentas)
- `journalLines()`: HasMany JournalEntryLine (asientos que la usan)

**Ubicación:** [app/Modules/Accounting/Models/AccountingAccount.php](../../app/Modules/Accounting/Models/AccountingAccount.php)

**Tipos de Cuenta:**
```
- 'activo' - Activos (1000+)
  * 1100 Activos Corrientes
    - 1110 Bancos
    - 1120 Caja
  * 1200 Activos Fijos
    - 1210 Propiedad Planta Equipo
    - 1220 Depreciación Acumulada (contraactivo)
  
- 'pasivo' - Pasivos (2000+)
  * 2100 Pasivos Corrientes
  * 2200 Pasivos Largo Plazo
  
- 'patrimonio' - Patrimonio (3000+)
  * 3100 Capital Social
  * 3200 Resultados Acumulados
  
- 'ingreso' - Ingresos (4000+)
  * 4100 Ingresos Operacionales
  * 4200 Otros Ingresos
  
- 'gasto' - Gastos (5000+)
  * 5100 Gastos Operacionales
    - 5110 Depreciación
    - 5120 Gasto en Venta Activos
  * 5200 Otros Gastos
```

**Estructura Jerárquica:**
- Nivel 1: Tipos principales (Activos, Pasivos, etc.) - `parent_id = NULL`
- Nivel 2: Categorías (Corriente, Fijo, etc.) - `parent_id = Tipo`
- Nivel 3+: Subcuentas detalladas - anidadas hasta necesario

#### **JournalEntry** (Asiento Contable)
Tabla: `journal_entries`

Representa un asiento contable que afecta múltiples cuentas.

**Atributos:**
- `fecha` (date) - Fecha de contabilización
- `descripcion` (string) - Descripción del asiento
- `asset_id` (FK, nullable) - Activo relacionado (si aplica)
- `tipo_origen` (string, nullable) - Origen del asiento
  - 'depreciacion' - Calculado automáticamente
  - 'adquisicion' - Por creación de activo
  - 'disposicion' - Por baja/venta de activo
  - 'revaluacion' - Por revalúo
  - 'manual' - Entrada manual del usuario
- `estado` (enum: 'borrador', 'validado', 'anulado')
- `created_at`, `updated_at`, `deleted_at` (timestamps)

**Relaciones:**
- `asset()`: BelongsTo Asset (activo relacionado)
- `lines()`: HasMany JournalEntryLine - Líneas del asiento

**Ubicación:** [app/Modules/Accounting/Models/JournalEntry.php](../../app/Modules/Accounting/Models/JournalEntry.php)

**Estados:**
```
- 'borrador' - No validado, puede editarse
- 'validado' - Contabilizado, afecta reportes
- 'anulado' - Anulado, sin efecto contable
```

#### **JournalEntryLine** (Línea de Asiento)
Tabla: `journal_entry_lines`

Línea individual de débito/crédito en un asiento.

**Atributos:**
- `journal_entry_id` (FK)
- `accounting_account_id` (FK) - Cuenta afectada
- `debe` (decimal, default 0) - Cantidad en debe
- `haber` (decimal, default 0) - Cantidad en haber
- `created_at`, `updated_at` (timestamps)

**Restricciones:**
- Una línea tiene DEBE = 0 OR HABER = 0 (nunca ambos)
- La suma de todos los DEBE en un asiento = suma de todos los HABER

**Ubicación:** [app/Modules/Accounting/Models/JournalEntryLine.php](../../app/Modules/Accounting/Models/JournalEntryLine.php)

---

## 3. Flujos Principales

### Flujo 1: Crear Cuenta Contable

```
Usuario (Accountant) → POST /api/accounting/accounts
   ↓
AccountingAccountController::store()
   ├─ Validar código (único)
   ├─ Validar tipo válido
   ├─ Si parent_id: validar que existe y es del mismo tipo
   ├─ Crear AccountingAccount
   ├─ Calcular nivel automáticamente
   └─ Response: Cuenta creada (201)
```

### Flujo 2: Crear Asiento Manual

```
Usuario → POST /api/accounting/journal-entries
   ├─ Validar fecha
   ├─ Validar líneas:
   │  ├─ Cada línea tiene account_id, debe, haber
   │  ├─ No ambos (debe y haber) pueden ser > 0
   │  └─ Sum(debe) = Sum(haber) para todo el asiento
   ├─ Crear JournalEntry con estado='validado'
   ├─ Crear JournalEntryLine para cada línea
   └─ Response: Asiento creado (201)
```

### Flujo 3: Asiento Automático por Creación de Activo

```
[Evento AssetCreated disparado]
   ↓
Listener: PublishToAccountingQueue (stub)
   ├─ Determinar cuenta para el tipo de activo
   ├─ Crear JournalEntry:
   │  ├─ DEBE: Cuenta Activo Fijo (1210)
   │  ├─ HABER: Cuenta de Pasivo o Patrimonio
   │  └─ tipo_origen = 'adquisicion'
   ├─ Crear JournalEntryLines
   └─ Registrar en BD

Ejemplo:
Compra activo por $1000:
  DEBE: 1210 Propiedad Planta Equipo    $1000
  HABER: 2110 Cuentas por Pagar                $1000
```

### Flujo 4: Asiento Automático de Depreciación (Mensual)

```
Scheduler → Ejecuta job mensual
   ↓
JournalEntryService::runMonthlyDepreciation()
   ├─ Para cada activo deprecable:
   │  ├─ Calcular depreciación del mes
   │  ├─ Crear JournalEntry:
   │  │  ├─ DEBE: Cuenta Gasto Depreciación (5110)
   │  │  ├─ HABER: Depreciación Acumulada (1220)
   │  │  └─ tipo_origen = 'depreciacion'
   │  └─ Crear JournalEntryLines
   └─ Registrar en BD

Ejemplo (mes 1):
Depreciación $40 por mes (1200 valor / 30 meses):
  DEBE: 5110 Gasto Depreciación        $40
  HABER: 1220 Depreciación Acumulada        $40
```

### Flujo 5: Asiento por Disposición (Venta/Baja)

```
[Evento AssetDisposed disparado]
   ↓
Listener: PublishToAccountingQueue
   ├─ Obtener datos de disposición (precio venta, valor en libros)
   ├─ Calcular ganancia/pérdida = precio_venta - valor_en_libros
   ├─ Crear JournalEntry con múltiples líneas:
   │  ├─ DEBE: Caja/Bancos (valor recibido)
   │  ├─ DEBE: Depreciación Acumulada (eliminar acumulada)
   │  ├─ HABER: Activo Fijo (valor original)
   │  ├─ HABER o DEBE: Ganancia/Pérdida (según resultado)
   │  └─ tipo_origen = 'disposicion'
   └─ Registrar en BD

Ejemplo:
Se vende activo original $1000, acumulada $300, precio venta $600:
  DEBE: 1110 Bancos                    $600
  DEBE: 1220 Depreciación Acumulada    $300
  HABER: 1210 Propiedad Planta Equipo      $1000
  HABER: 5120 Pérdida en Venta             $100
```

### Flujo 6: Ver Asientos

```
GET /api/accounting/journal-entries
   ├─ Listar asientos con filtros: tipo_origen, fecha, asset_id
   ├─ Incluir líneas y cuentas
   └─ Response: Array de asientos
```

### Flujo 7: Cierre de Período

```
GET /api/accounting/journal-entries/close-history
   ├─ Obtener asientos del período anterior
   ├─ Calcular saldos de resultados
   ├─ Transferir a resultado acumulado (si aplica)
   └─ Response: Datos de cierre
```

---

## 4. API Endpoints

### Cuentas Contables

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/accounting/accounts` | Listar cuentas (árbol o plano) | tipo, plano |
| POST | `/api/accounting/accounts` | Crear cuenta | parent_id, codigo, nombre, tipo, estado |
| PUT | `/api/accounting/accounts/{id}` | Actualizar cuenta | nombre, estado, nivel |

### Asientos Contables

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/accounting/journal-entries` | Listar asientos | tipo_origen, fecha_desde, fecha_hasta, asset_id, per_page |
| POST | `/api/accounting/journal-entries` | Crear asiento manual | fecha, descripcion, asset_id, lines |
| GET | `/api/accounting/journal-entries/{id}` | Ver detalles | - |
| POST | `/api/accounting/journal-entries/run-depreciation` | Calcular depreciación del mes | - |
| GET | `/api/accounting/journal-entries/close-history` | Historial de cierre | - |

### Parámetros Comunes

**GET /api/accounting/accounts**
```
?tipo=activo              // Filtrar por tipo de cuenta
?plano=true               // Si es true: lista plana, si false/omitido: estructura jerárquica
```

Response (jerárquico):
```json
{
  "data": [
    {
      "key": 1,
      "data": {
        "id": 1,
        "codigo": "1",
        "nombre": "ACTIVOS",
        "tipo": "activo"
      },
      "children": [
        {
          "key": 2,
          "data": {
            "id": 2,
            "codigo": "1100",
            "nombre": "Activos Corrientes",
            "tipo": "activo"
          },
          "children": [...]
        }
      ]
    }
  ]
}
```

**GET /api/accounting/journal-entries**
```
?tipo_origen=depreciacion   // Filtrar por origen
?fecha_desde=2026-01-01     // Fecha mínima
?fecha_hasta=2026-12-31     // Fecha máxima
?asset_id=42                // Asientos de este activo
?per_page=50
```

Response:
```json
{
  "data": [
    {
      "id": 1,
      "fecha": "2026-08-01",
      "descripcion": "Depreciación Agosto 2026",
      "asset_id": 42,
      "tipo_origen": "depreciacion",
      "estado": "validado",
      "lines": [
        {
          "id": 1,
          "accounting_account": { "id": 10, "codigo": "5110", "nombre": "Gasto Depreciación" },
          "debe": 40.00,
          "haber": 0
        },
        {
          "id": 2,
          "accounting_account": { "id": 11, "codigo": "1220", "nombre": "Depreciación Acumulada" },
          "debe": 0,
          "haber": 40.00
        }
      ]
    }
  ]
}
```

**Crear Asiento - POST /api/accounting/journal-entries**

Validaciones:
- `fecha` (required, date, <= today)
- `descripcion` (required, string)
- `asset_id` (nullable, exists)
- `lines` (required, array, min 2)
  - `accounting_account_id` (required, exists)
  - `debe` (required, numeric, >= 0)
  - `haber` (required, numeric, >= 0)
- Verificar: Sum(debe) = Sum(haber)
- Verificar: Cada línea tiene DEBE = 0 OR HABER = 0

Payload:
```json
{
  "fecha": "2026-08-07",
  "descripcion": "Compra de laptop",
  "asset_id": 42,
  "lines": [
    {
      "accounting_account_id": 8,
      "debe": 1200.00,
      "haber": 0
    },
    {
      "accounting_account_id": 15,
      "debe": 0,
      "haber": 1200.00
    }
  ]
}
```

---

## 5. Componentes Clave

### Controllers

**AccountingAccountController** ([app/Modules/Accounting/Http/Controllers/AccountingAccountController.php](../../app/Modules/Accounting/Http/Controllers/AccountingAccountController.php))

Métodos:
- `index()` - Vista frontend (Inertia)
- `apiIndex()` - API para obtener cuentas (árbol o plano)
- `store()` - Crear cuenta
- `update()` - Actualizar cuenta
- `buildTree()` - Construir jerarquía en memoria para TreeTable

**JournalEntryController** ([app/Modules/Accounting/Http/Controllers/JournalEntryController.php](../../app/Modules/Accounting/Http/Controllers/JournalEntryController.php))

Métodos:
- `index()` - Vista frontend
- `create()` - Vista de creación
- `show()` - Vista de detalle
- `apiIndex()` - API listado paginado
- `apiShow()` - API detalles
- `store()` - Crear asiento manual
- `runMonthlyDepreciation()` - Ejecutar depreciación del mes
- `closeHistory()` - Obtener datos de cierre de período

### Services

**JournalEntryService** ([app/Modules/Accounting/Services/JournalEntryService.php](../../app/Modules/Accounting/Services/JournalEntryService.php))

Responsabilidades:
- Crear asientos contables
- Validar balance de débito/crédito
- Calcular depreciación automática

Métodos:
- `createEntry(array $data)` - Crear asiento con líneas
- `validateBalance(array $lines)` - Validar Sum(debe) = Sum(haber)
- `calculateMonthlyDepreciation()` - Calcular depreciación del mes
- `createDepreciationEntry(Asset, float $monto)` - Crear asiento de depreciación

### Listeners (Eventos)

**PublishToAccountingQueue** ([app/Modules/Assets/Listeners/PublishToAccountingQueue.php](../../app/Modules/Assets/Listeners/PublishToAccountingQueue.php)) - STUB

Escucha eventos de Assets y crea asientos automáticos:
- Evento `AssetCreated` → Asiento inicial
- Evento `AssetDepreciated` → Asiento de depreciación
- Evento `AssetDisposed` → Asiento de disposición
- Evento `AssetRevalued` → Asiento de revaluación

---

## 6. Business Rules

### 6.1 Plan de Cuentas

- **Estructura:** Jerárquica con máximo 5 niveles
- **Código único:** Identificador contable único
- **Tipos fijos:** activo, pasivo, patrimonio, ingreso, gasto (no extensible)
- **Naturaleza:** Las cuentas de un mismo tipo comparten naturaleza (débito/crédito)
- **Activas:** Solo se usan en asientos cuentas con estado='activo'

### 6.2 Asientos Contables

- **Partida Doble:** Sum(debe) = Sum(haber)
- **Líneas:** Mínimo 2 líneas (débito y crédito)
- **Cuentas válidas:** Solo cuentas con estado='activo'
- **Rango de valores:** No hay límite máximo (decimales de 2 dígitos)

### 6.3 Asientos Automáticos

- **Por Asset.AssetCreated:**
  - DEBE: Cuenta del tipo de activo
  - HABER: Cuenta de financiamiento (pasivo o patrimonio)
  - Monto = Asset.valor_compra

- **Por Asset.AssetDepreciated:**
  - DEBE: Cuenta de gasto (tipo de bien)
  - HABER: Depreciación acumulada
  - Monto = Depreciación calculada

- **Por Asset.AssetDisposed:**
  - DEBE: Caja (si hay ingresos)
  - DEBE: Depreciación acumulada (eliminarla)
  - HABER: Activo fijo (valor original)
  - HABER/DEBE: Ganancia/Pérdida (balanceo)

---

## 7. Integración con Otros Módulos

### Assets
- **Eventos:** AssetCreated, AssetDepreciated, AssetDisposed, AssetRevalued
- **Automatización:** Listeners crean asientos automáticamente
- **Cuentas:** AssetType vinculada a cuentas contables

### Reports
- **Bases:** Reportes se calculan incluyendo información contable

---

## 8. Gaps y Riesgos

### Gaps Identificados

1. **Listeners Incompletos**
   - PublishToAccountingQueue está en stub
   - No implementadas las transiciones de eventos a asientos

2. **Validación de Cuentas**
   - No hay validación que AssetType.cuenta_contable sea válida
   - No hay validación de tipos de cuenta (activo debe ser 1xxx, etc.)

3. **Cierre de Período**
   - Función closeHistory() existe pero sin implementación clara
   - No hay mecanismo de cierre definitivo

4. **Impuestos**
   - No hay soporte para cálculo de impuestos
   - Sin cuentas de impuesto retenido/pagado

5. **Moneda Extranjera**
   - No hay soporte para activos en monedas diferentes
   - Sin tipo de cambio histórico

### Riesgos

1. **Sincronización Automática**
   - Si Job de depreciación falla: asientos no se generan
   - Sin reintentos o alertas

2. **Balance Contable**
   - Asientos manuales pueden no balancear si validación falla
   - Riesgo de estados contables incorrectos

3. **Auditoría**
   - No hay pista de quién modificó un asiento
   - Cambios en cuentas no tienen historial

4. **Consistencia**
   - Activo eliminado pero asientos quedan huérfanos
   - Sin cascada de eliminación

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Accounting/Models/AccountingAccount.php](../../app/Modules/Accounting/Models/AccountingAccount.php) | Modelo cuenta |
| [app/Modules/Accounting/Models/JournalEntry.php](../../app/Modules/Accounting/Models/JournalEntry.php) | Modelo asiento |
| [app/Modules/Accounting/Http/Controllers/AccountingAccountController.php](../../app/Modules/Accounting/Http/Controllers/AccountingAccountController.php) | Endpoints cuentas |
| [app/Modules/Accounting/Http/Controllers/JournalEntryController.php](../../app/Modules/Accounting/Http/Controllers/JournalEntryController.php) | Endpoints asientos |
| [app/Modules/Accounting/Services/JournalEntryService.php](../../app/Modules/Accounting/Services/JournalEntryService.php) | Lógica de asientos |
| [database/migrations/2026_04_01_000146_create_accounting_tables.php](../../database/migrations/2026_04_01_000146_create_accounting_tables.php) | Schema |

**Documento generado:** 2026-08-07  
**Estado:** Estructura definida, listeners automáticos pendientes de implementación
