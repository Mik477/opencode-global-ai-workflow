[CmdletBinding()]
param(
    [string]$ConfigRoot = (Join-Path $HOME ".config\opencode"),
    [switch]$SkipTests,
    [switch]$CheckShellIntegration,
    [string]$PowerShellProfilePath = $PROFILE.CurrentUserCurrentHost,
    [string]$TerminalSettingsPath
)

$ErrorActionPreference = "Stop"
$root = (Resolve-Path -LiteralPath $ConfigRoot).Path
$requiredPaths = @(
    "opencode.jsonc",
    "dcp.jsonc",
    "tui.json",
    "SUPERPOWERS-WORKFLOW.md",
    "skills\focused-delivery\SKILL.md",
    "skills\bootstrapping-project-knowledge\SKILL.md",
    "skills\scope-bounded-review\SKILL.md",
    "scripts\apply-superpowers-overrides.mjs",
    "scripts\terminal-settings.mjs",
    "plugins\session-progress\server.ts",
    "plugins\diagnostics\server.ts",
    "plugins\terminal-title-clean\tui.ts"
)

foreach ($relativePath in $requiredPaths) {
    $fullPath = Join-Path $root $relativePath
    if (-not (Test-Path -LiteralPath $fullPath)) {
        throw "Missing required workflow file: $fullPath"
    }
}

$overrideOutput = (& node (Join-Path $root "scripts\apply-superpowers-overrides.mjs") --check 2>&1 | Out-String)
if ($LASTEXITCODE -ne 0) {
    throw "Focused Superpowers override validation failed.`n$overrideOutput"
}

function Invoke-OpenCodeDebug {
    param([Parameter(Mandatory = $true)][string[]]$Arguments)

    $previousPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = (& opencode @Arguments 2>&1 | Out-String)
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousPreference
    }
    if ($exitCode -ne 0) {
        throw "opencode $($Arguments -join ' ') failed with exit code $exitCode.`n$output"
    }
    return $output
}

function ConvertFrom-OpenCodeJson {
    param([Parameter(Mandatory = $true)][string]$Output)

    $starts = [regex]::Matches($Output, "(?m)^[\t ]*[\[{]")
    foreach ($start in $starts) {
        try {
            return $Output.Substring($start.Index).Trim() | ConvertFrom-Json
        } catch {
            continue
        }
    }
    throw "OpenCode debug output did not contain parseable JSON.`n$Output"
}

function Restore-EnvironmentValue {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [AllowNull()][string]$Value
    )

    Set-Item -LiteralPath "Env:$Name" -Value $Value
}

