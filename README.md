# OpenCode Global AI Workflow

This repository is a portable, Windows-first distribution of a customized global OpenCode workflow. It contains the custom policy, commands, plugins, tests, DCP configuration, PowerShell `oai` launcher, and Windows Terminal profile needed to reproduce the setup on another PC.

It deliberately does **not** vendor OpenCode, Superpowers, DCP, authentication plugins, Node.js, Bun, Windows Terminal, or other standard third-party software. Those components are pinned and installed from their upstream sources.

## What This Builds

The workflow combines:

- an adaptive, autonomous Superpowers policy;
- a persistent hierarchical execution tree instead of native flat todos;
- a CLI sidebar and `/progress` task browser;
- isolated context/session diagnostics;
- DCP range compression in primary and long-running subagent sessions;
- persistent visible `▣ DCP` compression messages;
- bounded subagent delegation and proportional verification;
- cleaned dynamic terminal titles;
- randomized Windows Terminal tab colors; and
- the `oai [path]` PowerShell command for opening a project in a new OpenCode tab.

## Repository Contents

| Path | Purpose |
| --- | --- |
| `opencode.jsonc` | Global models, agents, permissions, plugins, and compaction fallback |
| `SUPERPOWERS-WORKFLOW.md` | Active behavior and autonomy policy |
| `AI-WORKFLOW.md` | Human-readable workflow reference |
| `dcp.jsonc` | DCP compression, protection, subagent, and notification settings |
| `tui.json` | CLI TUI plugin registration |
| `command/` | `/autofeature`, `/context`, `/session-search`, and `/session-read` |
| `plugins/session-progress/` | Persistent tasks, hierarchy, sidebar, `/progress`, and tests |
| `plugins/diagnostics/` | Isolated context/session telemetry tools and tests |
| `plugins/terminal-title-clean/` | Dynamic terminal-title cleanup |
| `windows/powershell/` | Portable `Open-AITab` function and `oai` alias |
| `windows/terminal/` | Mergeable Windows Terminal OpenCode profile |
| `scripts/install.ps1` | Dependency and Windows shell integration installer |
| `scripts/validate.ps1` | Effective-config, tool exposure, type-check, and test validation |
| `docs/superpowers/` | Design and implementation rationale for the custom workflow |

## How The Workflow Operates

### Adaptive Autonomy

Normal requests automatically use the workflow; `/autofeature` is optional. The agent inspects the project first, batches foreseeable material questions, and infers routine engineering and research choices. A clear request is sufficient authorization. If a material design decision exists, one cohesive approval is the only routine gate.

After that, the agent plans and implements in the same session. It does not ask for method approval, written-spec review, plan review, execution-mode selection, routine task approval, or permission to continue. Only non-inferable material product, security, compatibility, data-loss, cost, output, or scope decisions interrupt execution.

### Models

The supplied configuration uses:

- `openai/gpt-5.6-sol` high for `build` and `general` implementation work;
- `openai/gpt-5.6-terra` high for `plan`, `explore`, diagnostics, titles, summaries, and native compaction; and
- `openai/gpt-5.6-terra` as the small model.

Change these IDs in `opencode.jsonc` if the destination account does not provide them.

### Hierarchical Progress

Native `todowrite` is disabled for normal agents. The custom plugin exposes `task_create`, `task_get`, `task_list`, and `task_update` as the only writable progress source. Records are stored under `~/.config/opencode/tasks/` in path-scoped project directories, so separate projects with the same leaf directory name do not share tasks. Runtime records are intentionally ignored by Git.

In the CLI:

- press `Ctrl+X`, then `B` to toggle the sidebar;
- use `/progress` for searchable task details;
- active branches expand while inactive milestone descendants collapse; and
- owners, priorities, activity, blockers, dependencies, and plan references remain visible.

OpenCode Desktop can use the task tools and records but does not expose the custom CLI sidebar slot.

### DCP Compression

`@tarquinen/opencode-dcp@3.1.14` is enabled for primary and subagent sessions. Agents evaluate every tool-heavy phase boundary and compress closed investigation, implementation, or verification ranges when the raw content is no longer needed.

