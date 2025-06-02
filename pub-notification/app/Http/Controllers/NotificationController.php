<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use \App\Models\Notification;
class NotificationController extends Controller
{
    // Create a new notification
    public function create(Request $request)
    {
        // Validate incoming data
        $validated = $request->validate([
            'type' => ['required', 'string'],
            'payload' => ['required'],
        ]);
        $userId = auth()->user()->id;
        // Create the notification
        $notification = Notification::create(['type' => $validated['type'], 'payload' => $validated['payload'], 'user_id' => (int) $userId]);

        return response()->json($notification, 201);
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
