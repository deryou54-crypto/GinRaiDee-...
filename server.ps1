$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:8080/")
try {
    $listener.Start()
    Write-Host "Listening on http://localhost:8080/ ..."
} catch {
    Write-Host "Failed to start listener: $_"
    exit 1
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $path = $request.Url.LocalPath
        if ($path -eq "/" -or $path -eq "") { $path = "/index.html" }
        
        # Strip leading slash
        $relPath = $path.TrimStart('/')
        $filePath = Resolve-Path $relPath -ErrorAction SilentlyContinue
        
        if ($filePath -and (Test-Path $filePath -PathType Leaf)) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            
            # Content-Type
            if ($path.EndsWith(".html")) { $response.ContentType = "text/html; charset=utf-8" }
            elseif ($path.EndsWith(".css")) { $response.ContentType = "text/css; charset=utf-8" }
            elseif ($path.EndsWith(".js")) { $response.ContentType = "application/javascript; charset=utf-8" }
            elseif ($path.EndsWith(".json")) { $response.ContentType = "application/json; charset=utf-8" }
            elseif ($path.EndsWith(".jpg") -or $path.EndsWith(".jpeg")) { $response.ContentType = "image/jpeg" }
            elseif ($path.EndsWith(".png")) { $response.ContentType = "image/png" }
            elseif ($path.EndsWith(".webp")) { $response.ContentType = "image/webp" }
            
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $errBytes = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
            $response.ContentLength64 = $errBytes.Length
            $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
        }
        $response.Close()
    } catch {
        # Silent ignore or log
    }
}