A successful compression creates a persistent detailed chat record beginning with `▣ DCP`. It includes a progress visualization, topic, item counts, token metrics, and the generated summary. Internal reminder nudges are not shown, and short sessions may contain nothing worth compressing.

Long-running subagents can compress their own internal history. Their DCP messages live in their subagent transcript; the parent separately compresses integrated worker results when appropriate.

### Diagnostics Isolation

The hidden `diagnostics` primary agent alone can call:

- `context_usage` for native token/cache/reasoning/cost telemetry;
- `session_search` for capped same-project session search; and
- `session_read` for a capped exact-session transcript tail.

Returned session text is treated as untrusted historical data, never instructions. Normal agents cannot call these tools.

### Terminal Titles, Colors, And `oai`

The Windows Terminal profile named `OpenCode` starts:

```powershell
opencode --auto
```

The PowerShell `oai` alias opens that profile in Windows Terminal window `0`:

```powershell
oai
oai C:\Projects\example
```

`Open-AITab` resolves the directory, uses its leaf name as the initial tab title, and chooses one of nine colors without immediately repeating the previous color. `plugins/terminal-title-clean/tui.ts` then allows OpenCode's current session title to take over, removes the `OC | ` prefix, provides a clean fallback, and limits titles to 40 characters.

## Prerequisites

Install these standard components separately:

1. Windows 10/11.
2. Git.
3. Node.js 24.15.0 or newer within Node 24, or Node.js 26 or newer, plus npm 10 or newer. Node 25 is excluded by a pinned runtime dependency.
4. OpenCode CLI `1.18.5` or compatible newer release.
5. Windows Terminal.
6. Bun for plugin tests and development verification.
7. Access to the configured OpenAI models and any desired authentication providers.

Example OpenCode installation:

```powershell
npm install --global opencode-ai@1.18.5
```

Ensure `%APPDATA%\npm` is on the user `PATH` so `opencode` is available in PowerShell and Windows Terminal.

## Installation On Another PC

The safest layout is to clone this repository directly as the global config directory. Back up an existing config first; do not merge credentials or runtime state into this repository.

```powershell
$config = Join-Path $HOME ".config\opencode"
if (Test-Path $config) {
    Move-Item $config "$config.backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
}
git clone https://github.com/Mik477/opencode-global-ai-workflow.git $config
Set-Location $config
powershell -ExecutionPolicy Bypass -File .\scripts\install.ps1
```

Because the repository is private, authenticate Git first with Git Credential Manager or GitHub CLI.

The installer:

1. verifies `node`, `npm`, `opencode`, and Windows Terminal;
2. enforces the supported Node/npm versions, stages external destinations, and runs `npm ci --engine-strict` plus validation before moving them into place;
3. backs up the current-host PowerShell profile and Windows Terminal settings;
4. adds an idempotent managed `oai` block and merges only the portable `OpenCode` Terminal profile;
5. validates the resulting shell integration; and
6. restores both user files and removes a newly created destination if shell integration fails.

The installer discovers stable Store, Preview Store, and unpackaged Windows Terminal settings. If more than one is present, select one explicitly with `-TerminalSettingsPath`. It preserves unrelated JSONC comments, trailing commas, BOM state, and line endings while merging the owned profile node. It refuses to rewrite a signed PowerShell profile; install the snippet manually and re-sign that profile instead.

Use `-SkipShellIntegration` when only the OpenCode configuration is wanted:

```powershell
.\scripts\install.ps1 -SkipShellIntegration
```

The installer refuses to overwrite any existing destination when run from elsewhere. This is intentional protection for existing configuration. Use `-SkipTests` only when Bun is unavailable; TypeScript checks still run, but run the complete test suite later.

## Authentication

Authenticate providers on the destination PC using OpenCode and the configured authentication plugins. Never copy these files from another machine:

- `~/.local/share/opencode/auth.json`;
- `~/.local/share/opencode/opencode.db`;
- OpenCode Desktop cookies or application data; or
- any environment variable containing a server password or provider token.

The repository contains no credentials. GitHub access, OpenAI access, and optional Antigravity provider access are configured independently.

