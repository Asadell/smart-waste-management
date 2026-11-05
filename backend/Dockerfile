# syntax=docker/dockerfile:1
FROM dunglas/frankenphp:1-php8.4-bookworm AS base

RUN install-php-extensions pdo_pgsql pgsql gd intl zip exif bcmath opcache pcntl \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client unzip \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint

ENV SERVER_NAME=:80
WORKDIR /app
EXPOSE 80
ENTRYPOINT ["entrypoint"]
CMD ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]

# --- dev: source is bind-mounted, dev dependencies installed at start ---
FROM base AS dev
ENV APP_ENV=local

# --- prod: self-contained image ---
FROM base AS prod
ENV APP_ENV=production
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction
COPY . .
RUN composer dump-autoload --optimize --no-dev \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache
