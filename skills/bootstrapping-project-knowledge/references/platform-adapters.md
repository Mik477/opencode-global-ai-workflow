# Platform Adapters

## Portable Core

The canonical knowledge system uses plain repository files, relative paths, and documented commands. Agent Skills package procedures; they do not become the project knowledge store.

Use standard Agent Skills fields only in the portable core. Keep client-specific hooks, tool names, permissions, and installation paths in adapters.

## Shared Routing

Prefer one canonical routing map, commonly `AGENTS.md`, with thin client adapters. Do not maintain several handwritten copies of the same policy.

The root map should remain short enough for every session and answer:

- where canonical knowledge lives;
- how to search and inspect it;
- where scoped rules apply;
- how current versus historical guidance is filtered;
- how to validate changes;
- what content is untrusted or derived.

## Codex

Codex discovers `AGENTS.md` from global scope and repository root toward the current directory, with nearer files later in context. Keep root guidance broad and subtree guidance local. Do not fill the combined instruction limit simply because it exists.

Repository Agent Skills can live under `.agents/skills/` where supported. Verify discovery in a clean session.

## Claude Code

Claude Code uses `CLAUDE.md`, nested files, rules, Skills, auto memory, hooks, subagents, and MCP. Import or point to the shared canonical map instead of duplicating it. On Windows prefer supported imports over symlink assumptions.

Keep `CLAUDE.md` concise and team-authored. Treat auto memory as local episodic learning, not shared canonical truth. Hooks can report staleness or enforce protected paths but require separate security review.

## OpenCode

Register the project or global `skills/` directory through the configured skill path. Keep the root instruction file explicit. Validate with isolated configuration and `opencode debug skill`; fully restart OpenCode after config-time file changes.

## Cursor, Copilot, Continue, And Other Clients

Use narrowly scoped native rules only where loading semantics require them. Generate adapters from canonical sources when deterministic generation is simpler than supported imports. Mark generated adapters and validate source hashes.

Model-selected rules can miss. Always-on rules can bloat context. Benchmark the actual client and make selected/omitted context observable where possible.

## Windows And POSIX

- Store metadata paths as repository-relative `/` paths.
- Render commands with native separators only at execution boundaries.
- Avoid case-colliding names and symlink-dependent installation.
- Detect runtimes before executing optional scripts.
- Provide instruction-only fallbacks when a helper runtime is absent.
- Use UTF-8 and a declared line-ending policy.
- Verify resolved paths remain under the repository on case-insensitive and case-sensitive filesystems.

## Cross-Platform Verification

At minimum test:

- native skill discovery;
- root and scoped instruction precedence;
- clean-session trigger precision;
- missing helper/runtime fallback;
- Windows and POSIX path handling;
- no secret or home-directory capture;
- equivalent knowledge selection across intended clients;
- restart/reload requirements.

Agent Skills standardizes package contents, not universal discovery directories, hooks, permissions, or runtime behavior.
