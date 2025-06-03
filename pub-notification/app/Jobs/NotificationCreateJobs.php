<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use \App\Contracts\NotificationBrokerInterface;

class NotificationCreateJobs implements ShouldQueue
{
    use Queueable;

    protected array $data;
    protected NotificationBrokerInterface $broker;

    public function __construct(array $data)
    {
        $this->data = $data;
    }

    public function handle(NotificationBrokerInterface $broker): void
    {
        $this->broker = $broker;

        try {
            $notification = Notification::create($this->data);
            Log::info('Notification created successfully', ['data' => $this->data]);

            $this->broker->publish($notification);

            $notification->update([
                'status' => 'processing',
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to create notification', [
                'data' => $this->data,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }
}