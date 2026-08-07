# Módulo Reports - Reportes y Exportación de Datos

## 1. Overview

El módulo **Reports** proporciona reportes analíticos del sistema de activos fijos. Genera reportes en múltiples formatos (JSON, Excel, PDF) con filtros personalizables y exportación de datos.

**Responsabilidades principales:**
- Generar reportes de listados de activos
- Análisis de depreciación acumulada
- Reportes de movimientos y cambios
- Análisis de valor por responsable/ubicación
- Reportes de disposiciones y adquisiciones
- Reportes de ventas y bajas
- Auditoría de discrepancias de inventario
- Órdenes de mantenimiento realizadas
- Resumen ejecutivo
- Exportación en múltiples formatos (Excel, PDF)

**Stack técnico:**
- Backend: Laravel Controller, Services de exportación
- Frontend: React/Inertia.js
- Librerías: Maatwebsite/Excel, Barryvdh/DomPDF

---

## 2. Tipos de Reportes

### Reportes Disponibles

#### 1. **Listado de Activos** (`asset-list`)
Inventario completo de activos vigentes con detalles financieros.

**Columnas:**
- Código, Nombre, Descripción
- Categoría, Ubicación, Responsable
- Estado
- Valor de Compra, Depreciación Acumulada, Valor en Libros
- Fecha de Adquisición, Vida Útil, Método Depreciación

**Filtros:**
- Por categoría
- Por ubicación
- Por responsable
- Por estado
- Rango de fechas

#### 2. **Depreciación** (`depreciation`)
Análisis de depreciación acumulada y valor residual.

**Columnas:**
- Código, Nombre
- Valor de Compra, Valor Residual
- Vida Útil (años)
- Depreciación Acumulada
- Valor en Libros
- % Depreciado
- Método de Depreciación

**Filtros:** Similares a listado

#### 3. **Valor por Responsable** (`value-responsible`)
Agregado de valor de activos asignados a cada empleado/responsable.

**Columnas:**
- Responsable, Departamento
- Cantidad de Activos
- Valor Total (compra)
- Valor en Libros
- Depreciación Acumulada

#### 4. **Valor por Ubicación** (`value-location`)
Agregado de valor de activos por lugar físico.

**Columnas:**
- Ubicación, Edificio, Piso
- Cantidad de Activos
- Valor Total
- Valor en Libros
- Depreciación Acumulada

#### 5. **Disposiciones y Adquisiciones** (`dispositions-acquisitions`)
Histórico de movimientos de entrada y salida.

**Columnas:**
- Fecha
- Código Activo, Nombre
- Tipo de Operación (Compra, Donación, Venta, Baja, etc.)
- Valor Movimiento
- Ganancia/Pérdida (en caso de venta)
- Documento (Factura, Comprobante)

#### 6. **Movimientos** (`movements`)
Historial de traslados y cambios de responsable.

**Columnas:**
- Fecha
- Código Activo, Nombre
- Tipo Movimiento (Traslado, Asignación, Comodato, Devolución)
- Ubicación Anterior, Ubicación Nueva
- Responsable Anterior, Responsable Nuevo
- Motivo
- Usuario que registró

#### 7. **Ventas** (`sales`)
Detalle de activos vendidos.

**Columnas:**
- Fecha de Venta
- Código Activo, Nombre
- Valor de Compra, Valor de Venta
- Valor en Libros (al momento de venta)
- Ganancia/Pérdida
- Tipo de Venta (Directa, Subasta, Licitación)
- Comprador, Documento de Venta
- Condición de Pago

#### 8. **Discrepancias de Inventario** (`discrepancies`)
Resumen de hallazgos en auditorías.

**Columnas:**
- Fecha de Auditoría
- Código Activo, Nombre
- Tipo de Discrepancia (Faltante, Ubicación Incorrecta, Otro)
- Estado (Detectada, Pendiente, Aprobada, Resuelta)
- Observaciones
- Usuario que reportó

#### 9. **Órdenes de Mantenimiento** (`maintenance`)
Órdenes ejecutadas en el período.

