# Deploy to Vercel - Sistema Activos Fijos

Esta guía te ayudará a deployar el Sistema de Activos Fijos en Vercel.

## 📋 Prerrequisitos

- Cuenta en [Vercel](https://vercel.com)
- Base de datos MySQL (recomendado: [PlanetScale](https://planetscale.com) o [Railway](https://railway.app))
- Repositorio de GitHub con el código

## 🚀 Pasos para el Deploy

### 1. Preparar la Base de Datos

Crea una base de datos MySQL y obtén las credenciales:
- `DB_HOST`
- `DB_PORT` (generalmente 3306)
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`

### 2. Configurar Variables de Entorno en Vercel

En tu dashboard de Vercel, ve a tu proyecto > Settings > Environment Variables y agrega:

```bash
# Aplicación
APP_NAME="Sistema Activos Fijos"
APP_ENV=production
APP_KEY=base64:TU_APP_KEY_GENERADA_AQUI
APP_DEBUG=false
APP_URL=https://tu-dominio.vercel.app

# Base de Datos
DB_CONNECTION=mysql
DB_HOST=tu-host-de-db
DB_PORT=3306
DB_DATABASE=tu-base-de-datos
DB_USERNAME=tu-usuario
DB_PASSWORD=tu-contraseña

# Sesiones (importante para Vercel)
SESSION_DRIVER=cookie
SESSION_LIFETIME=120
SESSION_SECURE_COOKIES=true

# Cache y Queue (para Vercel)
CACHE_STORE=array
QUEUE_CONNECTION=sync
```

### 3. Generar APP_KEY

Ejecuta localmente para generar una clave:
```bash
php artisan key:generate --show
```

Copia el resultado a la variable `APP_KEY` en Vercel.

### 4. Deploy Inicial

1. Conecta tu repositorio a Vercel
2. Vercel detectará automáticamente la configuración de `vercel.json`
3. El primer deploy puede tardar varios minutos

### 5. Ejecutar Migraciones y Seeders

✅ **¡AUTOMÁTICO!** El script `vercel-postinstall.sh` ejecuta automáticamente:
- `php artisan migrate --force` - Crea todas las tablas
- `php artisan db:seed --class=RolePermissionSeeder --force` - Crea roles y permisos
- `php artisan storage:link --force` - Enlaza el storage público

Si necesitas ejecutar manualmente después del deploy:

Opción A - Usando Vercel CLI:
```bash
vercel env pull .env.local
php artisan migrate --force
php artisan db:seed --class=RolePermissionSeeder --force
php artisan storage:link
```

Opción B - Crear un endpoint temporal para migraciones (NO NECESARIO):
Agrega esta ruta temporalmente en `routes/web.php` SOLO si el script automático falla:
```php
Route::get('/setup-db', function() {
    if (app()->environment('production')) {
        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('db:seed', ['--class' => 'RolePermissionSeeder', '--force' => true]);
        Artisan::call('storage:link', ['--force' => true]);
        return 'Base de datos configurada correctamente!';
    }
    return 'Solo en producción';
});
```

Visita `https://tu-dominio.vercel.app/setup-db` y luego elimina la ruta.

### 6. Configurar Usuario Administrador

Después de las migraciones, el sistema tendrá un usuario superadmin:
- **Email:** `admin@sistema.com`
- **Contraseña:** Verifica en tu seeder o crea uno manualmente

## ⚙️ Configuración Adicional

### Storage en Vercel

Vercel es serverless, por lo que los archivos subidos no persisten. Para archivos:

1. **Opción A:** Usar un servicio de storage como AWS S3
2. **Opción B:** Usar Vercel Blob Storage

### Variables de Entorno de Producción

```bash
# Logging
LOG_CHANNEL=errorlog
LOG_LEVEL=error

# Mail (configura tu proveedor)
MAIL_MAILER=smtp
MAIL_HOST=tu-smtp-host
MAIL_PORT=587
MAIL_USERNAME=tu-email
MAIL_PASSWORD=tu-contraseña
```

## 🔍 Solución de Problemas

### Error 500 - Internal Server Error
1. Revisa los logs en Vercel Dashboard > Functions > View Function Logs
2. Verifica que `APP_KEY` esté configurada
3. Confirma que las variables de DB sean correctas

### Error de Permisos
```bash
# En el script post-install se configuran automáticamente:
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

### Base de Datos no Conecta
1. Verifica que la DB permita conexiones externas
2. Confirma las credenciales
3. Revisa el puerto (3306 para MySQL)

### Archivos CSS/JS no Cargan
1. Ejecuta `npm run build` localmente para verificar
2. Revisa que el build se complete sin errores en Vercel
3. Confirma que `APP_URL` esté correctamente configurada

## 📁 Archivos de Configuración Incluidos

- `vercel.json` - Configuración principal de Vercel
- `api/index.php` - Punto de entrada para Laravel
- `vercel-postinstall.sh` - Script de configuración post-instalación
- `.vercelignore` - Archivos a ignorar en el deploy

## 🎯 Comandos Útiles

```bash
# Ver logs en tiempo real
vercel logs tu-proyecto

# Deploy desde local
vercel --prod

# Ejecutar comando en producción
vercel env pull .env.local
php artisan tinker
```

## 🔐 Seguridad

- Siempre usa `APP_DEBUG=false` en producción
- Configura `SESSION_SECURE_COOKIES=true`
- Usa conexiones SSL para la base de datos
- Mantén las variables de entorno seguras

---

¡Tu Sistema de Activos Fijos ya está listo para producción en Vercel! 🎉
