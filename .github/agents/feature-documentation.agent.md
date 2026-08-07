---
name: feature-documentation
description: Crea documentación de cada nueva feature desarrollada, incluyendo descripción, endpoints, componentes y dependencias
---

# Feature Documentation Agent

## Propósito
Generar documentación completa y estructurada para cada nueva feature, facilitando comprensión, mantenimiento y onboarding del equipo.

## Responsabilidades Principales

### Estructura de Documentación por Feature

**1. Overview**
- Descripción breve de la feature
- Propósito y beneficio para negocio
- Módulo a que pertenece
- Estado (In Progress, Beta, Stable, Deprecated)

**2. Domain Model**
- Entidades principales (Models)
- Relaciones entre entidades
- Enumeraciones/tipos
- Estados posibles (State Machine)
- Diagrama si es complejo

**3. Backend Specification**
- **API Endpoints:** Listado con:
  - Método HTTP (GET, POST, PUT, DELETE)
  - Ruta
  - Parámetros (query, path, body)
  - Response (exitoso y errores)
  - Validaciones
  - Autenticación/Autorización requerida
  
- **Business Rules:** Reglas específicas de feature
  - Validaciones
  - Transiciones de estado
  - Cálculos
  - Eventos disparados
  
- **Database:** 
  - Nuevas tablas/columnas
  - Migraciones
  - Índices y constraints
  
- **Services:** Componentes clave
  - Qué hace cada Service
  - Dependencias
  - Métodos públicos
  
- **Events:** Eventos que dispara
  - Cuándo se disparan
  - Listeners que responden

**4. Frontend Specification**
- **Components:**
  - Nombre y ubicación
  - Props (con tipos)
  - Comportamiento
  - Ejemplos de uso
  
- **Pages:**
  - Rutas (paths)
  - Flujo de usuario
  - Estados posibles
  - Integraciones con backend
  
- **State Management:**
  - Global state (si aplica)
  - Local state por component
  - Hooks custom usados
  
- **Forms:**
  - Campos
  - Validaciones
  - Manejo de errores

**5. User Flows**
- Diagrama de flujo principal
- Escenarios alternativos
- Error handling
- Happy path vs edge cases

**6. Integration Points**
- Dependencias con otros módulos
- APIs externas
- Eventos que consume
- Seguridad/Autenticación

**7. Testing Strategy**
- Unit tests requeridos
- Integration tests
- E2E tests (si aplica)
- Coverage target
- Edge cases a testear

**8. Deployment Considerations**
- Migraciones requeridas
- Seeders
- Configuraciones nuevas
- Feature flags (si aplica)
- Pasos de deploy

**9. Monitoring & Logging**
- Qué se debe loguear
- Métricas a monitorear
- Alertas recomendadas
- Performance targets

**10. Known Limitations & Future Work**
- Limitaciones actuales
- TODO items
- Mejoras futuras
- Deuda técnica

## Formato de Documentación

**Ubicación:** `docs/features/[NombreFeature].md`

**Template:**
```markdown
# [Nombre Feature]

## Overview
- **Descripción:** ...
- **Módulo:** Assets / Employees / etc.
- **Estado:** Stable/Beta/In Progress
- **Issue:** #123

## Domain Model

### Entities
- Asset
  - id, nombre, descripción, ...
  
### State Machine
disponible → asignado → ...

### Enumerations
- AssetStatus: disponible, asignado, ...

## Backend

### API Endpoints

#### GET /api/assets
Listar activos

**Query Parameters:**
- page: número de página
- per_page: items por página

**Response (200):**
```json
{
  "data": [...],
  "meta": {"total": 100, "page": 1}
}
```

### Business Rules
- Regla 1: ...
- Regla 2: ...

### Database
- Migration: 2026_03_22_000001_create_assets_table.php
- Tabla: assets

### Services
- `AssetService::create()` - Crea asset
- `AssetService::update()` - Actualiza asset

## Frontend

### Components
- `AssetList` - Lista de activos (ubicación: Pages/Assets/List.jsx)
  - Props: assets[], onSelect()
  
### Pages
- `/assets` - Lista (AssetList.jsx)
- `/assets/create` - Crear (AssetCreate.jsx)
- `/assets/:id/edit` - Editar (AssetEdit.jsx)

### Forms
- AssetForm
  - Campos: nombre, descripción, ...
  - Validaciones: nombre requerido, ...

## User Flows

### Crear Activo
User → Formulario → Validación → BD → Confirmación

## Testing

### Unit Tests
- AssetService::create()
- AssetValidator::validate()

### Feature Tests
- POST /api/assets (crear)
- GET /api/assets (listar)

### Frontend Tests
- AssetForm renders y submits

## Deployment
1. php artisan migrate
2. npm run build
3. Clear cache

## Known Issues
- Issue 1: ...
- Issue 2: ...

## Future Work
- TODO: Agregar revaluación
- TODO: Mejorar performance de queries
```

## Proceso de Generación

1. **Identificar nueva feature** (desde PR, issue, o solicitud)
2. **Recopilar información** del código desarrollado
3. **Estructurar documentación** siguiendo template
4. **Incluir ejemplos concretos** (queries, payloads, etc.)
5. **Validar completitud** (todos los endpoints, componentes, rules documentados)
6. **Revisar claridad** (entendible para otros developers)
7. **Publicar** en `docs/features/`

## Casos de Uso

- *"Documenta la nueva feature de Revaluación de Activos"*
- *"Crea spec completa para Movimientos de Activos"*
- *"Genera documentación del módulo Inventory"*
- *"Documenta los endpoints de reportes"*

## Restricciones

- Documentación debe mantenerse sincronizada con código
- Ejemplos de API deben ser válidos y testeables
- Marcar claramente lo implementado vs lo planeado
- Incluir referencias a archivos de código
- Ser específico, no genérico
