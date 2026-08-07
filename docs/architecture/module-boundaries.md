# Límites Arquitectónicos de Módulos

## Propósito

Define las responsabilidades de los principales módulos del sistema para evitar acoplamiento y duplicación.

## Assets

Responsable de:

- maestro de activos;
- tipos de activos;
- categorías;
- adquisiciones;
- movimientos;
- ubicaciones;
- depreciación relacionada con activos;
- información administrativa y física del activo.

No debe convertirse en el módulo responsable de toda la contabilidad general.

## Employees

Responsable de:

- empleados;
- sincronización de empleados;
- información necesaria para asignación/responsabilidad de activos.

## Inventory

Responsable de:

- inventario;
- conteos;
- ciclos;
- auditorías de inventario;
- diferencias de inventario.

No asumir que inventario y activo fijo son el mismo dominio.

## Maintenance

Responsable de:

- mantenimiento;
- órdenes;
- historial de mantenimiento;
- costos relacionados con mantenimiento cuando correspondan.

## Suppliers

Responsable de:

- proveedores;
- información del proveedor;
- relaciones con adquisiciones cuando corresponda.

## Reports

Responsable de:

- generación;
- presentación;
- exportación de reportes.

No debe convertirse en un lugar para almacenar lógica de negocio que pertenece a otros módulos.

## Accounting

Cuando se implemente como módulo propio, será responsable de:

- catálogo de cuentas;
- asientos;
- líneas de asientos;
- períodos;
- libro diario;
- libro mayor;
- balanza;
- reglas contables generales;
- integración contable con otros dominios.

## Regla de integración

Los módulos deben comunicarse mediante:

- Services;
- Actions;
- Contracts;
- Events;
- relaciones explícitas;

según el caso.

Evitar acceder directamente a estructuras internas de otro módulo sin una razón clara.

## Regla de dependencia

Las dependencias deben orientarse hacia responsabilidades de dominio claras.

No permitir que un módulo termine dependiendo circularmente de otro.

## Ejemplo

Activo Fijo puede solicitar a Contabilidad la generación de un asiento de depreciación.

Contabilidad no debería conocer detalles irrelevantes de la UI de Activo Fijo.

La integración debe trabajar con datos de dominio y contratos claros.
