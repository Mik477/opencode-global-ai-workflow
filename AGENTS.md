# Repository Instructions

This repository is the portable source of a global OpenCode workflow. Keep it safe to clone into another user's configuration directory.

- Never add credentials, provider tokens, session databases, task history, tool output, local browser data, or `.env` files.
- Do not commit `node_modules`; update `package.json` and regenerate `package-lock.json` with `npm install`.
- Keep machine paths out of tracked configuration. Put optional local integrations in an ignored local overlay.
- Preserve the distinction between custom source in `plugins/` and `skills/`, tracked focused overrides in `overrides/`, and third-party packages installed from pinned dependencies.
- Keep Windows Terminal changes limited to the portable OpenCode profile fragment. Do not copy a user's full `settings.json`.
- Run `npm run typecheck`, `npm test`, `opencode debug config`, and `scripts/validate.ps1` after workflow changes.
- Do not commit, push, publish, or change repository visibility unless explicitly requested.
