$ErrorActionPreference = 'Stop'
$studioRoot = $PSScriptRoot
$studioUrl = 'http://127.0.0.1:4184/'
$studioReady = $false
try {
    $response = Invoke-WebRequest -Uri $studioUrl -UseBasicParsing -TimeoutSec 3
    if ($response.Content -match 'KOSTRZEWA') { $studioReady = $true }
    else { throw 'Port 4184 jest zajety przez inna aplikacje.' }
} catch {
    if ($_.Exception.Message -match 'inna aplikacje') { throw }
}
if (-not $studioReady) {
    $nodePath = (Get-Command node -ErrorAction Stop).Source
    Start-Process -FilePath $nodePath -ArgumentList @('node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','4184','--strictPort') -WorkingDirectory $studioRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $studioRoot 'qa/server.log') -RedirectStandardError (Join-Path $studioRoot 'qa/server-error.log') | Out-Null
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        Start-Sleep -Milliseconds 500
        try {
            $response = Invoke-WebRequest -Uri $studioUrl -UseBasicParsing -TimeoutSec 2
            if ($response.Content -match 'KOSTRZEWA') { $studioReady = $true; break }
        } catch {}
    }
}
if (-not $studioReady) { throw 'Nie udalo sie uruchomic studia. Sprawdz qa/server-error.log.' }
Start-Process $studioUrl
