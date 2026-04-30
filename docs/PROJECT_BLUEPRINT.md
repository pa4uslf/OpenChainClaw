# OpenChainClaw Project Blueprint

OpenChainClaw is a local-first assistant prototype for users who want AI task execution to be transparent, interruptible, and independently verifiable.

The project treats auditability as the product foundation. The runtime should not only complete tasks; it should also explain what it did, why an operation was considered risky, what changed, and how the user can verify or recover from that change.

## Current Stage

OpenChainClaw is in the `V0.1` local prototype stage.

The current prototype validates the basic loop:

1. create a task from the local console;
2. execute a deterministic demo flow;
3. record file, web, API, approval, rollback, and proof events;
4. pause high-risk operations for user approval;
5. create a snapshot before file modification;
6. show diffs and support rollback;
7. generate local audit hashes and local ledger records.

The next stage is to replace deterministic demo execution with a minimal real assistant loop while keeping the same safety and audit boundaries.

## Product Thesis

Personal AI assistants become more useful as they gain access to local files, browsers, APIs, and automation surfaces. Those same capabilities increase the cost of opaque execution.

OpenChainClaw tests this thesis:

> Users will trust an assistant more when critical actions are visible, recoverable, and verifiable.

This means the product should optimize for:

- clear task timelines;
- pre-execution approval for high-risk actions;
- local-first audit logs;
- recoverable file changes;
- verifiable proof records that avoid raw private data;
- optional wallet and external proof integrations, not mandatory Web3 onboarding.

## Capability Layers

### 1. Local Console

The console is the user's review and control surface. It should show tasks, timelines, pending approvals, diffs, rollback actions, audit reports, and proof status.

### 2. Local Runtime

The runtime executes file, web, API, and later assistant-planning actions. It owns risk classification, snapshot creation, audit event writing, and proof record generation.

### 3. Audit Log

The audit log records what happened in a task. It should preserve enough structure to support timeline replay, report generation, search, and hash verification.

### 4. Recovery Layer

File-changing actions must create snapshots before mutation. Users should be able to inspect diffs and recover from incorrect edits.

### 5. Proof Layer

Proof records should make audit records independently checkable without publishing raw private content. They should store hashes, indexes, timestamps, risk summaries, and approval summaries.

### 6. External Control Surfaces

Mobile messaging, wallet signing, browser automation, external APIs, and high-permission tools are treated as external or privileged surfaces. Each must declare what it can do, what it cannot do, and how it is audited.

## Non-Goals For The Current Prototype

OpenChainClaw is not currently trying to be:

- a full enterprise agent platform;
- a complete CRM or task management product;
- a general-purpose wallet product;
- a public-chain data publishing system;
- a multi-user governance system;
- a background automation daemon that executes privileged tasks without review.

These directions may be explored later only if they preserve local-first auditability and explicit user control.

## Development Principles

- Keep raw sensitive data local by default.
- Make high-risk operations explicit before execution.
- Prefer recoverable changes over silent mutation.
- Store proof metadata, not private raw content.
- Make wallet and remote integrations optional.
- Add integrations only after their audit and rollback behavior is clear.
- Keep public documentation free of private planning details, credentials, customer names, and unpublished business assumptions.

## Primary Risks

- The audit trail becomes too noisy for users to understand.
- Proof records become decorative rather than useful for verification.
- External control surfaces accidentally become privileged execution channels.
- Local logs or analytics events leak private content.
- Product scope expands before the core local runtime is trustworthy.
- Recovery paths are incomplete for file mutations or failed external operations.

## Success Signals

The project is moving in the right direction when:

- users can explain what the assistant did after a task finishes;
- users can approve or reject risky actions before they happen;
- users can recover from file modifications;
- audit logs can be verified against hashes or proof records;
- privacy-sensitive content stays out of analytics, proof records, and public docs;
- early users choose the product because transparency changes their trust level.