**Columnas:**
- Número de Orden, Fecha
- Código Activo, Nombre
- Tipo (Preventivo, Correctivo)
- Estado
- Técnico Asignado
- Costo Estimado, Costo Real
- Descripción
- Fecha Completada

#### 10. **Auditorías de Inventario** (`inventory-audits`)
Resumen de levantamientos realizados.

**Columnas:**
- Código Auditoría, Nombre
- Fecha
- Ubicación/Criterios
- Total Esperado, Total Encontrado
- % Coincidencia
- Discrepancias Identificadas
- Estado

#### 11. **Resumen Ejecutivo** (`summary`)
KPIs principales del sistema.

**Datos:**
- Total de activos (activos, inactivos, dados de baja)
- Valor total del patrimonio
- Depreciación acumulada
- Valor en libros (neto)
- Tasa promedio de depreciación
- Últimas adquisiciones (top 5)
- Últimas bajas/ventas (top 5)
- Activos por categoría (gráfico)
- Activos por ubicación (gráfico)
- Trend de depreciación (últimos 12 meses)

---

## 3. API Endpoints

| Método | Ruta | Función | Parámetros |
|--------|------|---------|-----------|
| GET | `/api/reports/options` | Opciones para filtros | - |
| GET | `/api/reports/asset-list` | Reporte listado | filtros |
| GET | `/api/reports/depreciation` | Reporte depreciación | filtros |
| GET | `/api/reports/value-responsible` | Valor por responsable | filtros |
| GET | `/api/reports/value-location` | Valor por ubicación | filtros |
| GET | `/api/reports/dispositions-acquisitions` | Disposiciones/Adquisiciones | fecha_desde, fecha_hasta |
| GET | `/api/reports/movements` | Movimientos | fecha_desde, fecha_hasta |
| GET | `/api/reports/sales` | Ventas | fecha_desde, fecha_hasta |
| GET | `/api/reports/discrepancies` | Discrepancias inventario | fecha_desde, fecha_hasta |
| GET | `/api/reports/maintenance` | Órdenes mantenimiento | fecha_desde, fecha_hasta |
| GET | `/api/reports/inventory-audits` | Auditorías inventario | fecha_desde, fecha_hasta |
| GET | `/api/reports/summary` | Resumen ejecutivo | - |
| POST | `/api/reports/export` | Exportar reporte | tipo, formato, filtros |

### Filtros Comunes

**GET /api/reports/asset-list**
```
?categoria_id=1          // FK a asset_categories
?ubicacion_id=5          // FK a asset_locations
?responsable_id=12       // FK a users/employees
?estado=disponible       // Estado del activo
?fecha_desde=2026-01-01  // Fecha de adquisición mínima
?fecha_hasta=2026-12-31  // Fecha de adquisición máxima
?per_page=100            // Registros por página
```

Response:
```json
{
  "data": [
    {
      "codigo": "ACT-001",
      "nombre": "Laptop Dell",
      "categoria": "Equipos Informáticos",
      "ubicacion": "Oficina 1",
      "responsable": "John Doe",
      "estado": "disponible",
      "valor_compra": 1200.00,
      "depreciacion_acumulada": 240.00,
      "valor_en_libros": 960.00,
      "fecha_adquisicion": "2025-01-15"
    }
  ],
  "meta": { "total": 142, "per_page": 100, "current_page": 1 }
}
```

### Exportar Reporte - POST /api/reports/export

Payload:
```json
{
  "tipo": "asset-list",           // Tipo de reporte
  "formato": "excel",              // excel, pdf, csv
  "filtros": {
    "categoria_id": 1,
    "ubicacion_id": null,
    "fecha_desde": "2026-01-01",
    "fecha_hasta": "2026-12-31"
  }
}
```

Response:
```
[Descarga de archivo binario]
Headers:
  Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
  Content-Disposition: attachment; filename="Reporte_Activos_2026-08-07.xlsx"
```

---

## 4. Componentes Clave

### Controllers

**ReportController** ([app/Modules/Reports/Http/Controllers/ReportController.php](../../app/Modules/Reports/Http/Controllers/ReportController.php))

