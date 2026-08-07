# Reglas del Dominio Contable

## Propósito

Define las reglas funcionales del módulo de Contabilidad General.

Este documento describe QUÉ debe hacer el sistema. `AGENTS.md` define CÓMO deben trabajar los agentes.

## 1. Partida doble

Todo asiento contable debe cumplir:

`Total Debe = Total Haber`

Un asiento descuadrado no puede contabilizarse.

## 2. Líneas del asiento

Cada línea debe tener:

- cuenta contable;
- importe;
- lado Debe o Haber.

Una línea:

- no puede tener Debe y Haber simultáneamente;
- no puede tener ambos en cero;
- debe pertenecer a una cuenta válida.

Una misma cuenta puede aparecer varias veces en un asiento si existe una razón contable válida.

## 3. Estados

Los asientos deben manejar estados equivalentes a:

- `draft`: borrador;
- `posted`: contabilizado;
- `reversed`: anulado/revertido.

Un asiento contabilizado no debe editarse libremente.

Las correcciones deben conservar historial y trazabilidad.

## 4. Trazabilidad

Un asiento generado automáticamente debe poder relacionarse con su origen.

Ejemplos:

- depreciación de activo;
- compra;
- transferencia;
- ajuste.

La implementación puede utilizar `source_type/source_id` o una relación equivalente.

## 5. Períodos

Los períodos contables tienen estado abierto/cerrado.

Un período cerrado no debe permitir:

- crear nuevos asientos;
- modificar asientos contabilizados;
- eliminar información histórica.

## 6. Catálogo de cuentas

El catálogo debe soportar jerarquía mediante cuentas padre/hijas.

Tipos principales:

- Activo
- Pasivo
- Patrimonio
- Ingreso
- Gasto

Una cuenta agrupadora no debería recibir movimientos si la estructura contable requiere que solo sus cuentas hijas sean imputables.

## 7. Naturaleza contable

Regla general:

| Tipo | Aumenta en |
|---|---|
| Activo | Debe |
| Gasto | Debe |
| Pasivo | Haber |
| Patrimonio | Haber |
| Ingreso | Haber |

Estas reglas deben utilizarse como base para validaciones y reportes, pero no sustituir las reglas contables específicas de cada operación.

## 8. Activo fijo y depreciación

La depreciación normalmente genera:

Debe:
- Gasto por depreciación

Haber:
- Depreciación acumulada

El cálculo debe respetar la configuración del activo, incluyendo cuando corresponda:

- costo;
- valor residual;
- vida útil;
- método;
- fecha de inicio;
- depreciación acumulada.

## 9. Integración con Activo Fijo

Los tipos de activos pueden definir cuentas contables por defecto, por ejemplo:

- cuenta del activo;
- gasto de depreciación;
- depreciación acumulada.

La configuración debe evitar que el usuario tenga que seleccionar manualmente estas cuentas en operaciones automáticas cuando ya estén determinadas por la configuración del tipo de activo.

## 10. Asientos automáticos

La primera implementación puede mantener trazabilidad individual por activo.

El diseño debe permitir posteriormente consolidar operaciones por período cuando sea necesario.

No asumir que una sola estrategia de generación de asientos es universal para todos los procesos.

## 11. Reportes

La contabilidad debe permitir construir progresivamente:

- Libro Diario;
- Libro Mayor;
- Balanza de comprobación;
- Estado de situación financiera;
- Estado de resultados;
- otros reportes futuros.

## 12. Auditoría

Las operaciones contables relevantes deben conservar:

- usuario;
- fecha;
- origen;
- estado;
- historial de modificaciones o anulaciones cuando corresponda.

Nunca eliminar físicamente un asiento histórico contabilizado como mecanismo normal de corrección.

---

## 13. Registro de Cambios, Riesgos y Tareas Pendientes

### Cambios Implementados (Fases 1, 2 y 3)

