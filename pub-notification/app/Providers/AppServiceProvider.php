<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use \App\Contracts\NotificationBrokerInterface;
use \App\Brokers\RabbitMqBroker;
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(NotificationBrokerInterface::class, RabbitMqBroker::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
