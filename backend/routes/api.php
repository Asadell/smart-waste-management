<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\PredictController;
use App\Http\Controllers\Api\V1\ReportController;
use App\Http\Controllers\Api\V1\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->middleware('throttle:auth');
        Route::post('login', [AuthController::class, 'login'])->middleware('throttle:auth');

        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
            Route::get('me', [AuthController::class, 'me']);
            Route::put('profile', [AuthController::class, 'updateProfile']);
            Route::put('password', [AuthController::class, 'updatePassword']);
        });
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('dashboard/stats', [DashboardController::class, 'stats']);
        Route::post('predict', PredictController::class)->middleware('throttle:predict');

        Route::patch('reports/{report}/status', [ReportController::class, 'updateStatus'])->middleware('role:admin');
        Route::apiResource('reports', ReportController::class);

        Route::middleware('role:admin')->group(function () {
            Route::patch('users/{user}/toggle-active', [UserController::class, 'toggleActive']);
            Route::patch('users/{user}/reset-password', [UserController::class, 'resetPassword']);
            Route::apiResource('users', UserController::class);
        });
    });
});
