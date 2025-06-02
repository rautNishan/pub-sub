<?php

namespace App\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;

use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;


    protected $fillable = [
        'user_id',
        'type',
        'payload',
        'status',
        'retry_count',
        'processed_at',
        'failed_at',
        //To do soft delete
    ];

    // Casts for automatic type conversion
    protected $casts = [
        'payload' => 'array',          // JSON stored in 'payload' automatically cast to array
        'processed_at' => 'datetime',
        'failed_at' => 'datetime',
    ];

    // Status constants for easier usage
    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_PROCESSED = 'processed';
    public const STATUS_FAILED = 'failed';

    /**
     * Mark notification as processed
     */
    public function markProcessed()
    {
        $this->status = self::STATUS_PROCESSED;
        $this->processed_at = now();
        $this->save();
    }

    /**
     * Mark notification as failed and increment retry count
     */
    public function markFailed()
    {
        $this->status = self::STATUS_FAILED;
        $this->failed_at = now();
        $this->retry_count += 1;
        $this->save();
    }
}