function Test-PathWithin {
    param(
        [Parameter(Mandatory = $true)][string]$Candidate,
        [Parameter(Mandatory = $true)][string]$Parent
    )

    try {
        $candidatePath = [System.IO.Path]::GetFullPath($Candidate).TrimEnd("\", "/")
        $parentPath = [System.IO.Path]::GetFullPath($Parent).TrimEnd("\", "/")
    } catch {
        throw "Invalid provenance path candidate '$Candidate' or parent '$Parent': $($_.Exception.Message)"
    }
    if ([string]::Equals($candidatePath, $parentPath, [System.StringComparison]::OrdinalIgnoreCase)) {
        return $true
    }
    return $candidatePath.StartsWith(
        "$parentPath$([System.IO.Path]::DirectorySeparatorChar)",
        [System.StringComparison]::OrdinalIgnoreCase
    )
}

$isolationRoot = Join-Path ([System.IO.Path]::GetTempPath()) "opencode-workflow-validation-$([guid]::NewGuid().ToString('N'))"
New-Item -ItemType Directory -Path $isolationRoot | Out-Null
$savedEnvironment = @{
    XDG_CONFIG_HOME = $env:XDG_CONFIG_HOME
    OPENCODE_CONFIG = $env:OPENCODE_CONFIG
    OPENCODE_CONFIG_CONTENT = $env:OPENCODE_CONFIG_CONTENT
    OPENCODE_CONFIG_DIR = $env:OPENCODE_CONFIG_DIR
    OPENCODE_DISABLE_PROJECT_CONFIG = $env:OPENCODE_DISABLE_PROJECT_CONFIG
}

try {
    $env:XDG_CONFIG_HOME = $isolationRoot
    $env:OPENCODE_CONFIG = $null
    $env:OPENCODE_CONFIG_CONTENT = $null
    $env:OPENCODE_CONFIG_DIR = $root
    $env:OPENCODE_DISABLE_PROJECT_CONFIG = "1"

    Push-Location $isolationRoot
    try {
        $config = ConvertFrom-OpenCodeJson (Invoke-OpenCodeDebug -Arguments @("debug", "config"))
        $expectedPluginFragments = @(
            "superpowers",
            "opencode-dcp@3.1.14",
            "session-progress/server.ts",
            "diagnostics/server.ts"
        )
        $resolvedText = $config | ConvertTo-Json -Depth 100
        foreach ($fragment in $expectedPluginFragments) {
            if ($resolvedText.Replace("\", "/") -notmatch [regex]::Escape($fragment)) {
                throw "Isolated OpenCode configuration is missing '$fragment'."
            }
        }
        foreach ($origin in @($config.plugin_origins)) {
            if ($origin.source -and -not (Test-PathWithin -Candidate $($origin.source) -Parent $root)) {
                throw "Plugin '$($origin.spec)' came from outside the isolated workflow: $($origin.source)"
            }
        }

        $requiredTools = @("compress", "task_create", "task_get", "task_list", "task_update")
        $forbiddenTools = @("todowrite", "context_usage", "session_search", "session_read")
        foreach ($agent in @("build", "plan", "general", "explore")) {
            $agentConfig = ConvertFrom-OpenCodeJson (
                Invoke-OpenCodeDebug -Arguments @("debug", "agent", $agent)
            )
            foreach ($tool in $requiredTools) {
                if ($agentConfig.tools.$tool -ne $true) {
                    throw "Agent '$agent' does not expose required tool '$tool'."
                }
            }
            foreach ($tool in $forbiddenTools) {
                if ($agentConfig.tools.$tool -ne $false) {
                    throw "Agent '$agent' exposes forbidden tool '$tool'."
                }
            }
        }

        $diagnostics = ConvertFrom-OpenCodeJson (
            Invoke-OpenCodeDebug -Arguments @("debug", "agent", "diagnostics")
        )
        $enabledDiagnosticTools = @($diagnostics.tools.PSObject.Properties |
            Where-Object { $_.Value -eq $true } |
            ForEach-Object { $_.Name } |
            Sort-Object)
        $expectedDiagnosticTools = @("context_usage", "session_read", "session_search")
        if (@(Compare-Object $expectedDiagnosticTools $enabledDiagnosticTools).Count -ne 0) {
            throw "Diagnostics tool allowlist is incorrect: $($enabledDiagnosticTools -join ', ')."
        }

        $skills = ConvertFrom-OpenCodeJson (Invoke-OpenCodeDebug -Arguments @("debug", "skill"))
        $requiredSkills = @(
            "brainstorming",
            "dispatching-parallel-agents",
            "executing-plans",
            "finishing-a-development-branch",
            "requesting-code-review",
            "subagent-driven-development",
            "systematic-debugging",
            "test-driven-development",
            "using-git-worktrees",
            "using-superpowers",
            "verification-before-completion",
            "writing-plans"
        )
        $skillRoot = Join-Path $root "node_modules\superpowers\skills"
        foreach ($skillName in $requiredSkills) {
            $skill = $skills |
                ForEach-Object { $_ } |
                Where-Object { $_.name -eq $skillName } |
                Select-Object -First 1
            if (-not $skill) {
                throw "Superpowers skill '$skillName' is unavailable."
            }
            $skillLocation = [string]($skill | Select-Object -ExpandProperty location)
            if (-not (Test-PathWithin -Candidate $skillLocation -Parent $skillRoot)) {
                throw "Superpowers skill '$skillName' came from outside the isolated workflow: $skillLocation"
            }
        }
        $customSkillRoot = Join-Path $root "skills"
        foreach ($skillName in @(
            "bootstrapping-project-knowledge",
            "focused-delivery",
            "scope-bounded-review"
        )) {
            $skill = $skills |
                ForEach-Object { $_ } |
                Where-Object { $_.name -eq $skillName } |
                Select-Object -First 1
            if (-not $skill) {
                throw "Custom skill '$skillName' is unavailable."
            }
            $skillLocation = [string]($skill | Select-Object -ExpandProperty location)
            if (-not (Test-PathWithin -Candidate $skillLocation -Parent $customSkillRoot)) {
                throw "Custom skill '$skillName' came from outside the isolated workflow: $skillLocation"
            }
        }
    } finally {
        Pop-Location
    }
} finally {
    foreach ($entry in $savedEnvironment.GetEnumerator()) {
        Restore-EnvironmentValue -Name $entry.Key -Value $entry.Value
    }
    Remove-Item -LiteralPath $isolationRoot -Force -Recurse -ErrorAction SilentlyContinue
}

$tuiConfig = Get-Content -LiteralPath (Join-Path $root "tui.json") -Raw | ConvertFrom-Json
foreach ($plugin in @("./plugins/terminal-title-clean", "./plugins/session-progress")) {
    if ($plugin -notin @($tuiConfig.plugin)) {
        throw "TUI configuration does not load '$plugin'."
    }
}

$parseFailures = @()
$powerShellScripts = @(
    Get-ChildItem -LiteralPath (Join-Path $root "scripts") -Filter "*.ps1" -File -Recurse
    Get-ChildItem -LiteralPath (Join-Path $root "windows\powershell") -Filter "*.ps1" -File -Recurse
)
foreach ($script in $powerShellScripts) {
    $fileErrors = $null
    [System.Management.Automation.Language.Parser]::ParseFile(
        $script.FullName,
        [ref]$null,
        [ref]$fileErrors
    ) | Out-Null
    foreach ($error in @($fileErrors)) {
        $parseFailures += "$($script.FullName):$($error.Extent.StartLineNumber):$($error.Extent.StartColumnNumber) $($error.Message)"
    }
}
if ($parseFailures.Count -gt 0) {
    throw "PowerShell parsing failed: $($parseFailures -join '; ')"
}

if ($CheckShellIntegration) {
    if (-not (Test-Path -LiteralPath $PowerShellProfilePath)) {
        throw "PowerShell profile was not installed at '$PowerShellProfilePath'."
    }
    $profileErrors = $null
    [System.Management.Automation.Language.Parser]::ParseFile(
        $PowerShellProfilePath,
        [ref]$null,
        [ref]$profileErrors
    ) | Out-Null
    if ($profileErrors.Count -gt 0) {
        throw "Installed PowerShell profile is invalid: $($profileErrors -join '; ')"
    }
    $profileText = Get-Content -LiteralPath $PowerShellProfilePath -Raw
    if ($profileText -notmatch "# BEGIN opencode-global-ai-workflow" -or $profileText -notmatch "Set-Alias -Name oai") {
        throw "PowerShell profile does not contain the managed oai integration."
    }
    if (-not $TerminalSettingsPath -or -not (Test-Path -LiteralPath $TerminalSettingsPath)) {
        throw "Windows Terminal settings were not supplied or do not exist."
    }
    $terminalOutput = (& node (Join-Path $root "scripts\terminal-settings.mjs") --inspect $TerminalSettingsPath 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) {
        throw "Windows Terminal settings are invalid: $terminalOutput"
    }
    $terminalSettings = $terminalOutput | ConvertFrom-Json
    $openCodeProfiles = @($terminalSettings.profiles.list | Where-Object {
        $_.name -eq "OpenCode" -or $_.guid -eq "{01aed5ce-8fe2-4c58-a48c-7a62e5de2668}"
    })
    if ($openCodeProfiles.Count -ne 1) {
        throw "Expected exactly one OpenCode Windows Terminal profile, found $($openCodeProfiles.Count)."
    }
    if ($openCodeProfiles[0].suppressApplicationTitle -ne $false) {
        throw "The OpenCode Windows Terminal profile suppresses dynamic titles."
    }
}

Push-Location $root
try {
    npm run typecheck
    if ($LASTEXITCODE -ne 0) { throw "Type checking failed." }
    if (-not $SkipTests) {
        if (-not (Get-Command bun -ErrorAction SilentlyContinue)) {
            throw "Bun is required for the custom plugin test suites. Install it or rerun with -SkipTests."
        }
        npm test
        if ($LASTEXITCODE -ne 0) { throw "Tests failed." }
    }
} finally {
    Pop-Location
}

Write-Host "Workflow validation passed for $root"
