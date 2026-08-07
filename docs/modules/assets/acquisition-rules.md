# Reglas de Adquisición de Activos

## Propósito

Define el comportamiento funcional de los tipos de adquisición de activos fijos.

## Tipos actuales

- Compra
- Donación
- Transferencia
- Comodato
- Leasing
- Dación en Pago
- Proyecto

## Propiedad

La propiedad representa quién posee el bien, mientras que el tipo de adquisición representa cómo llegó el bien al control de la organización.

No deben confundirse ambos conceptos.

## Reglas iniciales

### Compra

Por regla general:

`Compra → Propiedad propia`

La propiedad no debe permitirse como tercero en una compra normal.

### Donación

Por regla general:

`Donación → Propiedad propia`

### Dación en pago

Por regla general:

`Dación en Pago → Propiedad propia`

### Proyecto

Por regla general:

`Proyecto → Propiedad propia`

La implementación concreta puede depender del significado del proyecto en el sistema.

### Comodato

Por regla general:

`Comodato → Propiedad de tercero`

El sistema debe conservar la información del propietario/cedente cuando sea necesaria.

### Transferencia

Una transferencia puede representar diferentes escenarios y no debe forzarse automáticamente a una única propiedad sin conocer el contexto.

Debe considerarse:

- origen;
- destino;
- entidad propietaria;
- si es una transferencia interna o entre entidades.

### Leasing

Leasing requiere distinguir el tipo de contrato cuando las reglas contables lo necesiten.

No asumir que todo leasing debe tratarse idénticamente desde el punto de vista contable.

## Reglas de UI

Cuando una propiedad esté completamente determinada por el tipo de adquisición, el frontend puede ocultarla y el backend debe derivarla/validarla.

Cuando exista una decisión contextual, debe mostrarse y solicitarse al usuario.

## Regla de seguridad

Ocultar o deshabilitar el campo en frontend NO sustituye la validación backend.
