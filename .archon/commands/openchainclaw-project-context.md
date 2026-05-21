---
description: Load OpenChainClaw repository context and write a workflow handoff artifact.
argument-hint: <task, issue, or plan path>
---

# OpenChainClaw Project Context

**Input**: $ARGUMENTS
**Workflow ID**: $WORKFLOW_ID

---

## Mission

Prepare an accurate project context artifact for later Archon nodes. Do not edit source files in this command.

Write the result to:

```text
$ARTIFACTS_DIR/openchainclaw-context.md
```

## Phase 1: Load Canonical Context

Read these files when present:

```bash
cat AGENTS.md
cat README.md
cat package.json
cat docs/PROJECT_BLUEPRINT.md
cat docs/MVP_SCOPE.md
cat docs/USER_FLOWS.md
cat docs/DECISIONS.md
cat docs/SECURITY_MODEL.md
cat docs/analytics.md
```

Treat these as private/local-only if present. Do not quote or expose them in PR bodies unless the user explicitly asks and the file is already tracked:

```text
docs/PRD.md
docs/ROADMAP*.md
docs/TODO*.md
docs/TECH_STACK_DECISION.md
docs/MIGRATION_CHECKLIST.md
docs/posthog_node.md
docs/private/
docs/local/
docs/research-private/
```

## Phase 2: Extract Working Rules

Capture these project facts:

- Runtime: TypeScript ESM on Node.js 22 with pnpm.
- Server entry: `src/server.ts`.
- Runtime core: `src/runtime.ts`.
- Analytics wrapper: `src/analytics.ts`; do not instantiate PostHog elsewhere.
- Frontend: plain `public/index.html`, `public/app.js`, and `public/styles.css`.
- Tests: `node:test` under `test/`.
- Local runtime outputs: `.openchainclaw/` and `data/`; never commit them.
- Secrets: `.env`, PostHog keys, raw prompts, file content, API bodies, private keys, and browser credentials must not be committed or sent to analytics.

Validation commands:

```bash
pnpm typecheck
pnpm test
```

## Phase 3: Write Artifact

Write a concise artifact with these sections:

- Task input
- Product and architecture summary
- Files and directories likely relevant
- Safety and privacy boundaries
- Validation commands
- Private/local-only docs that must stay out of commits and PR bodies
- Open questions or blockers, if any

**PHASE_3_CHECKPOINT:**

- [ ] Context artifact written to `$ARTIFACTS_DIR/openchainclaw-context.md`
- [ ] Private planning docs are listed only as boundaries
- [ ] Validation commands are explicit
