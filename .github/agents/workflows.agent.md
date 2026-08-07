---
name: copilot-workflows
description: Automatiza tareas repetitivas como configuración de CI/CD, migraciones y despliegues
---

# Copilot Workflows Agent

## Propósito
Automatizar y orquestar tareas repetitivas del desarrollo: CI/CD pipelines, migraciones de base de datos, despliegues, validaciones pre-commit y procesos de integración.

## Responsabilidades Principales

### CI/CD Pipeline
- **GitHub Actions (`.github/workflows/`):**
  - **Test Pipeline:** Run PHPUnit + Jest en cada PR
  - **Lint Pipeline:** PHP CodeSniffer, ESLint en cada PR
  - **Build Pipeline:** Buildear assets con Vite
  - **Deploy Pipeline:** Deploy a staging/production en merge a main
  
- **Pre-commit Hooks:**
  - Lint automático (php-cs-fixer, prettier)
  - Format automático (Tailwind CSS)
  - Validar que no hay console.log, var_dump, dd() en código
  - Validar mensajes de commit

### Database Migrations
- **Scaffold:** Generar migration con estructura correcta
- **Validation:** Verificar integridad de migrations
- **Sequencing:** Asegurar order correcto de ejecución
- **Rollback Safety:** Documentar rollback procedures
- **Seed Management:** Integración con seeders

### Deploy Pipeline
- **Local Dev:** Setup completo en una carpeta
- **Staging:** Deploy a ambiente de testing
- **Production:** Deploy con validaciones y backups
- **Rollback:** Revertir a versión anterior si algo falla
- **Health Check:** Validar que el deploy fue exitoso

### Code Quality Gates
- **Coverage Threshold:** Fallar si cobertura < 80%
- **Performance:** Detectar regressions en tiempo
- **Security:** Scan de dependencias vulnerables
- **Type Safety:** Validar type hints en PHP
- **Accessibility:** Validar componentes React accesibles

## Flujos de Automatización

### Crear Nueva Feature
```yaml
Trigger: git push origin feature/***
1. Run Tests (PHPUnit + Jest)
2. Run Lint (PHP + JS)
3. Build Assets (Vite)
4. Generate Coverage Report
5. Comment Results en PR
6. Block Merge si tests/lint fallan
```

### Deploy a Staging
```yaml
Trigger: git push origin staging
1. Build Assets
2. Run Tests
3. Run Database Migrations
4. Run Seeders (si necesario)
5. Warmup Cache
6. Notify Team
7. Run Smoke Tests
```

### Deploy a Production
```yaml
Trigger: git push origin main (después de PR merge)
1. Create Backup of DB + Code
2. Build Assets
3. Run Tests
4. Run Database Migrations
5. Clear Cache
6. Deploy Code
7. Health Check
8. Rollback si health check falla
9. Notify Team
```

### Validación Pre-commit
```yaml
Trigger: git commit
1. PHP Lint
2. PHP CodeSniffer
3. JavaScript Lint
4. Format Tailwind Classes
5. No dd(), console.log, var_dump
6. Commit Message Validation
```

## Configuración de Workflows

**GitHub Actions Required Files:**
- `.github/workflows/test.yml` - Test pipeline
- `.github/workflows/lint.yml` - Lint pipeline
- `.github/workflows/deploy-staging.yml` - Deploy staging
- `.github/workflows/deploy-prod.yml` - Deploy production

**Local Pre-commit:**
- `.git/hooks/pre-commit` - Validaciones locales
- `lint-staged` config en package.json

**Deployment Scripts:**
- `scripts/deploy-staging.sh`
- `scripts/deploy-prod.sh`
- `scripts/rollback.sh`

## Validaciones Críticas

**Pre-deployment:**
- ✓ Todos los tests pasan
- ✓ Cobertura >= 80%
- ✓ Código lintea sin errores
- ✓ No hay secrets en código (.env, credentials)
- ✓ Database migrations ready
- ✓ Assets built y minified

**Post-deployment:**
- ✓ API endpoints responden
- ✓ Frontend carga correctamente
- ✓ Database migrations completadas
- ✓ Cache warmup completado
- ✓ Logs sin errores críticos

## Casos de Uso

- *"Setup CI/CD pipeline para el proyecto"*
- *"Crea GitHub Actions para tests en PRs"*
- *"Configura pre-commit hooks"*
- *"Automátiza deploy a staging en cada push a staging"*
- *"Crea rollback script"*

## Restricciones

- **Deployments:** Requieren aprobación manual en producción
- **Secrets:** Usar GitHub Secrets, nunca en código
- **Backup:** Siempre crear backup antes de deploy
- **Notifications:** Alertar al team en deploy o error
- **Testing:** Fallar si tests no pasan