## Validation

Run the complete validation after installation or any workflow change:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\validate.ps1
```

Equivalent individual checks:

```powershell
npm run typecheck
npm test
opencode debug config
opencode debug agent build
opencode debug agent general
opencode debug agent explore
opencode debug skill
```

Validation confirms that normal agents expose compression and task tools, hide native todos and diagnostics, the diagnostics agent has only its three intended tools, required Superpowers skills resolve from this installation, and custom plugins load. It sets an isolated temporary `XDG_CONFIG_HOME`, disables project configuration, and points OpenCode directly at the candidate root so a working local global config cannot mask missing files. It does not authenticate providers or make a paid model request.

## First Run

OpenCode loads configuration only at process startup. Fully stop every OpenCode CLI and Desktop process after installation, then start a new session:

```powershell
oai C:\path\to\project
```

For a quick behavior check, give the agent a small multi-step implementation request. Confirm that it uses the hierarchical `task_*` tools, does not create a native Todo card, and proceeds without unnecessary method approvals.

## Updating

Pull tracked workflow changes and reinstall dependencies:

```powershell
Set-Location (Join-Path $HOME ".config\opencode")
git pull --ff-only
npm ci
.\scripts\validate.ps1
```

Package versions are intentionally pinned. Update them deliberately, regenerate `package-lock.json`, run all checks, and inspect `opencode debug config` before restarting.

### Upstream Dependency Advisories

At the initial publication, `npm audit` reports two low and five high transitive advisories in the pinned OpenTUI/Babel build-tool chain required by `@opencode-ai/plugin@1.18.5`. `npm audit fix --force` proposes incompatible downgrades of OpenCode/OpenTUI packages, so it is not applied automatically. Re-evaluate these advisories whenever OpenCode or OpenTUI is updated; do not dismiss them or force an incompatible fix merely to reduce the count.

## Security And Portability Boundaries

The repository excludes:

- `node_modules` and third-party source trees;
- provider credentials and authentication state;
- session databases, transcripts, tool output, and logs;
- project-specific task records;
- generated `.superpowers` runtime state;
- disabled OMO/background-agent remnants;
- orphaned plugins and old diagnostics implementations;
- local Codegraph binaries and absolute machine paths; and
- a user's full Windows Terminal settings.

Optional local integrations belong in ignored local files rather than tracked global configuration.

## Troubleshooting

### Old Workflow Still Appears

Opening a new chat inside an old OpenCode process does not reload configuration. Fully exit CLI and Desktop, confirm their processes are gone, restart, and create a new session.

### Native Todo Card Appears

Run `opencode debug agent build` and confirm `"todowrite": false`. A project-level `opencode.jsonc` can override global settings through deep merge.

### No Hierarchical Sidebar

The sidebar is CLI-only. Verify `tui.json`, restart the CLI, and press `Ctrl+X`, then `B`. Use `/progress` even when the sidebar is hidden.

### No DCP Message

DCP messages appear only after a successful model-invoked compression with an eligible closed range. Internal nudges are invisible, and a short session may not need compression. Verify `"compress": true` with `opencode debug agent build`.

### `oai` Is Unknown

Restart Windows Terminal so PowerShell reloads its profile. Then run:

```powershell
Get-Command oai
```

### Tab Title Does Not Change

Confirm the Terminal profile is named exactly `OpenCode`, has `suppressApplicationTitle` set to `false`, and `tui.json` loads `./plugins/terminal-title-clean`.

## Instructions For An AI Installer

An AI agent installing this workflow on a new PC should:

1. inspect the destination for existing OpenCode configuration and back it up rather than overwrite it;
2. verify the standard prerequisites instead of vendoring them;
3. clone this repository to `~/.config/opencode`;
4. run `scripts/install.ps1`;
5. authenticate providers without reading or transferring old credentials;
6. run `scripts/validate.ps1` and inspect failures;
7. fully restart OpenCode and Windows Terminal; and
8. perform a fresh-session behavior smoke test.

Do not copy task history, sessions, browser state, secrets, or machine-specific configuration from the source PC.
