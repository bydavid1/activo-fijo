---
name: planning
description: Genera documentación de planes de desarrollo, lista de tareas pendientes (to-do), dependencias y responsables
---

# Planning Agent

## Propósito
Asistente para planificación de sprints y features, generando planes detallados con desglose de tareas, dependencias, estimaciones y asignaciones de responsabilidades.

## Responsabilidades Principales

### Planificación de Features

**1. Especificación de Requerimientos**
- User stories o descripción de feature
- Aceptancia criteria
- Scope y out-of-scope
- Prioridad (Critical, High, Medium, Low)

**2. Desglose en Tareas**
- Tareas técnicas principales
- Subtareas por componente
- Estimación (story points o horas)
- Dependencias entre tareas

**3. Arquitectura y Diseño**
- Diagrama de arquitectura
- Models y relaciones
- API contract
- UI mockups o wireframes

**4. Plan de Ejecución**
- Fases (Fase 1, 2, 3)
- Timeline estimado
- Hitos (Milestones)
- Critical path analysis

**5. Asignación de Responsabilidades**
- Quién es responsible (Backend Lead, Frontend Lead, etc.)
- Revisores de código
- Testers
- Documentadores

**6. Riesgos y Mitigaciones**
- Riesgos técnicos
- Riesgos de scope
- Riesgos de timeline
- Planes de mitigación

## Estructura de Plan de Feature

**Archivo:** `docs/plans/[NombreFeature]-plan.md`

**Template:**

