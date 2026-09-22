[CmdletBinding()]
param(
    [switch]$Online
)

$ErrorActionPreference = 'Stop'
$composeFile = Join-Path $PSScriptRoot 'docker-compose.yml'

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker CLI is required for the runner smoke path.'
}

if (-not $Online) {
    $originalRepoUrl = [Environment]::GetEnvironmentVariable('REPO_URL')
    $originalRunnerToken = [Environment]::GetEnvironmentVariable('RUNNER_TOKEN')
    try {
        $env:REPO_URL = 'https://example.invalid/VirtualWardrobe'
        $env:RUNNER_TOKEN = 'offline-preflight-placeholder'
        docker compose -f $composeFile config --quiet
        if ($LASTEXITCODE -ne 0) {
            throw 'Compose configuration is invalid.'
        }
    } finally {
        if ($null -eq $originalRepoUrl) {
            Remove-Item Env:REPO_URL -ErrorAction SilentlyContinue
        } else {
            $env:REPO_URL = $originalRepoUrl
        }
        if ($null -eq $originalRunnerToken) {
            Remove-Item Env:RUNNER_TOKEN -ErrorAction SilentlyContinue
        } else {
            $env:RUNNER_TOKEN = $originalRunnerToken
        }
    }
    Write-Output 'Offline runner preflight passed: compose syntax is valid and no GitHub registration was attempted.'
    exit 0
}

foreach ($name in 'REPO_URL', 'RUNNER_TOKEN') {
    if ([string]::IsNullOrWhiteSpace([Environment]::GetEnvironmentVariable($name))) {
        throw "$name must be set for the online disposable-runner smoke."
    }
}

docker compose -f $composeFile up --build --abort-on-container-exit --exit-code-from runner
if ($LASTEXITCODE -ne 0) {
    throw 'The runner container exited unsuccessfully. Check the container log and GitHub Actions run.'
}