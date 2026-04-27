# Repository Guidelines

## Project Structure & Module Organization

OpenChainClaw is a no-dependency Node.js 20 local prototype. Runtime code lives in `src/`: `server.js` serves the local console and API, `runtime.js` coordinates task execution and audit records, and helper modules cover risk checks, hashing, diffs, and storage. Browser assets live in `public/`. Tests are in `test/` and currently focus on runtime behavior. Architecture docs and generated diagrams live in `docs/`; update `docs/architecture.mmd` before regenerating diagram assets. Local runtime output is written to `.openchainclaw/` and `data/`, both ignored by git.

## Build, Test, and Development Commands

- `npm test`: runs the Node built-in test suite with `node --test`.
- `npm start`: starts the local console at `http://127.0.0.1:4173`.
- `HOST=127.0.0.1 PORT=4174 npm start`: starts on a custom host or port.
- `OPENCHAINCLAW_DATA_DIR=/tmp/occ-data OPENCHAINCLAW_WORKSPACE_DIR=/tmp/occ-work npm start`: runs with isolated local data for manual testing.

## Coding Style & Naming Conventions

Use CommonJS modules, two-space indentation, semicolons, and double quotes, matching the existing `src/` style. Prefer small, explicit async functions over broad abstractions. Keep public API payload fields in snake_case when they represent audit records or UI-facing task data, for example `task_id`, `risk_level`, and `local_log_hash`. Use camelCase for internal JavaScript variables and functions.

## Testing Guidelines

Use `node:test` and `node:assert/strict`; do not add a test framework unless the project actually needs it. Put new tests under `test/` with `*.test.js` naming. Tests should create temporary data with `fs.mkdtemp()` and avoid writing into the repository root. Cover security-sensitive flows such as blocked file reads, high-risk approval pauses, snapshots, rollback, and ledger hash refreshes.

## Commit & Pull Request Guidelines

Recent history uses short imperative subjects, often with a conventional prefix such as `docs:` or `chore:`. Follow that style: `docs: clarify safety defaults`, `chore: ignore local runtime output`. Pull requests should include a concise behavior summary, commands run, linked issues if any, and screenshots or short recordings for visible console changes.

## Security & Configuration Tips

Do not commit `.env`, private keys, `.openchainclaw/`, `data/`, snapshots, audit logs, or local-only planning docs. Raw audit logs stay local by default; verifiable records should contain hashes, indexes, timestamps, and risk summaries rather than private raw content.
