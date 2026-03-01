#!/bin/sh
set -e

# Create log dir for supervisor
mkdir -p /var/log/supervisor

# Run Laravel setup on first boot
cd /var/www/html

echo "🔧 Running Laravel setup..."

# Cache config, routes and views for production
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Run migrations (won't re-run already-run ones)
php artisan migrate
php artisan db:seed
php artisan storage:link

echo "✅ Setup complete. Starting services..."

exec "$@"
