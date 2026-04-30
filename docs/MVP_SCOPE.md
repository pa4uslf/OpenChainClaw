# MVP Scope

This document defines the minimum useful product boundary for OpenChainClaw. It focuses on the public product scope and avoids private planning details.

## MVP Goal

The MVP should let a personal user run local assistant tasks and verify the critical action trail.

A usable MVP must answer these questions:

- What did the assistant read, change, visit, call, or request?
- Which operations were risky, blocked, approved, or rejected?
- What files changed, and can they be restored?
- Do the local audit hash and proof record match?
- Did raw private data stay out of external records and analytics?

## Must Have

### Local Task Console

- create a task;
- show task status;
- show a timeline of key operations;
- show pending approvals;
- show audit reports;
- expose rollback actions for supported file changes.

### Assistant Runtime

- execute at least one real local file task;
- execute at least one real web task;
- execute at least one real external API task;
- record purpose summaries for important operations;
- preserve a clear state model for pending, blocked, failed, approved, rejected, rolled back, and completed states.

### File Safety

- block hidden or sensitive files by default;
- require explicit authorization for configured directories;
- create snapshots before mutation;
- show text diffs when possible;
- validate rollback inputs;
- record rollback actions in the audit trail.

### Web And API Safety

- record target URLs and API service names;
- maintain an allowlist for low-risk targets;
- pause non-allowlisted or sensitive outbound actions for approval;
- redact request metadata before audit, analytics, or proof export;
- mark paid or privileged API calls before execution.

### Audit And Proof

- maintain structured task events;
- generate deterministic local audit hashes;
- write local verifiable records;
- compare local records with proof metadata;
- keep raw prompts, file contents, diffs, API bodies, tokens, private keys, cookies, and browser credentials out of external proof records.

### Analytics Privacy

- analytics must remain opt-in;
- analytics events must use safe metadata only;
- raw prompts, content, paths, credentials, and identifiers must not be sent.

## Should Have

- guided first-run setup;
- authorized directory management;
- website allowlist management;
- user preferences for default risk behavior;
- audit search by task, risk level, operation type, path, URL, or API service;
- report export to Markdown or JSON;
- failure and retry states for proof submission;
- wallet connection as an optional proof or approval enhancement.

## Could Have Later

- richer browser automation adapters;
- mobile messaging status notifications;
- limited mobile approval summaries;
- optional companion app;
- additional proof backends;
- plugin or connector SDK;
- team workflows;
- enterprise compliance reports.

## Not In The MVP

- automatic execution of privileged actions without local review;
- raw private data on-chain or in externally verifiable records;
- reading wallet private keys or seed phrases;
- treating mobile messaging channels as trusted local consoles;
- group chat control by default;
- full enterprise access control;
- multi-agent governance;
- public publishing of private task histories;
- broad background automation before approval, rollback, and audit behavior are stable.

## Release Boundary

The MVP should not be considered ready until:

- high-risk operations pause before execution;
- blocked operations fail closed;
- file mutation has a recovery path;
- audit events are structured and searchable enough for user review;
- proof records are verifiable without exposing raw private content;
- analytics privacy tests cover the current event catalog;
- documentation explains safety defaults, user flows, and known limitations.
