# Repository Guidelines

## Project Structure & Module Organization

OpenChainClaw is a TypeScript/ESM Node.js 22 local prototype. Runtime code lives in `src/`: `server.ts` serves the local console and API, `runtime.ts` coordinates task execution and audit records, `analytics.ts` wraps optional PostHog capture, and helper modules cover risk checks, hashing, diffs, and storage. Browser assets live in `public/` and are still plain HTML/CSS/JS until the later Vite migration. Tests are in `test/` and currently focus on runtime and analytics behavior. Architecture docs and generated diagrams live in `docs/`; update `docs/architecture.mmd` before regenerating diagram assets. Local runtime output is written to `.openchainclaw/` and `data/`, both ignored by git.

## Build, Test, and Development Commands

- `pnpm install`: installs dependencies and uses `pnpm-lock.yaml`.
- `pnpm typecheck`: runs `tsc --noEmit`.
- `pnpm test`: builds TypeScript and runs the Node built-in test suite against `dist/test/*.test.js`.
- `pnpm start`: builds TypeScript and starts the local console at `http://127.0.0.1:4173`.
- `HOST=127.0.0.1 PORT=4174 pnpm start`: starts on a custom host or port.
- `OPENCHAINCLAW_DATA_DIR=/tmp/occ-data OPENCHAINCLAW_WORKSPACE_DIR=/tmp/occ-work pnpm start`: runs with isolated local data for manual testing.
`pnpm start` reads `.env` automatically when present via Node's `--env-file-if-exists=.env`.

## Archon Workflow Integration

Use repo-local Archon workflows for longer, PR-shaped work. `.archon/config.yaml` sets `master` as the base branch, keeps bundled Archon defaults enabled, and uses Codex as the project assistant. `openchainclaw-validate` is the pre-commit/pre-PR gate; `openchainclaw-plan-to-pr` is for executing an existing plan or issue through implementation, validation, privacy checks, and PR finalization. Keep quick documentation edits and one-line fixes in the normal Codex flow unless the user asks for Archon.

## Coding Style & Naming Conventions

Use TypeScript ESM modules, two-space indentation, semicolons, and double quotes, matching the existing `src/` style. Keep strict compiler settings enabled in `tsconfig.json`. Prefer small, explicit async functions over broad abstractions. Keep public API payload fields in snake_case when they represent audit records or UI-facing task data, for example `task_id`, `risk_level`, and `local_log_hash`. Use camelCase for internal TypeScript variables and functions.

## Testing Guidelines

Use `node:test` and `node:assert/strict`; do not add a test framework unless the project actually needs it. Put new tests under `test/` with `*.test.ts` naming. Tests should create temporary data with `fs.mkdtemp()` and avoid writing into the repository root. Cover security-sensitive flows such as blocked file reads, high-risk approval pauses, snapshots, rollback, ledger hash refreshes, and analytics privacy defaults.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects, often with a conventional prefix such as `docs:` or `chore:`. Follow that style: `docs: clarify safety defaults`, `chore: ignore local runtime output`. Pull requests should include a concise behavior summary, commands run, linked issues if any, and screenshots or short recordings for visible console changes.

## Security & Configuration Tips

Do not commit `.env`, private keys, `.openchainclaw/`, `data/`, snapshots, audit logs, PostHog project keys, `.claude/`, or local-only planning docs. Raw audit logs stay local by default; verifiable records should contain hashes, indexes, timestamps, and risk summaries rather than private raw content. PostHog integration must stay opt-in via `POSTHOG_PROJECT_API_KEY` and must not send raw prompts, file content, API bodies, tokens, private keys, or browser credentials.

When changing user flows or adding product behavior that should be observable, actively consider whether a PostHog event is useful. If adding or changing analytics, use the wrapper in `src/analytics.ts` instead of calling the PostHog client directly, keep event properties to safe metadata, update `docs/analytics.md`, and add or adjust analytics privacy tests. Before commit or push, verify `.env`, `.posthog-events.json`, local runtime data, and local-only planning docs remain ignored and unstaged.
