# User Flows

This document describes core user flows that OpenChainClaw should support. It is written as a product and verification reference, not as an implementation spec.

## 1. Create And Review A Task

### Goal

The user starts a local assistant task and can follow what the assistant is doing.

### Main Flow

1. The user opens the local console.
2. The user enters a task prompt.
3. The console creates a task.
4. The runtime starts execution.
5. The timeline records key operations.
6. The user reviews status, risk level, and audit events.

### Acceptance Criteria

- The task has a stable `task_id`.
- The timeline updates with operation summaries.
- The user can distinguish completed, pending, blocked, failed, and waiting-for-approval states.
- Raw private content is not sent to analytics or proof records.

## 2. Review A High-Risk Operation

### Goal

The assistant pauses before executing a risky action and waits for user intent.

### Main Flow

1. The runtime detects a high-risk action.
2. The runtime records a risk review event.
3. The console displays a summary of the pending operation.
4. The user approves or rejects the operation.
5. The runtime records the decision.
6. Approved operations resume; rejected operations stop or move to a safe fallback.

### Acceptance Criteria

- The risky operation does not execute before approval.
- The approval summary is understandable without exposing unnecessary raw content.
- Rejection is recorded as a first-class outcome.
- Approval or rejection is included in the audit trail.

## 3. Inspect And Roll Back A File Change

### Goal

The user can understand a file modification and recover from it.

### Main Flow

1. The runtime prepares to modify a file.
2. The runtime creates a snapshot.
3. The runtime applies the modification.
4. The console displays the changed file and diff when possible.
5. The user requests rollback.
6. The runtime restores the snapshot.
7. The rollback is recorded in the timeline.

### Acceptance Criteria

- Mutation is blocked if snapshot creation fails.
- Text diffs are visible for supported files.
- Rollback checks the target operation and snapshot.
- The audit trail shows both the original modification and rollback.

## 4. Verify An Audit Record

### Goal

The user can check whether local audit records still match their proof metadata.

### Main Flow

1. The task finishes or reaches a proof-ready state.
2. The runtime calculates an audit hash.
3. The runtime writes a local verifiable record.
4. The console shows the local audit hash and proof record status.
5. The user compares local records with proof metadata.

### Acceptance Criteria

- Proof records do not contain raw prompts, file content, diffs, API bodies, credentials, or browser session material.
- Hash recomputation can detect local record changes.
- Proof status is explicit: local-only, queued, submitted, matched, mismatched, failed, or retrying.
- Future external proof backends can prove policy compliance without exposing public task histories, raw credentials, or globally linkable relationship graphs.

## 5. Configure First-Run Safety

### Goal

The user chooses default safety boundaries before trusting the assistant with real tasks.

### Main Flow

1. The console opens a guided setup.
2. The user selects a workspace or authorized directories.
3. The user reviews hidden-file and sensitive-file protection.
4. The user configures website allowlists.
5. The user chooses default confirmation behavior.
6. The user decides whether to enable optional wallet or mobile control later.
7. The setup choices are written to preferences and audit records.

### Acceptance Criteria

- The user can skip optional integrations.
- Defaults are safe when the user is unsure.
- Preference changes are auditable.
- The setup does not require a wallet or mobile channel.

## 6. Use A Mobile Messaging Channel Later

### Goal

The user can receive status or limited approval summaries without turning a messaging app into a trusted runtime.

### Main Flow

1. The user explicitly enables a messaging adapter.
2. The adapter declares its capability manifest.
3. The channel receives safe status notifications.
4. The user may send limited commands such as status, pause, reject, or approve a summarized operation.
5. Privileged file, API, browser, wallet, payment, email, calendar, or high-permission tool actions require local-console review.

### Acceptance Criteria

- Raw task content, file content, diffs, API bodies, extracted webpage content, chat content, tokens, and credentials are not sent through the messaging channel.
- Group chat control is disabled by default.
- Approval replay is prevented.
- The local console remains the review surface for privileged actions.
