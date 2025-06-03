<?php

namespace App\Brokers;

use App\Contracts\NotificationBrokerInterface;
use App\Models\Notification;
use Illuminate\Support\Facades\Log;
use PhpAmqpLib\Connection\AMQPStreamConnection;
use PhpAmqpLib\Exchange\AMQPExchangeType;
use PhpAmqpLib\Message\AMQPMessage;

class RabbitMqBroker implements NotificationBrokerInterface
{
    protected string $exchangeName = 'notifications_topic';

    public function publish(Notification $notification): void
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
            $channel->exchange_declare($this->exchangeName, AMQPExchangeType::TOPIC, false, true, false);

            $messageData = [
                'id' => $notification->id,
                'user_id' => $notification->user_id,
                'type' => $notification->type,
                'payload' => $notification->payload,
                'status' => $notification->status,
                'created_at' => $notification->created_at->toISOString(),
                'processed_at' => $notification->processed_at?->toISOString(),
            ];

            $message = new AMQPMessage(
                json_encode($messageData),
                [
                    'delivery_mode' => AMQPMessage::DELIVERY_MODE_PERSISTENT,
                    'content_type' => 'application/json',
                    'timestamp' => time(),
                ]
            );

            $routingKey = "notification.{$notification->type}";
            $channel->basic_publish($message, $this->exchangeName, $routingKey);

            Log::info('Notification sent to RabbitMQ', [
                'notification_id' => $notification->id,
                'routing_key' => $routingKey
            ]);

            $channel->close();
            $connection->close();

        } catch (\Exception $e) {
            Log::error('Failed to send notification to RabbitMQ', [
                'notification_id' => $notification->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    public function consume(callable $callback): void
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
            $queueName = 'notification_status_updates';

            $channel->queue_declare($queueName, false, true, false, false);

            $channel->basic_consume($queueName, '', false, false, false, false, $callback);

            while ($channel->is_consuming()) {
                $channel->wait();
            }

            $channel->close();
            $connection->close();
        } catch (\Exception $e) {
            Log::error('RabbitMQ consume error', ['error' => $e->getMessage()]);
        }
    }
}
