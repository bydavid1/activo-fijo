# Reglas de Depreciación

## Propósito

Define las reglas funcionales para depreciar activos fijos y preparar su integración contable.

## Datos necesarios

Dependiendo del método y las políticas contables, el cálculo puede requerir:

- costo de adquisición;
- valor residual;
- vida útil;
- fecha de adquisición;
- fecha de inicio de depreciación;
- método de depreciación;
- depreciación acumulada;
- valor en libros.

## Valor residual

El valor residual es el valor estimado que se espera conservar del activo al final de su vida útil.

En términos simplificados:

`Base depreciable = Costo - Valor residual`

El sistema no debe depreciar por debajo del valor residual cuando las reglas aplicables indiquen ese límite.

## Depreciación acumulada

Representa la suma de depreciaciones reconocidas hasta una fecha determinada.

No representa un pago en efectivo.

## Valor en libros

Conceptualmente:

`Valor en libros = Costo - Depreciación acumulada`

La implementación debe considerar correctamente otros ajustes contables que puedan existir.

## Generación contable

Una depreciación reconocida contablemente normalmente genera:

Debe:
`Gasto por depreciación`

Haber:
`Depreciación acumulada`

El asiento debe quedar relacionado con el activo y el período cuando sea posible.

## Reglas de integridad

No debe:

- depreciarse un activo dado de baja sin una regla explícita;
- superar la base depreciable;
- generar depreciación para períodos cerrados;
- duplicar depreciación para el mismo activo y período sin una operación explícita de corrección.

## Pruebas

Los cálculos deben probar:

- cálculo normal;
- valor residual;
- final de vida útil;
- fechas;
- activos sin depreciación;
- casos límite;
- prevención de duplicados.
