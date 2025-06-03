<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Contracts\NotificationBrokerInterface;
use Illuminate\Support\Facades\Log;
use App\Models\Notification;

class ConsumeNotification extends Command
{
    protected $signature = 'broker:consume-status';
    protected $description = 'Consume notification status updates from the configured broker';

    protected NotificationBrokerInterface $broker;

    public function __construct(NotificationBrokerInterface $broker)
    {
        parent::__construct();
        $this->broker = $broker;
    }

    public function handle()
    {
        $this->info('Waiting for status updates. To exit press CTRL+C');

        $this->broker->consume(function ($msg) {
            try {
                $data = json_decode($msg->body, true);

                if (!isset($data['notification_id']) || !isset($data['status'])) {
                    Log::warning('Invalid status update message', ['data' => $data]);
                    $msg->ack();
                    return;
                }

                $notification = Notification::find($data['notification_id']);

                if ($notification) {
                    $updateData = [
                        'status' => $data['status'],
                        'retry_count' => $data['retry_count'] ?? 0,
                    ];

                    if ($data['status'] === 'processed') {
                        $updateData['processed_at'] = now();
                    } elseif ($data['status'] === 'failed') {
                        $updateData['failed_at'] = now();
                    }

                    $notification->update($updateData);

                    Log::info('Notification status updated', [
                        'notification_id' => $data['notification_id'],
                        'old_status' => $notification->getOriginal('status'),
                        'new_status' => $data['status'],
                        'retry_count' => $data['retry_count'] ?? 0
                    ]);
                } else {
                    Log::warning('Notification not found for status update', [
                        'notification_id' => $data['notification_id']
                    ]);
                }

                $msg->ack();
            } catch (\Exception $e) {
                Log::error('Failed to process status update', [
                    'error' => $e->getMessage(),
                    'message' => $msg->body
                ]);
                $msg->nack(false, false);
            }
        });
    }
}
