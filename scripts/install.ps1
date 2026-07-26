[CmdletBinding()]
param(
    [string]$Destination = (Join-Path $HOME ".config\opencode"),
    [switch]$SkipShellIntegration,
    [switch]$SkipTests,
    [string]$PowerShellProfilePath = $PROFILE.CurrentUserCurrentHost,
    [string]$TerminalSettingsPath
)

$ErrorActionPreference = "Stop"

function Normalize-DirectoryPath {
    param([Parameter(Mandatory = $true)][string]$Path)

    $fullPath = [System.IO.Path]::GetFullPath([Environment]::ExpandEnvironmentVariables($Path))
    $root = [System.IO.Path]::GetPathRoot($fullPath)
    while ($fullPath.Length -gt $root.Length -and ($fullPath.EndsWith("\") -or $fullPath.EndsWith("/"))) {
        $fullPath = $fullPath.Substring(0, $fullPath.Length - 1)
    }
    return $fullPath
}

$sourceRoot = Normalize-DirectoryPath (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot "..")).Path
$destinationPath = Normalize-DirectoryPath $Destination

function Require-Command {
    param([Parameter(Mandatory = $true)][string]$Name)

    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "Required command '$Name' was not found on PATH."
    }
}

function Get-InstalledVersion {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Argument
    )

    $rawVersion = (& $Name $Argument 2>&1 | Out-String).Trim()
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to determine the installed $Name version."
    }
    $versionText = $rawVersion.TrimStart("v")
    if ($versionText.Contains("-")) {
        throw "$Name prerelease '$rawVersion' is not supported."
    }
    try {
        $installed = [version]$versionText
    } catch {
        throw "Unable to parse the installed $Name version '$rawVersion'."
    }
    return $installed
}

function Resolve-TerminalSettingsPath {
    param([string]$Override)

    if ($Override) {
        if (-not (Test-Path -LiteralPath $Override)) {
            throw "Windows Terminal settings were not found at '$Override'."
        }
        return (Resolve-Path -LiteralPath $Override).Path
    }
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Packages\Microsoft.WindowsTerminal_8wekyb3d8bbwe\LocalState\settings.json"),
        (Join-Path $env:LOCALAPPDATA "Packages\Microsoft.WindowsTerminalPreview_8wekyb3d8bbwe\LocalState\settings.json"),
        (Join-Path $env:LOCALAPPDATA "Microsoft\Windows Terminal\settings.json")
    )
    $matches = @($candidates | Where-Object { Test-Path -LiteralPath $_ })
    if ($matches.Count -eq 0) {
        throw "Windows Terminal settings were not found. Start Windows Terminal once, then rerun this script."
    }
    if ($matches.Count -gt 1) {
        throw "Multiple Windows Terminal installations were found. Rerun with -TerminalSettingsPath and choose one."
    }
    return (Resolve-Path -LiteralPath $matches[0]).Path
}

