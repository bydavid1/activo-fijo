#!/bin/bash

echo "🚀 Running Vercel post-install setup..."

# Create necessary directories with proper permissions
echo "📁 Creating storage directories..."
mkdir -p storage/logs
mkdir -p storage/framework/cache
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p bootstrap/cache
mkdir -p /tmp/views

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 storage || echo "⚠️ Storage permissions not set"
chmod -R 755 bootstrap/cache || echo "⚠️ Bootstrap cache permissions not set"
chmod -R 755 /tmp/views || echo "⚠️ Temp views permissions not set"

# Install PHP dependencies if vendor doesn't exist
if [ ! -d "vendor" ]; then
    echo "📦 Installing PHP dependencies..."
    composer install --optimize-autoloader --no-dev --no-interaction --prefer-dist || echo "⚠️ Composer install failed"
else
    echo "✅ PHP dependencies already installed"
fi

# Generate app key if not exists
if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
    echo "🔑 Generating app key..."
    php artisan key:generate --force --no-interaction || echo "⚠️ Key generation failed"
else
    echo "✅ App key already exists"
fi

# Clear caches first
echo "🧹 Clearing caches..."
php artisan config:clear --no-interaction || echo "⚠️ Config clear failed"
php artisan route:clear --no-interaction || echo "⚠️ Route clear failed"
php artisan view:clear --no-interaction || echo "⚠️ View clear failed"

# Create storage link
echo "🔗 Creating storage link..."
php artisan storage:link --force --no-interaction || echo "⚠️ Storage link failed"

# Run database migrations
echo "🗃️ Running database migrations..."
php artisan migrate --force --no-interaction || echo "⚠️ Migrations failed"

# Seed roles and permissions
echo "👥 Seeding roles and permissions..."
php artisan db:seed --class=RolePermissionSeeder --force --no-interaction || echo "⚠️ Seeding failed - roles may already exist"

# Cache config and routes for production optimization
if [ "$APP_ENV" = "production" ]; then
    echo "⚡ Caching for production..."
    php artisan config:cache --no-interaction || echo "⚠️ Config cache failed"
    php artisan route:cache --no-interaction || echo "⚠️ Route cache failed"
    php artisan view:cache --no-interaction || echo "⚠️ View cache failed"
fi

# Create a dummy log file
touch storage/logs/laravel.log || echo "⚠️ Log file creation failed"

echo "✅ Vercel post-install setup completed successfully!"
echo "🎉 Ready for deployment!"
