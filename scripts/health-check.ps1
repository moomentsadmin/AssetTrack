param(
  [Parameter(Mandatory=$true)][string]$Domain,
  [string]$Path = "/",
  [int]$Retries = 10,
  [int]$DelaySeconds = 6
)

Write-Host "Checking HTTPS for https://$Domain$Path" -ForegroundColor Cyan

function Invoke-Check {
  try {
    $response = Invoke-WebRequest -Uri "https://$Domain$Path" -UseBasicParsing -TimeoutSec 15
    return $response
  } catch {
    return $null
  }
}

$response = $null
for ($i=0; $i -lt $Retries; $i++) {
  $response = Invoke-Check
  if ($response) { break }
  Start-Sleep -Seconds $DelaySeconds
}

if (-not $response) {
  Write-Error "Failed to reach https://$Domain$Path after $Retries attempts"
  exit 1
}

# Print status, cert and server headers
Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
if ($response.Headers["server"]) { Write-Host "Server: $($response.Headers["server"])" }
if ($response.Headers["date"]) { Write-Host "Date: $($response.Headers["date"])" }

# Check a couple of API endpoints
$apiEndpoints = @( 
  "/api/health",
  "/api/setup/status",
  "/api/user"
)

foreach ($ep in $apiEndpoints) {
  try {
    $r = Invoke-WebRequest -Uri "https://$Domain$ep" -UseBasicParsing -TimeoutSec 15 -Headers @{ "Accept" = "application/json" }
    Write-Host "GET $ep -> $($r.StatusCode)" -ForegroundColor Yellow
  } catch {
    Write-Host "GET $ep -> error" -ForegroundColor Red
  }
}

Write-Host "Health check complete." -ForegroundColor Cyan
