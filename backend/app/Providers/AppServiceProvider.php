<?php

namespace App\Providers;

use App\Services\MlClient;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\ImageManager;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(ImageManager::class, fn () => new ImageManager(new Driver));

        $this->app->singleton(MlClient::class, fn () => new MlClient(
            baseUrl: config('services.ml.url'),
            apiKey: config('services.ml.key'),
            timeout: (int) config('services.ml.timeout'),
        ));
    }

    public function boot(): void
    {

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('predict', fn (Request $request) => Limit::perMinute(30)->by($request->user()?->id ?: $request->ip()));
        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(120)->by($request->user()?->id ?: $request->ip()));
    }
}
