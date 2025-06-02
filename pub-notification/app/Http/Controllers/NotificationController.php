<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\Notification;
use App\Jobs\NotificationCreateJobs;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
class NotificationController extends Controller
{
    // Create a new notification
    public function create(Request $request)
    {
        $validated = $request->validate([
            'type' => ['required', 'string'],
            'payload' => ['required'],
        ]);

        $userId = auth()->user()->id;
        $cacheKey = 'num_notification_' . $userId;

        // Use Redis atomic operations for consistency
        if (Cache::has($cacheKey)) {
            $notificationNum = Cache::increment($cacheKey);

            if ($notificationNum > 10) {
                // Undo the increment
                Cache::decrement($cacheKey);

                return response()->json([
                    'message' => 'You have reached your daily notification limit.',
                    'status' => 'failed'
                ], Response::HTTP_BAD_REQUEST);
            }
        } else {

            // Set count to 1 and TTL to 24 hours
            Cache::put($cacheKey, 1, now()->addDay());
        }

        NotificationCreateJobs::dispatch([
            'type' => $validated['type'],
            'payload' => $validated['payload'],
            'user_id' => (int) $userId
        ]);

        return response()->json([
            'message' => 'Notification update queued successfully',
            'status' => 'pending'
        ], Response::HTTP_ACCEPTED); // 202
    }

    // Update an existing notification by ID
    public function update(Request $request, $id)
    {
        (int) $userId = auth()->id();
        $notification = Notification::where('id', $id)
            ->where('user_id', $userId)
            ->first();
        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        // Validate data
        $validated = $request->validate([
            'status' => ['required', 'string'],
        ]);

        // Update fields
        $notification->update($validated);

        return response()->json($notification);
    }

    // Find a notification by ID
    public function find($id)
    {
        $notification = Notification::find($id);

        if (!$notification) {
            return response()->json(['message' => 'Notification not found'], 404);
        }

        return response()->json($notification);
    }
}