1. **Refactoring del Backend (`JournalEntryService` & `JournalEntryController`)**:
   - Validación estricta de partida doble (`SUM(Debe) = SUM(Haber)`).
   - Impedimento de líneas con valores en ambos lados (Debe > 0 y Haber > 0).
   - Impedimento de líneas en cero (Debe = 0 y Haber = 0).
   - Exigencia de al menos una línea con Debe > 0 y una con Haber > 0.
   - Validación de cuenta obligatoria, activa e imputable/operativa (`permite_movimientos = true`).
   - Asignación automática de correlativo `numero_asiento` (`ASI-YYYYMM-XXXXX`).

2. **Esquema de Base de Datos**:
   - Migración `2026_04_02_000001_update_accounting_tables_phase1.php`.
   - Adición de `permite_movimientos` en `accounting_accounts`.
   - Actualización de columna `estado` en `journal_entries` a enum: `['borrador', 'contabilizado', 'anulado']`.
   - Campos de trazabilidad `numero_asiento`, `anulado_por_id`, `contabilizado_en`, `contabilizado_por_id`.
   - Campo `concepto` en `journal_entry_lines`.

3. **Ciclo de Vida y Estados de Asientos**:
   - Soporte para creación en estado `borrador` o `contabilizado`.
   - Acción de contabilizar un borrador (`postEntry`).
   - Inmutabilidad post-contabilización: anulación mediante generación automática de asiento espejo de contrapartida (`voidEntry`), vinculando `anulado_por_id`.

4. **Frontend (React / Inertia)**:
   - Formulario de Catálogo de Cuentas: indicador visual y toggle para `permite_movimientos`.
   - Formulario de Creación de Asiento: botones para "Guardar Borrador" y "Guardar y Contabilizar", concepto por línea, validación UI avanzada.
   - Tabla de Asientos: visualización de `numero_asiento`, badges de estado (`borrador`, `contabilizado`, `anulado`), diálogo de anulación con motivo.

5. **Pruebas Automatizadas**:
   - Suite completa de tests unitarios en `tests/Unit/JournalEntryServiceTest.php` cubriendo validaciones de reglas de negocio, errores, flujos de contabilización y anulación.

### Riesgos Identificados y Mitigaciones

- **Riesgo**: Intentar editar directamente asientos contabilizados rompiendo auditoría.
  - *Mitigación*: Implementación de asientos de contrapartida (`tipo_origen = 'anulacion'`) que conservan inmutabilidad histórica.
- **Riesgo**: Imputación en cuentas agrupadoras/padre.
  - *Mitigación*: Validación en `JournalEntryService` y filtro `solo_operativas` en los endpoints API. Cambio automático de cuentas padre a `permite_movimientos = false` al crear subcuentas.
- **Riesgo**: Incompatibilidad SQL entre entornos de producción (MySQL) y pruebas (SQLite).
  - *Mitigación*: Verificación dinámica de driver de base de datos (`DB::getDriverName() === 'mysql'`) en las migraciones para sentencias raw `ALTER TABLE` o `UPDATE INNER JOIN`.

### Tareas Pendientes (Próximas Fases)

- **Fase 4 — Períodos Contables**: Crear modelo `AccountingPeriod` (año, mes, fechas, estado abierto/cerrado) e impedir registros en períodos cerrados.
- **Fase 5 — Integración Avanzada con Activo Fijo**: Asociar FKs directas entre `asset_depreciation` y `journal_entries` en ejecuciones masivas o eventos.
- **Fase 6 — Libro Diario**: Módulo de consulta filtrable por fechas, rango, cuenta y estado.
- **Fase 7 — Libro Mayor**: Reporte acumulado por cuenta contable con saldos iniciales y finales.
- **Fase 8 — Balanza de Comprobación**: Reporte por período agrupado por niveles contables.
- **Fase 9 — Preparación para Estados Financieros**: Configuración de clasificaciones financieras (Activo Corriente, Pasivo No Corriente, etc.).