Métodos:
- `getOptions()` - Obtiene opciones de filtros (categorías, ubicaciones, responsables)
- `assetList()` - Listado de activos con detalles
- `depreciation()` - Análisis de depreciación
- `valueByResponsible()` - Valor agregado por responsable
- `valueByLocation()` - Valor agregado por ubicación
- `dispositionsAndAcquisitions()` - Movimientos de entrada/salida
- `movements()` - Historial de traslados
- `sales()` - Detalle de ventas
- `discrepancies()` - Discrepancias de inventario
- `maintenance()` - Órdenes de mantenimiento
- `inventoryAudits()` - Auditorías realizadas
- `summary()` - Resumen ejecutivo
- `export()` - Exportar en múltiples formatos

### Services

**GenericReportExport** ([app/Modules/Reports/Exports/GenericReportExport.php](../../app/Modules/Reports/Exports/GenericReportExport.php))

Responsabilidades:
- Generar reportes en formato Excel
- Aplicar filtros y ordenamiento
- Compilar datos desde múltiples fuentes

**Métodos:**
- `fromArray(array $data, array $headers)` - Crear desde array
- `withFilters(array $filtros)` - Aplicar filtros
- `generate()` - Generar archivo

---

## 5. Integración con Otros Módulos

### Assets
- **Base de datos:** Todos los reportes consultan Assets
- **Datos:** Información financiera, depreciación, movimientos

### Accounting
- **Valor en Libros:** Calculado considerando depreciación (integración contable)
- **Ganancias/Pérdidas:** De asientos de disposición

### Inventory
- **Discrepancias:** Reportes de auditorías
- **Ciclos:** Historial de levantamientos

### Maintenance
- **Órdenes:** Reportes de mantenimiento realizado

---

## 6. Business Rules

1. **Filtros opcionales:** Todos son opcionales, si no se especifican: incluye todos
2. **Rango de fechas:** `fecha_hasta` >= `fecha_desde`
3. **Formatos de exportación:**
   - Excel (.xlsx) - Recomendado para tablas grandes
   - PDF (.pdf) - Para reportes formales
   - CSV (.csv) - Para importación a otros sistemas
4. **Paginación:** JSON siempre paginado (para performance)
5. **Exportación:** Sin paginación, descarga completa en archivo

---

## 7. Gaps y Riesgos

### Gaps Identificados

1. **Gráficos Interactivos**
   - Reportes JSON sin visualizaciones interactivas
   - No hay charts/gráficos en web

2. **Reportes Programados**
   - No hay reportes automáticos por email
   - No hay scheduling de reportes

3. **Análisis Predictivos**
   - No hay proyecciones de depreciación
   - No hay análisis de tendencias

4. **Auditoría de Reportes**
   - No se registra quién generó qué reporte
   - No hay trail de modificaciones

5. **Permisos Granulares**
   - Todos ven todos los reportes
   - Sin restricción por departamento/ubicación

### Riesgos

1. **Performance**
   - Reportes grandes (1000+ activos) pueden ser lentos
   - Sin índices optimizados para queries de reporte

2. **Precisión de Datos**
   - Depreciación calculada en query puede ser inexacta
   - Mejor usar valores pre-calculados en BD

3. **Formato PDF**
   - Generación de PDF puede fallar con muchos registros
   - Sin límite de tamaño de descarga

4. **Caché**
   - Reportes no tienen caché
   - Cada generación consulta BD nuevamente

---

## Archivos Clave

| Archivo | Responsabilidad |
|---------|-----------------|
| [app/Modules/Reports/Http/Controllers/ReportController.php](../../app/Modules/Reports/Http/Controllers/ReportController.php) | Endpoints de reportes |
| [app/Modules/Reports/Exports/GenericReportExport.php](../../app/Modules/Reports/Exports/GenericReportExport.php) | Generador de Excel |
| [resources/js/Pages/Reports/Index.jsx](../../resources/js/Pages/Reports/Index.jsx) | UI de reportes |

**Documento generado:** 2026-08-07  
**Estado:** Reportes JSON completos, exportación a Excel/PDF en desarrollo
