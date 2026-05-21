---
description: Build an implementation brief that constrains OpenChainClaw work before coding.
argument-hint: <task, issue, or plan path>
---

# OpenChainClaw Implementation Brief

**Input**: $ARGUMENTS
**Workflow ID**: $WORKFLOW_ID

---

## Mission

Create an implementation brief that later coding nodes can execute without rediscovering the project rules.

Read:

```bash
cat $ARTIFACTS_DIR/openchainclaw-context.md
```

If `$ARGUMENTS` is a readable local file, read it too. If it is a GitHub issue reference, fetch it with `gh issue view`.

## Required Brief Sections

Write to:

```text
$ARTIFACTS_DIR/openchainclaw-implementation-brief.md
```

Also write the same implementation-ready content to:

```text
$ARTIFACTS_DIR/plan.md
```

`$ARTIFACTS_DIR/plan.md` is the canonical input consumed by Archon's bundled `archon-plan-setup` command.

Include:

- Summary of the requested change
- In-scope behavior
- Out-of-scope behavior
- Expected files to modify
- Security and privacy constraints
- Analytics impact, including whether `docs/analytics.md` or analytics tests need updates
- Validation plan using `pnpm typecheck` and `pnpm test`
- PR notes, including any screenshots/manual verification needed for visible console changes

## Guardrails

- Keep raw audit logs local-first.
- Do not add a second PostHog client; use `src/analytics.ts`.
- Do not commit local runtime output, `.env`, `.posthog-events.json`, private planning docs, or generated `dist/`.
- Do not migrate the frontend to React or Next.js as part of incidental UI work.
- Do not broaden wallet, mobile IM, real browser automation, or public-chain proof scope unless the task explicitly asks for it.

**CHECKPOINT:**

- [ ] Brief is written
- [ ] `$ARTIFACTS_DIR/plan.md` is written
- [ ] Scope limits are explicit
- [ ] Validation commands are executable
