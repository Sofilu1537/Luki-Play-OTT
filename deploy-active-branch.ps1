param(
    [Parameter(Mandatory = $true)]
    [string]$ServerHost,

    [Parameter(Mandatory = $true)]
    [string]$ServerUser,

    [string]$KeyPath,

    [int]$SshPort = 22,

    [string]$RemoteAppDir = '$HOME/Luki-Play-OTT'
)

$ErrorActionPreference = 'Stop'

function Require-Command {
    param([string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Missing required command: $Name"
    }
}

Require-Command 'git'
Require-Command 'ssh'
Require-Command 'scp'
Require-Command 'tar'

$repoRoot = (Resolve-Path $PSScriptRoot).Path
$branch = (git -C $repoRoot rev-parse --abbrev-ref HEAD).Trim()

if ([string]::IsNullOrWhiteSpace($branch)) {
    throw 'Could not detect the active git branch.'
}

$resolvedKeyPath = $null
if ($KeyPath) {
    $resolvedKeyPath = (Resolve-Path $KeyPath).Path
}

$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("luki-play-deploy-" + [guid]::NewGuid().ToString('N'))
$archivePath = Join-Path $tempDir 'luki-play-ott.tar.gz'
$remoteScriptPath = Join-Path $tempDir 'remote-deploy.sh'

New-Item -ItemType Directory -Path $tempDir | Out-Null

try {
    Push-Location $repoRoot

    & tar.exe -czf $archivePath `
        --exclude=.git `
        --exclude=backend/node_modules `
        --exclude=backend/dist `
        --exclude=backend/coverage `
        --exclude=frontend/node_modules `
        --exclude=frontend/web-build `
        --exclude=frontend/dist `
        --exclude=frontend/.expo `
        --exclude=cms/node_modules `
        --exclude=cms/.next `
        .

    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to create deployment archive.'
    }

    $sshArgs = @('-o', 'StrictHostKeyChecking=accept-new', '-p', $SshPort.ToString())
    $scpArgs = @('-o', 'StrictHostKeyChecking=accept-new', '-P', $SshPort.ToString())

    if ($resolvedKeyPath) {
        $sshArgs += @('-i', $resolvedKeyPath)
        $scpArgs += @('-i', $resolvedKeyPath)
    }

    & ssh @sshArgs "$ServerUser@$ServerHost" "mkdir -p $RemoteAppDir"
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to prepare the remote directory.'
    }

    & scp @scpArgs $archivePath "$ServerUser@$ServerHost`:/tmp/luki-play-ott.tar.gz"
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to upload the deployment archive.'
    }

    $remoteCommand = @"
set -eu
mkdir -p "$RemoteAppDir"
find "$RemoteAppDir" -mindepth 1 -maxdepth 1 -exec rm -rf {} +
tar -xzf /tmp/luki-play-ott.tar.gz -C "$RemoteAppDir"
rm -f /tmp/luki-play-ott.tar.gz
cd "$RemoteAppDir"
sed -i 's/\r$//' deploy-ec2.sh
chmod +x deploy-ec2.sh
SKIP_GIT_SYNC=1 DEPLOY_BRANCH="$branch" APP_DIR="$RemoteAppDir" bash ./deploy-ec2.sh
"@

    $remoteCommand = $remoteCommand -replace "`r`n", "`n"
    [System.IO.File]::WriteAllText($remoteScriptPath, $remoteCommand, [System.Text.ASCIIEncoding]::new())

    & scp @scpArgs $remoteScriptPath "$ServerUser@$ServerHost`:/tmp/luki-remote-deploy.sh"
    if ($LASTEXITCODE -ne 0) {
        throw 'Failed to upload the remote deployment script.'
    }

    & ssh @sshArgs "$ServerUser@$ServerHost" 'bash /tmp/luki-remote-deploy.sh && rm -f /tmp/luki-remote-deploy.sh'
    if ($LASTEXITCODE -ne 0) {
        throw 'Remote deployment failed.'
    }

    Write-Host "Deployed active branch '$branch' to $ServerUser@$ServerHost"
}
finally {
    Pop-Location -ErrorAction SilentlyContinue

    if (Test-Path $tempDir) {
        Remove-Item -Recurse -Force $tempDir
    }
}