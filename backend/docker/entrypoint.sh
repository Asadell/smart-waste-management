#!/bin/sh
set -e
cd /app

if [ ! -d vendor ]; then
  composer install --no-interaction --prefer-dist
fi

# Wait for Postgres.
until pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-swm}" >/dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 1
done

php artisan storage:link --relative --force >/dev/null 2>&1 || true
php artisan migrate --force

if [ "$APP_ENV" = "production" ]; then
  php artisan config:cache
  php artisan route:cache
  php artisan view:cache
fi

exec "$@"
