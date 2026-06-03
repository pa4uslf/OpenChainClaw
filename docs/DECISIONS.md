# Decision Record

This document records durable product and engineering decisions for OpenChainClaw. Entries should be concise, public-safe, and focused on decisions that affect future implementation.

## ADR-001: Local-First Audit Logs

### Decision

Raw audit logs stay local by default. External proof systems receive hashes, indexes, timestamps, risk summaries, and approval summaries instead of raw private content.

### Reason

The product is about verifiable assistant behavior, not public disclosure of private task data.

### Impact

Proof design must preserve verifiability without exporting raw prompts, file contents, diffs, API bodies, tokens, private keys, cookies, or browser credentials.

## ADR-002: High-Risk Operations Pause Before Execution

### Decision

High-risk operations must pause before execution and require explicit user approval.

### Reason

Approval after execution does not protect the user from data exposure, paid calls, unwanted file mutation, or privileged external actions.

### Impact

The runtime needs a clear pending-operation state and must fail closed when approval cannot be obtained.

## ADR-003: File Mutation Requires Snapshot Support

### Decision

Supported file modifications must create a snapshot before mutation.

### Reason

Recoverability is a core trust feature. Users should be able to inspect and undo changes.

### Impact

Mutation should be blocked if snapshot creation fails. Rollback operations must also be auditable.

## ADR-004: Wallet Support Is Optional

### Decision

Wallet connection is an optional enhancement, not a requirement for local use.

### Reason

The core product value is transparent and recoverable assistant execution. Wallet flows should support proof and approval scenarios without blocking non-Web3 users.

### Impact

The local console and audit flow must work without wallet setup. Wallet failures must not break core local tasks.

## ADR-005: Mobile Messaging Is An External Control Plane

### Decision

Mobile messaging channels are notification-first and approval-limited. They are not trusted local consoles.

### Reason

Messaging platforms have different privacy, group, bot, and storage models. They should not become privileged execution surfaces by accident.

### Impact

Every messaging adapter needs a capability manifest, redaction policy, risk ceiling, and local-console fallback for privileged actions.

## ADR-006: Analytics Are Opt-In And Metadata-Only

### Decision

Analytics are disabled by default and may only capture safe metadata.

### Reason

Analytics should help improve the product without collecting private task content.

### Impact

New analytics events must use the wrapper in `src/analytics.ts`, update `docs/analytics.md`, and avoid raw prompts, content, paths, credentials, tokens, and private identifiers.

## ADR-007: Public Docs Exclude Private Planning Material

### Decision

Public documentation should describe product behavior, safety boundaries, user flows, and implementation requirements without including private business plans, sensitive research, credentials, customer information, unpublished financial assumptions, or local-only planning notes.

### Reason

OpenChainClaw should be understandable to contributors and users while keeping private strategy and sensitive operational material out of version control.

### Impact

Private planning documents must remain ignored. Public docs should summarize stable principles rather than copy local-only details.

## ADR-008: Verifiability Does Not Require Public Identity Graphs

### Decision

Future proof, reputation, or agent identity integrations should prefer policy proofs, selective disclosure, and non-linkable context identifiers over public task histories or globally linkable agent relationship graphs.

### Reason

Agent trust systems can make behavior verifiable, but public identity, feedback, delegation, and interaction records can expose user intent, business relationships, strategy signals, and sensitive operational patterns.

### Impact

OpenChainClaw should treat emerging trust-agent standards and research, including ERC-8004-style agent registries and anonymous credential approaches such as ACTA, as design inputs rather than implementation commitments. Any external proof backend must preserve the local-first audit source, avoid raw private data, and avoid making cross-context linkage the default.

References:

- [ERC-8004: Trustless Agents](https://eips.ethereum.org/EIPS/eip-8004)
- [Anonymous Credentials for Trustless Agents](https://ethresear.ch/t/anonymous-credentials-for-trustless-agents-acta/24797)
