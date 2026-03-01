# 🏢 Sistema de Gestión de Activos Fijos

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-11-red" alt="Laravel 11">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React 18">
  <img src="https://img.shields.io/badge/Inertia.js-2-purple" alt="Inertia.js">
  <img src="https://img.shields.io/badge/PrimeReact-10-green" alt="PrimeReact">
  <img src="https://img.shields.io/badge/TailwindCSS-4-cyan" alt="TailwindCSS">
</p>

## 📋 Descripción

Sistema completo de gestión de activos fijos desarrollado con Laravel 11, React 18 e Inertia.js. Incluye gestión de permisos basada en roles, auditorías de inventario, mantenimiento preventivo y reportes avanzados.

## ✨ Características Principales

- 📦 **Gestión Completa de Activos**: Registro, seguimiento y control de activos fijos
- 👥 **Sistema de Permisos**: Control de acceso basado en roles (RBAC)
- 📊 **Dashboard Interactivo**: Métricas y gráficos en tiempo real
- 🔍 **Auditorías de Inventario**: Con scanner QR y códigos de barras
- 🔧 **Mantenimiento Preventivo**: Programación y seguimiento
- 📈 **Reportes Avanzados**: Depreciación, valorización y análisis
- 🏷️ **Códigos QR**: Generación automática para cada activo
- 📱 **Interfaz Moderna**: Diseño responsive con PrimeReact

## 🚀 Deploy en Vercel

Este proyecto está configurado para deployment automático en Vercel:

### Configuración Automática ✅
- ✅ Migraciones de base de datos
- ✅ Creación de roles y permisos
- ✅ Enlace de storage público
- ✅ Cache de configuración optimizado

### Pasos para Deploy:
1. **Fork o clona** este repositorio
2. **Conecta** tu repositorio a [Vercel](https://vercel.com)
3. **Configura las variables** de entorno (ver `.env.vercel.example`)
4. **Deploy automático** - Vercel manejará todo el resto

📖 **Guía completa**: Ver [VERCEL_DEPLOY.md](VERCEL_DEPLOY.md)

## 🛠️ Instalación Local

```bash
# Clonar repositorio
git clone <tu-repositorio>
cd activo-fijo

# Instalar dependencias PHP
composer install

# Instalar dependencias Node
npm install

# Configurar entorno
cp .env.example .env
php artisan key:generate

# Configurar base de datos en .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=activos_fijos
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_password

# Ejecutar migraciones y seeders
php artisan migrate
php artisan db:seed --class=RolePermissionSeeder
php artisan storage:link

# Compilar assets
npm run build

# Iniciar servidor de desarrollo
php artisan serve
```

## 👤 Usuario por Defecto

Después de ejecutar los seeders:
- **Email**: `admin@sistema.com`
- **Rol**: Super Administrador
- **Permisos**: Acceso completo al sistema

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).
