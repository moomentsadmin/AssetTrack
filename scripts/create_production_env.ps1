<#
Create or update a GitHub repository environment named 'production' and add a deployment
protection rule that requires review approvals from specified users and/or teams.

Usage examples:
  # Using environment variables for token
  $env:GH_TOKEN="ghp_xxx";
  .\create_production_env.ps1 -Owner moomentsadmin -Repo AssetTrack -ApproverUsernames "alice,bob" -ApproverTeamSlugs "devops"

  # Prompt for token interactively
  .\create_production_env.ps1 -Owner moomentsadmin -Repo AssetTrack -ApproverUsernames "alice" 

Notes:
- Requires a GitHub token with `repo` and admin permissions. Set it in $env:GH_TOKEN or the script will prompt.
- Team slugs refer to org team slugs (not team IDs). If you pass team slugs, the script will try to resolve team IDs.
#>

param(
  [Parameter(Mandatory=$true)] [string] $Owner,
  [Parameter(Mandatory=$true)] [string] $Repo,
  [string] $ApproverUsernames = "",
  [string] $ApproverTeamSlugs = "",
  [string] $OrgForTeams = $null,
  [switch] $DryRun
)

function Get-AuthToken {
  if ($env:GH_TOKEN -and $env:GH_TOKEN.Trim().Length -gt 0) {
    return $env:GH_TOKEN
  }
  Write-Host "Enter GitHub Personal Access Token (needs repo/admin permissions):" -NoNewline
  $token = Read-Host -AsSecureString
  return [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($token))
}

function Invoke-GitHubApi {
  param(
    [string] $Method,
    [string] $Url,
    [object] $Body = $null
  )

  $headers = @{ Authorization = "token $Global:GHToken"; Accept = 'application/vnd.github+json' }

  if ($Body -ne $null) {
    $json = $Body | ConvertTo-Json -Depth 10
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers -Body $json -ContentType 'application/json'
  } else {
    return Invoke-RestMethod -Method $Method -Uri $Url -Headers $headers
  }
}

# Ensure token
$Global:GHToken = Get-AuthToken
if (-not $Global:GHToken) {
  Write-Error "GitHub token is required. Set GH_TOKEN env var or provide token when prompted."
  exit 1
}

$baseApi = "https://api.github.com/repos/$Owner/$Repo"

Write-Host "Creating/updating environment 'production' for $Owner/$Repo..."
try {
  $envUrl = "$baseApi/environments/production"
  $body = @{ wait_timer = 0 }
  if ($DryRun) {
    Write-Host "[DryRun] Would PUT to $envUrl with body:" -ForegroundColor Yellow
    $body | ConvertTo-Json -Depth 5 | Write-Host
  } else {
    $resp = Invoke-GitHubApi -Method Put -Url $envUrl -Body $body
    Write-Host "Environment create/update response received." -ForegroundColor Green
  }
} catch {
  Write-Error "Failed to create/update environment: $_"
  exit 1
}

# Resolve user IDs
$actorIds = @()
if ($ApproverUsernames.Trim().Length -gt 0) {
  $users = $ApproverUsernames.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  foreach ($u in $users) {
    try {
      $userApi = "https://api.github.com/users/$u"
      $userResp = Invoke-GitHubApi -Method Get -Url $userApi
      if ($userResp.id) {
        $actorIds += $userResp.id
        Write-Host "Resolved user $u -> id $($userResp.id)"
      }
    } catch {
      Write-Warning "Could not resolve user '$u': $_"
    }
  }
}

# Resolve team IDs if provided (requires OrgForTeams or Owner as org)
$teamIds = @()
if ($ApproverTeamSlugs.Trim().Length -gt 0) {
  if (-not $OrgForTeams) { $OrgForTeams = $Owner }
  $teams = $ApproverTeamSlugs.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }
  foreach ($t in $teams) {
    try {
      $teamApi = "https://api.github.com/orgs/$OrgForTeams/teams/$t"
      $teamResp = Invoke-GitHubApi -Method Get -Url $teamApi
      if ($teamResp.id) {
        $teamIds += $teamResp.id
        Write-Host "Resolved team $t -> id $($teamResp.id)"
      }
    } catch {
      Write-Warning "Could not resolve team '$t' in org '$OrgForTeams': $_"
    }
  }
}

if ($actorIds.Count -eq 0 -and $teamIds.Count -eq 0) {
  Write-Warning "No valid actor_ids or team_ids resolved. You can still create the environment, but no protection rule will be added."
  if ($DryRun) { exit 0 } else { exit 0 }
}

# Create deployment protection rule
Write-Host "Creating deployment protection rule (required reviewers)..."
try {
  $protUrl = "$baseApi/environments/production/deployment_protection_rules"
  $payload = @{ name = "Require production approvals"; rule_type = "required_reviewers"; conditions = @{ } }
  if ($actorIds.Count -gt 0) { $payload.conditions.actor_ids = $actorIds }
  if ($teamIds.Count -gt 0) { $payload.conditions.team_ids = $teamIds }

  if ($DryRun) {
    Write-Host "[DryRun] Would POST to $protUrl with payload:" -ForegroundColor Yellow
    $payload | ConvertTo-Json -Depth 10 | Write-Host
  } else {
    $protResp = Invoke-GitHubApi -Method Post -Url $protUrl -Body $payload
    Write-Host "Deployment protection rule created." -ForegroundColor Green
    $protResp | ConvertTo-Json -Depth 5 | Write-Output
  }
} catch {
  Write-Error "Failed to create deployment protection rule: $_"
  exit 1
}

Write-Host "Done. The 'production' environment is ready with the requested protection rule." -ForegroundColor Cyan
