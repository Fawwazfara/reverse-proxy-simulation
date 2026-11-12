<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

Route::get('/', function (Request $request) {
    $dbStatus = [
        'driver' => config('database.default'),
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => config('database.connections.mysql.database'),
        'connected' => false,
        'message' => '',
    ];

    try {
        DB::connection()->getPdo();
        $dbStatus['connected'] = true;
        $dbStatus['message'] = 'Terhubung ke MySQL (' . config('database.connections.mysql.database') . ')';
    } catch (\Throwable $e) {
        $dbStatus['connected'] = false;
        $dbStatus['message'] = $e->getMessage();
    }

    $proxyHeaders = [
        'Host' => $request->header('host'),
        'X-Real-IP' => $request->header('x-real-ip', '-'),
        'X-Forwarded-For' => $request->header('x-forwarded-for', '-'),
        'X-Forwarded-Proto' => $request->header('x-forwarded-proto', '-'),
        'X-Forwarded-Host' => $request->header('x-forwarded-host', '-'),
        'X-Forwarded-Port' => $request->header('x-forwarded-port', '-'),
    ];

    return view('welcome', [
        'dbStatus' => $dbStatus,
        'proxyHeaders' => $proxyHeaders,
        'clientIp' => $request->ip(),
        'allHeaders' => $request->headers->all(),
    ]);
});

Route::get('/api/health', function (Request $request) {
    $dbConnected = false;
    try {
        DB::connection()->getPdo();
        $dbConnected = true;
    } catch (\Throwable $e) {}

    return response()->json([
        'status' => 'healthy',
        'service' => 'Laravel + MySQL',
        'port' => 8001,
        'timestamp' => now()->toIso8601String(),
        'client_ip' => $request->ip(),
        'database' => [
            'type' => 'mysql',
            'connected' => $dbConnected
        ],
        'proxy_headers' => [
            'x_real_ip' => $request->header('x-real-ip'),
            'x_forwarded_for' => $request->header('x-forwarded-for'),
            'x_forwarded_proto' => $request->header('x-forwarded-proto'),
            'host' => $request->header('host'),
        ]
    ]);
});
