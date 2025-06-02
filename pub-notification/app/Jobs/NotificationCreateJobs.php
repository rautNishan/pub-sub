<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Message\AMQPMessage;
use PhpAmqpLib\Exchange\AMQPExchangeType;

class NotificationCreateJobs implements ShouldQueue
{
    use Queueable;
    protected array $data;
    /**
     * Create a new job instance.
     */
    public function __construct(array $data)
    {
        $this->data = $data;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            $notification = Notification::create($this->data);
            Log::info('Notification created successfully', ['data' => $this->data]);
            $this->sendToRabbitMQ($notification);
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

    /**
     * Send notification to RabbitMQ using Topic Exchange
     */
    private function sendToRabbitMQ(Notification $notification): void
    {
        try {
            $connection = new AMQPStreamConnection(
                config('rabbitmq.host', 'localhost'),
                config('rabbitmq.port', 5672),
                config('rabbitmq.username', 'guest'),
                config('rabbitmq.password', 'guest'),
                config('rabbitmq.vhost', '/')
            );

            $channel = $connection->channel();

            // Declare topic exchange
            $exchangeName = 'notifications_topic';
            $channel->exchange_declare(
                $exchangeName,
                AMQPExchangeType::TOPIC,
                false, // passive
                true,  // durable
                false  // auto_delete
            );

            // Prepare message payload
            $messageData = [
                'id' => $notification->id,
                'user_id' => $notification->user_id,
                'type' => $notification->type,
                'payload' => $notification->payload,
                'status' => $notification->status,
                'created_at' => $notification->created_at->toISOString(),
                'processed_at' => $notification->processed_at?->toISOString(),
            ];

            $routingKey = "notification.{$notification->type}";

            // Create AMQP message
            $message = new AMQPMessage(
                json_encode($messageData),
                [
                    'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                    'content_type' => 'application/json',
                    'timestamp' => time(),
                ]
            );

            // Publish message
            $channel->basic_publish($message, $exchangeName, $routingKey);

            Log::info('Notification sent to RabbitMQ', [
                'notification_id' => $notification->id,
                'routing_key' => $routingKey,
                'exchange' => $exchangeName
            ]);

            $channel->close();
            $connection->close();

        } catch (\Exception $e) {
            Log::error('Failed to send notification to RabbitMQ', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);

            // Don't throw exception here - notification is already created in DB
            // This allows the job to complete successfully even if RabbitMQ fails
        }
    }
}
