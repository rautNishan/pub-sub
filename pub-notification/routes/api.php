<?php

use App\Http\Middleware\CacheAuthUserMiddleware;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\NotificationController;

Route::get('/test', function (Request $request) {
    return "Test API";
});

Route::group([
    'prefix' => 'auth'
], function ($router) {
    Route::post('login', [AuthController::class, 'login']);
    Route::post('register', [AuthController::class, 'register']);
});

Route::middleware([CacheAuthUserMiddleware::class])->group(function () {
    Route::get('auth/me', action: [AuthController::class, 'me'])->name('me');
});


Route::group(['prefix' => 'notification'], function () {
    Route::post('create', [NotificationController::class, 'create'])->middleware(CacheAuthUserMiddleware::class);
    Route::post('update/{id}', [NotificationController::class, 'update'])->middleware(CacheAuthUserMiddleware::class);
});
