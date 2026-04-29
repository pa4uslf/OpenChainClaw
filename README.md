# OpenChainClaw

**Languages:** English | [简体中文](README.zh-CN.md)

OpenChainClaw is a local-first, verifiable, and recoverable personal AI assistant prototype. The project does not start by chasing stronger autonomous execution. It first tests whether users will choose an assistant because its actions are transparent, interruptible, and independently verifiable.

## Product Positioning

- The local web console creates tasks, shows timelines, handles risk approvals, and displays audit reports.
- The local runtime handles file operations, web visits, API calls, risk checks, snapshots, rollback, and local proof records.
- Raw audit logs stay local by default.
- Verifiable records store only hashes, indexes, timestamps, and risk summaries, not private raw data.
- Wallet support is optional. It is not required for core local use.

## Current Status

The repository is at the `V0.1` local prototype stage. It includes a local console, a deterministic demo runtime, a TypeScript/ESM Node runtime, and optional server-side PostHog event capture.

Completed capabilities:

- create a task from the local console;
- record file read, file modify, risk review, user approval, web visit, API call, and local proof events;
- block hidden and sensitive file reads by default;
- pause non-whitelisted web visits for high-risk approval;
- create a snapshot before file modification;
- show file diffs and support rollback;
- generate deterministic local audit hashes;
- write local verifiable ledger records.

Next areas under exploration:

- real model planning and execution loop;
- real browser automation and webpage extraction;
- real external API execution;
- mobile control surfaces through trusted messaging channels;
- optional wallet connection and signature approval;
- verifiable proof submission.

## Architecture

![OpenChainClaw architecture](docs/assets/architecture.png)

Architecture sources:

- [Mermaid](docs/architecture.mmd)
- [SVG](docs/assets/architecture.svg)

## Quickstart

Requirements:

- `Node.js 22.22.0` or newer;
- `pnpm 10.x`.

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm start
```

Then open:

```text
http://127.0.0.1:4173
```

Local audit data is written to `.openchainclaw/`. The demo workspace is written to `data/workspace/`. Both directories are ignored by git.

## Optional PostHog Analytics

Server-side analytics are disabled by default. To enable them, set environment variables before starting the local console:

```bash
POSTHOG_PROJECT_API_KEY=phc_xxx POSTHOG_HOST=https://us.i.posthog.com pnpm start
```

`pnpm start` also reads `.env` automatically when the file exists. You can copy `.env.example` and set either `POSTHOG_PROJECT_API_KEY` or `POSTHOG_PROJECT_TOKEN`.

Captured events currently cover demo task creation, demo task start, high-risk approval or rejection, file rollback completion, and server exceptions. Event properties use IDs, statuses, counts, and safe metadata only; raw prompts, file content, API request bodies, tokens, private keys, and browser credentials are not sent.

## Prototype Walkthrough

After starting the local console, use the default task to try the current prototype:

1. create a demo task;
2. inspect file read, file modify, risk review, and proof events in the task timeline;
3. approve or reject a high-risk non-allowlisted web visit;
4. inspect the file diff;
5. roll back the file change;
6. review the local audit hash and local ledger record after completion.

This walkthrough validates transparent audit trails, risk blocking, snapshots, rollback, and local proofs. It does not mean real model calls, real browser automation, or public-chain submission are already integrated.

## Security Defaults

- Raw audit logs stay on the local machine by default.
- Hidden files and likely sensitive files are blocked by default.
- Non-allowlisted web visits pause for high-risk approval.
- File modification must create a snapshot first.
- Rollback actions are also recorded in the audit trail.
- Verifiable records store only hashes, indexes, timestamps, and risk summaries.
- Raw file content, API request bodies, tokens, private keys, and browser credentials are not written on-chain.

## Project Roadmap

| Phase | Status | Public Goal |
| --- | --- | --- |
| `V0.1` Local Prototype | Done | Validate task timelines, risk blocking, file snapshots, rollback, and local ledger proofs. |
| `V0.2` Minimum Runtime Core | Next | Add a real minimal assistant loop, guided local setup, authorized directories, site allowlists, preferences, web adapters, and API adapters. |
| `V0.3` Verifiable Proof Loop | Planned | Add the proof queue, optional wallet connection, signature summaries, and local record comparison. |
| `V0.4` Early Trial Release | Planned | Improve task history, audit search, report export, early trial flow, and mobile control experiments through trusted messaging channels. |
| `V1.0` Minimum Viable Product | Target | Let personal users complete file, web, API, and mobile-initiated tasks while verifying the critical action trail. |

## Future Expansion

OpenChainClaw starts with a local console and a small trusted runtime. As the audit model matures, future versions may expand into:

- mobile control through messaging channels such as Telegram, Signal, Discord, Slack, or other user-approved IM surfaces;
- guided setup for safer first-run configuration;
- additional tool connectors for developer workflows and personal knowledge bases;
- richer proof backends and verification explorers;
- optional companion apps when the local console experience is stable.

These extensions should preserve the same safety defaults: local-first logs, explicit approval for high-risk actions, recoverable file changes, and no raw private data on-chain.

## License

[MIT](LICENSE)
