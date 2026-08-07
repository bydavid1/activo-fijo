# AGENTS.md

## Propósito

Este documento define las reglas obligatorias para agentes de IA y desarrolladores que trabajen en el Sistema de Gestión de Activos Fijos y su evolución hacia un ERP modular.

Prioridad de decisiones:

1. Correctitud del negocio.
2. Integridad de datos.
3. Seguridad.
4. Consistencia arquitectónica.
5. Mantenibilidad.
6. Testabilidad.
7. Performance.
8. Simplicidad.
9. Conveniencia de implementación.

## Stack

- Backend: Laravel 12, PHP 8.2+
- Frontend: React 18+, Inertia.js, Tailwind CSS
- UI: PrimeReact / Tailwind UI
- DB: MySQL/MariaDB
- Arquitectura: Modular Monolith

## Reglas obligatorias

### Antes de programar

El agente DEBE:

1. Entender el requerimiento.
2. Inspeccionar el código relacionado.
3. Buscar implementaciones existentes antes de crear nuevas.
4. Identificar entidades, relaciones y reglas de negocio existentes.
5. Evaluar impacto en otros módulos.
6. Revisar documentación relevante en `docs/`.
7. Si existe una decisión arquitectónica importante, explicarla antes de implementarla.

### No inventar reglas

Si una regla de negocio no está definida:

- No inventarla.
- No asumirla como verdadera.
- Revisar código y documentación.
- Señalar ambigüedades.
- Proponer alternativas cuando sea necesario.

Esto es especialmente importante para contabilidad, depreciación, inventario, adquisiciones y movimientos de activos.

### Cambios mínimos

- No reescribir módulos completos sin necesidad.
- No modificar arquitectura global para resolver problemas locales.
- No duplicar funcionalidades existentes.
- No instalar dependencias sin justificación.
- No introducir abstracciones innecesarias.

## Arquitectura

### Módulos

Los módulos viven bajo `app/Modules/`.

Módulos actuales:

- Assets
- Employees
- Inventory
- Maintenance
- Reports
- Suppliers

Una nueva funcionalidad DEBE pertenecer a un módulo existente cuando exista una relación clara.

Crear un módulo nuevo solamente cuando tenga un dominio y responsabilidad claramente delimitados.

### Controllers

Deben ser delgados:

- reciben Request;
- autorizan;
- invocan lógica;
- retornan Inertia/JSON.

No deben contener lógica de negocio compleja ni consultas excesivamente complejas.

### FormRequests

Deben manejar validación estructural del request y autorización cuando corresponda.

No colocar lógica de negocio compleja.

### Services

Usarlos para lógica de negocio que coordina múltiples entidades, operaciones o transacciones.

### Actions

Pueden representar una acción de negocio claramente identificable, por ejemplo:

- CreateAsset
- TransferAsset
- DepreciateAsset
- PostJournalEntry
- ReverseJournalEntry

No crear Actions innecesarias.

### Models

Deben concentrarse en:

- relaciones;
- casts;
- scopes simples;
- atributos;
- comportamiento propio de la entidad.

Evitar Models gigantes.

## Reglas de negocio

Las reglas críticas DEBEN estar centralizadas.

El frontend puede reflejar reglas para UX, pero el backend siempre es la autoridad final.

Una regla importante nunca debe depender únicamente de:

- `disabled`;
- `readonly`;
- campos ocultos;
- validación JavaScript.

## Base de datos

Tablas:

- `snake_case`
- plural

Columnas:

- `snake_case`

Usar foreign keys, índices y constraints cuando corresponda.

Toda modificación estructural debe realizarse mediante migraciones.

Antes de eliminar columnas/tablas, buscar referencias, relaciones y datos existentes.

## Transacciones

Toda operación que modifique múltiples registros relacionados DEBE utilizar una transacción.

Ejemplos:

- Transferencia de activo.
- Registro de depreciación.
- Generación de asiento y líneas.
- Anulación/reversión contable.
- Cierre de período.

## Contabilidad

Toda partida debe cumplir:

`SUM(DEBE) = SUM(HABER)`

Una línea no puede tener simultáneamente Debe y Haber.

Una línea no puede quedar con ambos en cero.

Las cuentas repetidas pueden ser válidas y no deben bloquearse automáticamente.

Los asientos contabilizados deben ser inmutables. Los errores deben corregirse mediante reversión/anulación conservando trazabilidad.

Los asientos automáticos deben conservar referencia a su origen cuando sea posible.

## Activo Fijo

Mantener separadas:

- información física;
- información administrativa;
- información contable;
- adquisiciones;
- movimientos;
- depreciación.

Los cálculos importantes deben estar en backend y tener pruebas.

## Frontend

- Pages manejan pantallas completas y navegación.
- Components deben ser reutilizables.
- Hooks contienen lógica reutilizable.
- Tailwind es el estándar de estilos.
- No introducir nuevas librerías UI sin justificación.

## Seguridad

Las operaciones sensibles DEBEN verificar autorización en backend usando Policies, Gates, middleware o permisos existentes.

## Tests

Usar Pest PHP.

La lógica crítica debe cubrir al menos:

1. Happy path.
2. Validación.
3. Regla de negocio.
4. Caso de error.
5. Casos límite relevantes.

## Dependencias

Antes de instalar un paquete:

1. Comprobar si ya existe una solución.
2. Evaluar si Laravel/React puede resolverlo.
3. Justificar la dependencia.

No modificar `composer.json` o `package.json` innecesariamente.

## Reutilización

Antes de crear Services, Hooks, Components, Helpers, Traits, Queries o utilidades, buscar primero si ya existe una implementación equivalente.

## Performance

Evitar:

- N+1;
- queries dentro de loops;
- relaciones innecesarias;
- traer grandes volúmenes sin necesidad.

Evaluar `with()`, `select()`, `paginate()`, `chunk()`, `upsert()` y operaciones masivas cuando corresponda.

## Flujo posterior a la implementación

El agente DEBE revisar:

- sintaxis;
- imports;
- tipos;
- migraciones;
- relaciones;
- validaciones;
- permisos;
- tests;
- regresiones potenciales.

Ejecutar las pruebas relevantes cuando sea posible.

## Prohibiciones

Los agentes NO DEBEN:

- duplicar código;
- crear módulos innecesarios;
- inventar reglas contables;
- confiar únicamente en frontend;
- eliminar información histórica importante;
- modificar producción directamente;
- ocultar errores silenciosamente;
- introducir breaking changes sin evaluar impacto;
- sobreingenierizar funcionalidades futuras.

## Documentación

Las reglas generales de desarrollo pertenecen a este archivo.

Las reglas específicas del dominio deben documentarse en `docs/`.

Cuando una decisión arquitectónica o de negocio importante cambie, actualizar la documentación correspondiente.
