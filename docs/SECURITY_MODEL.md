# Security Model

OpenChainClaw's security model is based on local-first execution, explicit approval for risky actions, recoverable file changes, and narrow proof records.

This document is the public safety overview. More specific rules are documented in:

- [Analytics](analytics.md)
- [Mobile IM Control Safety Model](mobile-im-control.md)

## Trust Boundaries

### Local Console

The local console is the primary review surface. It may show task timelines, diffs, pending approvals, local audit records, and proof status.

### Local Runtime

The runtime performs local execution and owns risk checks, snapshots, audit event writing, rollback, and proof record generation.

### External Services

External services include websites, APIs, analytics providers, proof backends, wallets, messaging platforms, and future tool connectors. They must receive only the minimum safe data required for the specific integration.

### Proof Records

Proof records are verification metadata. They must not become a second copy of private task data.

## Default Protections

- Raw audit logs stay local by default.
- Hidden files and likely sensitive files are blocked by default.
- High-risk actions pause before execution.
- File modification requires a snapshot first.
- Rollback actions are audited.
- Analytics are disabled unless configured.
- Wallet connection is optional.
- Mobile messaging channels are external control surfaces, not trusted consoles.

## Sensitive Data Classes

The following data must not be written to public docs, analytics events, proof records, or exported reports unless explicitly redacted and justified:

- raw prompts and model messages;
- file contents and raw diffs;
- API request and response bodies;
- local absolute paths when a stable ID or hash is enough;
- tokens, passwords, private keys, seed phrases, cookies, and authorization headers;
- browser credentials and session data;
- wallet private material;
- mobile chat content, usernames, phone numbers, chat titles, message links, bot tokens, and webhook secrets;
- private customer, user, vendor, financial, pricing, or business strategy material.

## Risk Levels

The implementation may evolve, but the product should preserve these behavioral categories:

| Category | Expected Behavior |
| --- | --- |
| Low risk | Execute and record safe metadata. |
| Medium risk | Execute only when configured policy allows it; record context and purpose. |
| High risk | Pause before execution and require explicit approval. |
| Blocked | Do not execute; record the reason. |

## High-Risk Examples

- reading outside authorized directories;
- reading hidden files or likely secret files;
- modifying files without snapshot support;
- uploading local content to third-party services;
- calling paid or privileged APIs;
- sending raw content through messaging channels;
- using browser credentials or cookies;
- requesting wallet signatures without a clear summary;
- executing high-permission tool or MCP actions.

## Proof And Verification Rules

Proof records may include:

- task or operation identifiers;
- event indexes;
- timestamps;
- audit hashes;
- risk summaries;
- approval summaries;
- status flags.

Proof records must not include:

- raw prompts;
- file content;
- raw diffs;
- API bodies;
- webpage extraction content;
- credentials;
- private keys;
- cookies;
- browser session material;
- mobile chat content.

## Analytics Rules

Analytics events may describe product behavior using safe metadata such as IDs, statuses, counts, lengths, coarse categories, and risk levels.

Analytics events must not contain user content, raw local paths, secrets, credentials, message content, or externally identifying private information.

## Documentation Rules

Public documentation should be safe to publish. Keep private planning files, customer information, unpublished strategy, local research, credentials, screenshots with sensitive data, and local audit exports out of git.

When a public document needs to describe a private-sensitive workflow, describe the boundary and expected behavior instead of copying raw examples.
