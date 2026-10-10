# ServeDeServe Event Portal Runner
# Checks for Node.js; if present, runs express server.js.
# Otherwise, starts lightweight built-in PowerShell HTTP server on port 3000.

$port = 3000
$node = Get-Command node -ErrorAction SilentlyContinue

if ($node) {
    Write-Host "Starting ServeDeServe with Node.js on http://localhost:$port..." -ForegroundColor Green
    node server.js
} else {
    Write-Host "Node.js not detected in PATH. Starting built-in Windows PowerShell HTTP server..." -ForegroundColor Cyan
    Write-Host "🚀 Server running at http://localhost:$port/" -ForegroundColor Green
    Write-Host "   Admin Console at http://localhost:$port/admin" -ForegroundColor Yellow
    Write-Host "   Press Ctrl+C to stop.`n"

    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$port/")
    $listener.Start()

    $publicDir = Join-Path $PSScriptRoot "public"

    $mime = @{
        ".html" = "text/html; charset=utf-8"
        ".css"  = "text/css"
        ".js"   = "application/javascript"
        ".json" = "application/json"
        ".png"  = "image/png"
        ".jpg"  = "image/jpeg"
        ".svg"  = "image/svg+xml"
    }

    try {
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response

            $urlPath = $request.Url.LocalPath

            if ($urlPath -eq "/" -or $urlPath -eq "") {
                $filePath = Join-Path $publicDir "index.html"
            } elseif ($urlPath -eq "/events") {
                $filePath = Join-Path $publicDir "events.html"
            } elseif ($urlPath.StartsWith("/events/")) {
                $filePath = Join-Path $publicDir "event-detail.html"
            } elseif ($urlPath.StartsWith("/register/")) {
                $filePath = Join-Path $publicDir "register.html"
            } elseif ($urlPath -eq "/confirmation") {
                $filePath = Join-Path $publicDir "confirmation.html"
            } elseif ($urlPath -eq "/track") {
                $filePath = Join-Path $publicDir "track.html"
            } elseif ($urlPath -eq "/login") {
                $filePath = Join-Path $publicDir "login.html"
            } elseif ($urlPath -eq "/admin" -or $urlPath -eq "/admin/") {
                $filePath = Join-Path $publicDir "admin\dashboard.html"
            } elseif ($urlPath -eq "/admin/events") {
                $filePath = Join-Path $publicDir "admin\events.html"
            } elseif ($urlPath -eq "/admin/events/create") {
                $filePath = Join-Path $publicDir "admin\create-event.html"
            } elseif ($urlPath -eq "/admin/registrations") {
                $filePath = Join-Path $publicDir "admin\registrations.html"
            } else {
                $filePath = Join-Path $publicDir ($urlPath.TrimStart('/').Replace('/', '\'))
            }

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $response.ContentType = if ($mime.ContainsKey($ext)) { $mime[$ext] } else { "application/octet-stream" }
                $bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.Length
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
            } else {
                $response.StatusCode = 404
                $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
                $response.OutputStream.Write($msg, 0, $msg.Length)
            }
            $response.OutputStream.Close()
        }
    } finally {
        $listener.Stop()
    }
}
