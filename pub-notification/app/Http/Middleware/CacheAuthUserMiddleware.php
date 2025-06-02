<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Redis;
class CacheAuthUserMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'Token not provided'], 401);
        }

        try {
            $payload = $this->decodeToken($token);

            $userId = $payload->get('sub');

            if (!$userId) {
                return response()->json(['error' => 'Invalid token payload'], 401);
            }
        } catch (\Exception $e) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $cacheKey = "auth_user:$userId";



        $user = Cache::get($cacheKey);


        if (!$user) {
            $user = \App\Models\User::find($userId, ['id', 'email']);

            if (!$user) {
                return response()->json(['error' => 'User not found'], 401);
            }
            Cache::put($cacheKey, $user, now()->addMinutes(2));
        }

        Auth::login($user);
        return $next($request);
    }

    private function decodeToken($token)
    {
        $payload = JWTAuth::setToken($token)->getPayload();
        return $payload;
    }
}