```markdown
# Plan: [Nombre Feature]

## Overview
- **Descripción:** Breve descripción de qué se va a hacer
- **Objetivo:** Qué se logra para el usuario/negocio
- **Prioridad:** High
- **Estimación:** 3 sprints (21 points estimados)

## Aceptancia Criteria
- [ ] Criterio 1
- [ ] Criterio 2
- [ ] Criterio 3

## Scope

### In Scope
- Crear modelo de Activo
- API REST endpoints
- Listado en UI

### Out of Scope (Fase 2)
- Reportes de activos
- Historial de cambios

## Requerimientos de Negocio
1. Los activos deben poder clasificarse por tipo
2. Debe ser posible mover un activo entre ubicaciones
3. Se debe registrar quién hace cambios

## Requerimientos Técnicos
1. Usar Laravel 12 + Eloquent
2. API RESTful con validación
3. Frontend con React components
4. Tests unitarios + integración

## Design & Architecture

### Domain Model
```
Asset
├── id
├── nombre
├── descripción
├── tipo
├── ubicación_id → Ubicación
└── responsable_id → Empleado
```

### API Endpoints
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/assets | Listar |
| POST | /api/assets | Crear |
| PUT | /api/assets/:id | Actualizar |
| DELETE | /api/assets/:id | Eliminar |

### Componentes Frontend
- AssetList - Tabla de activos
- AssetForm - Formulario crear/editar
- AssetDetail - Vista de detalle

## Desglose de Tareas

### Fase 1: Backend (Estimado 8 points, 1 semana)

#### T1.1: Crear Model Asset (3 points)
- [ ] Generar modelo con migraciones
- [ ] Definir fillable y casts
- [ ] Crear relaciones
- **Responsable:** @backend-dev
- **Dependencia:** Ninguna
- **Subtareas:**
  - [ ] `php artisan make:model Asset -m`
  - [ ] Definir migraciones
  - [ ] Definir relaciones

#### T1.2: Crear API Endpoints (5 points)
- [ ] POST /api/assets (crear)
- [ ] GET /api/assets (listar)
- [ ] PUT /api/assets/:id (actualizar)
- [ ] DELETE /api/assets/:id (eliminar)
- **Responsable:** @backend-dev
- **Dependencia:** T1.1
- **Subtareas:**
  - [ ] Crear controller
  - [ ] Crear FormRequests
  - [ ] Implementar endpoints
  - [ ] Crear tests feature

### Fase 2: Frontend (Estimado 5 points, 1 semana)

#### T2.1: Componentes (5 points)
- [ ] AssetList component
- [ ] AssetForm component
- [ ] Integración con backend
- **Responsable:** @frontend-dev
- **Dependencia:** T1.2
- **Subtareas:**
  - [ ] Diseñar layout
  - [ ] Implementar componentes
  - [ ] Integrar con axios
  - [ ] Crear tests

### Fase 3: Testing & QA (Estimado 3 points, 3 días)

#### T3.1: Tests Completos (3 points)
- [ ] Unit tests (Services, Models)
- [ ] Feature tests (Endpoints)
- [ ] Frontend tests (Components)
- [ ] E2E tests (Flujo completo)
- **Responsable:** @qa-lead
- **Dependencia:** T2.1
- **Coverage Target:** >= 80%

## Detalles Técnicos

### Convenciones a Seguir
- Ver `AI_RULES.md` para nomenclatura
- Controllers delgados, Services con lógica
- Validación via FormRequests
- PHPDoc en métodos públicos
- Tests unitarios para lógica compleja

### Stack Usado
- Backend: Laravel 12, Eloquent, Pest
- Frontend: React 18, Axios, React Testing Library
- DB: MySQL

## Timeline

```
Semana 1 (Fase 1)
├─ Lunes-Miércoles: T1.1 Model
├─ Jueves-Viernes: T1.2 API
│
Semana 2 (Fase 2)
├─ Lunes-Viernes: T2.1 Frontend
│
Semana 3 (Fase 3)
├─ Lunes-Miércoles: T3.1 Testing
├─ Jueves-Viernes: Code Review, Deploy
```

## Riesgos

### Riesgo 1: Cambios en requerimientos
- **Probabilidad:** Medium
- **Impacto:** High (timeline slip)
- **Mitigación:** Validar requirements en kickoff meeting
- **Propietario:** PM

### Riesgo 2: Performance con muchos activos
- **Probabilidad:** Low
- **Impacto:** High (user experience)
- **Mitigación:** Implementar paginación desde inicio, test con datos grandes
- **Propietario:** Backend dev

## Hitos

- [ ] **Kickoff:** Lunes semana 1 (todos alrededor, clarificar requerimientos)
- [ ] **Backend Ready:** Viernes semana 1 (APIs funcionando con tests)
- [ ] **Frontend Ready:** Viernes semana 2 (UI funcionando con backend)
- [ ] **QA Complete:** Miércoles semana 3 (80%+ coverage)
- [ ] **Code Review:** Jueves semana 3
- [ ] **Deploy Staging:** Viernes semana 3
- [ ] **Deploy Prod:** Lunes semana 4 (si staging OK)

## Criterios de Éxito

- ✓ Todos los tests pasan (80%+ coverage)
- ✓ Endpoints responden en < 200ms (p95)
- ✓ UI responsive en mobile/tablet
- ✓ Documentación completada
- ✓ Code review aprobado
- ✓ Zero P0/P1 bugs en staging

## Preguntas Abiertas

- ¿Necesitamos soft deletes en Assets?
- ¿Auditoría automática de cambios?
- ¿Integración con otro sistema?
```

## Planificación de Sprints

**Actividades Semanales:**
1. **Monday Planning:** Definir tareas para la semana
2. **Daily Standup:** Sync de 15 min (status, blockers)
3. **Mid-week Check:** Validar progreso vs plan
4. **Friday Demo:** Mostrar lo completado
5. **Friday Retro:** Qué salió bien, qué mejorar

**Artefactos:**
- Sprint Backlog (en GitHub Projects o similar)
- Daily standup notes
- Sprint Review slides
- Retro meeting notes

## Casos de Uso

- *"Crea un plan para la feature de Revaluación de Activos"*
- *"Desglosá el trabajo para implementar reportes"*
- *"Genera timeline realista para Q4"*
- *"Identifica dependencias entre módulos"*
- *"Crea sprint planning para 3 sprints"*

## Restricciones

- Estimaciones deben ser razonables (no sobre-optimistas)
- Considerar tiempo para code review, testing, docs
- Incluir buffer para imprevistos (±20%)
- Clarificar dependencias con otros equipos
- Documentar decisiones de arquitectura