function Invoke-NpmCi {
    param([Parameter(Mandatory = $true)][string]$Root)

    Push-Location $Root
    try {
        npm ci --engine-strict
        if ($LASTEXITCODE -ne 0) {
            throw "npm ci failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

function Invoke-WorkflowValidation {
    param(
        [Parameter(Mandatory = $true)][string]$Root,
        [switch]$WithoutTests,
        [switch]$WithShell
    )

    $parameters = @{ ConfigRoot = $Root }
    if ($WithoutTests) { $parameters.SkipTests = $true }
    if ($WithShell) {
        $parameters.CheckShellIntegration = $true
        $parameters.PowerShellProfilePath = $PowerShellProfilePath
        $parameters.TerminalSettingsPath = $script:resolvedTerminalSettings
    }
    & (Join-Path $Root "scripts\validate.ps1") @parameters
}

Require-Command node
Require-Command npm
Require-Command opencode
$nodeVersion = Get-InstalledVersion -Name node -Argument "--version"
if (($nodeVersion -lt [version]"24.15.0") -or $nodeVersion.Major -eq 25) {
    throw "Node 24.15.0 or newer within Node 24, or Node 26 or newer, is required; found $nodeVersion."
}
$npmVersion = Get-InstalledVersion -Name npm -Argument "--version"
if ($npmVersion -lt [version]"10.0.0") {
    throw "npm 10.0.0 or newer is required; found $npmVersion."
}
$openCodeVersion = Get-InstalledVersion -Name opencode -Argument "--version"
if ($openCodeVersion -lt [version]"1.18.5") {
    throw "OpenCode 1.18.5 or newer is required; found $openCodeVersion."
}

$resolvedTerminalSettings = $null
if (-not $SkipShellIntegration) {
    Require-Command wt.exe
    $resolvedTerminalSettings = Resolve-TerminalSettingsPath -Override $TerminalSettingsPath
    if (Test-Path -LiteralPath $PowerShellProfilePath) {
        $signature = Get-AuthenticodeSignature -LiteralPath $PowerShellProfilePath
        if ($signature.Status -ne "NotSigned") {
            throw "The PowerShell profile is signed. Install windows\powershell\Open-AITab.ps1 manually and re-sign the profile."
        }
    }
}

$installRoot = $sourceRoot
$stagingPath = $null
$destinationCreated = $false
if (-not [string]::Equals($sourceRoot, $destinationPath, [System.StringComparison]::OrdinalIgnoreCase)) {
    if (Test-Path -LiteralPath $destinationPath) {
        throw "Destination '$destinationPath' already exists. Back it up and remove it, or clone this repository there directly."
    }
    $destinationParent = Split-Path -Parent $destinationPath
    if (-not (Test-Path -LiteralPath $destinationParent)) {
        New-Item -ItemType Directory -Path $destinationParent | Out-Null
    }
    $stagingPath = "$destinationPath.install-$([guid]::NewGuid().ToString('N'))"
    New-Item -ItemType Directory -Path $stagingPath | Out-Null
    try {
        $portableItems = @(
            ".gitattributes",
            ".gitignore",
            "AGENTS.md",
            "AI-WORKFLOW.md",
            "README.md",
            "SUPERPOWERS-WORKFLOW.md",
            "command",
            "dcp.jsonc",
            "docs",
            "opencode.jsonc",
            "package-lock.json",
            "package.json",
            "plugins",
            "scripts",
            "tui.json",
            "windows"
        )
        foreach ($item in $portableItems) {
            Copy-Item -LiteralPath (Join-Path $sourceRoot $item) -Destination $stagingPath -Recurse
        }
        Invoke-NpmCi -Root $stagingPath
        Invoke-WorkflowValidation -Root $stagingPath -WithoutTests:$SkipTests
        Move-Item -LiteralPath $stagingPath -Destination $destinationPath
        $stagingPath = $null
        $installRoot = $destinationPath
        $destinationCreated = $true
    } finally {
        if ($stagingPath -and (Test-Path -LiteralPath $stagingPath)) {
            Remove-Item -LiteralPath $stagingPath -Force -Recurse
        }
    }
} else {
    Invoke-NpmCi -Root $installRoot
    Invoke-WorkflowValidation -Root $installRoot -WithoutTests:$SkipTests
}

if (-not $SkipShellIntegration) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmssfff"
    $profileExisted = Test-Path -LiteralPath $PowerShellProfilePath
    $profileBackup = if ($profileExisted) { "$PowerShellProfilePath.backup-$timestamp" } else { $null }
    $terminalBackup = "$resolvedTerminalSettings.backup-$timestamp"
    $profileBackupCreated = $false
    $terminalBackupCreated = $false
    $profileMutationAttempted = $false
    $terminalMutationAttempted = $false
    $profileTemp = "$PowerShellProfilePath.tmp-$([guid]::NewGuid().ToString('N'))"
    $terminalTemp = "$resolvedTerminalSettings.tmp-$([guid]::NewGuid().ToString('N'))"

    try {
        $profileDirectory = Split-Path -Parent $PowerShellProfilePath
        if (-not (Test-Path -LiteralPath $profileDirectory)) {
            New-Item -ItemType Directory -Path $profileDirectory | Out-Null
        }
        $beginMarker = "# BEGIN opencode-global-ai-workflow"
        $endMarker = "# END opencode-global-ai-workflow"
        $snippet = Get-Content -LiteralPath (Join-Path $installRoot "windows\powershell\Open-AITab.ps1") -Raw
        $managedBlock = "$beginMarker`r`n$($snippet.Trim())`r`n$endMarker"
        $existingProfile = if ($profileExisted) { Get-Content -LiteralPath $PowerShellProfilePath -Raw } else { "" }
        $managedPattern = "(?s)$([regex]::Escape($beginMarker)).*?$([regex]::Escape($endMarker))"
        $newProfile = if ($existingProfile -match $managedPattern) {
            [regex]::Replace($existingProfile, $managedPattern, $managedBlock)
        } elseif ([string]::IsNullOrWhiteSpace($existingProfile)) {
            $managedBlock
        } else {
            $existingProfile.TrimEnd() + "`r`n`r`n" + $managedBlock
        }
        $profileTokens = $null
        $profileErrors = $null
        [System.Management.Automation.Language.Parser]::ParseInput(
            $newProfile,
            [ref]$profileTokens,
            [ref]$profileErrors
        ) | Out-Null
        if ($profileErrors.Count -gt 0) {
            throw "The merged PowerShell profile is invalid: $($profileErrors -join '; ')"
        }

        & node (
            Join-Path $installRoot "scripts\terminal-settings.mjs"
        ) $resolvedTerminalSettings (
            Join-Path $installRoot "windows\terminal\OpenCode.profile.json"
        ) $terminalTemp
        if ($LASTEXITCODE -ne 0) {
            throw "Unable to merge the OpenCode Windows Terminal profile."
        }

        if ($profileBackup) {
            Copy-Item -LiteralPath $PowerShellProfilePath -Destination $profileBackup
            $profileBackupCreated = $true
        }
        Copy-Item -LiteralPath $resolvedTerminalSettings -Destination $terminalBackup
        $terminalBackupCreated = $true

        Set-Content -LiteralPath $profileTemp -Value $newProfile -Encoding UTF8
        $profileMutationAttempted = $true
        Move-Item -LiteralPath $profileTemp -Destination $PowerShellProfilePath -Force
        $terminalMutationAttempted = $true
        Move-Item -LiteralPath $terminalTemp -Destination $resolvedTerminalSettings -Force

        Invoke-WorkflowValidation -Root $installRoot -WithoutTests -WithShell
    } catch {
        $primaryError = $_
        $rollbackFailures = @()
        if ($terminalMutationAttempted -and $terminalBackupCreated) {
            try {
                Copy-Item -LiteralPath $terminalBackup -Destination $resolvedTerminalSettings -Force
            } catch {
                $rollbackFailures += "Windows Terminal settings: $($_.Exception.Message)"
            }
        }
        if ($profileMutationAttempted) {
            try {
                if ($profileBackupCreated) {
                    Copy-Item -LiteralPath $profileBackup -Destination $PowerShellProfilePath -Force
                } elseif (Test-Path -LiteralPath $PowerShellProfilePath) {
                    Remove-Item -LiteralPath $PowerShellProfilePath -Force
                }
            } catch {
                $rollbackFailures += "PowerShell profile: $($_.Exception.Message)"
            }
        }
        if ($destinationCreated -and (Test-Path -LiteralPath $installRoot)) {
            try {
                Remove-Item -LiteralPath $installRoot -Force -Recurse
            } catch {
                $rollbackFailures += "new destination: $($_.Exception.Message)"
            }
        }
        foreach ($failure in $rollbackFailures) {
            Write-Warning "Rollback failed for $failure"
        }
        throw $primaryError
    } finally {
        foreach ($temporaryFile in @($profileTemp, $terminalTemp)) {
            Remove-Item -LiteralPath $temporaryFile -Force -ErrorAction SilentlyContinue
        }
    }

    Write-Host "Installed the oai profile block at $PowerShellProfilePath"
    if ($profileBackup) { Write-Host "PowerShell profile backup: $profileBackup" }
    Write-Host "Merged the OpenCode Windows Terminal profile. Backup: $terminalBackup"
}

Write-Host "Installation complete. Fully restart OpenCode and Windows Terminal before use."
