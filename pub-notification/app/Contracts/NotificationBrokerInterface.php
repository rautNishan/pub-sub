<?php

namespace App\Contracts;

use App\Models\Notification;

interface NotificationBrokerInterface
{
    public function publish(Notification $notification): void;

    public function consume(callable $callback): void;
}
