# Mobile IM Control Safety Model

OpenChainClaw may later support mobile control through messaging channels such as Telegram, Signal, Discord, Slack, WeChat, Feishu, or similar user-approved surfaces. These channels must be treated as external control planes, not as trusted local consoles.

## Why This Exists

Messaging apps are convenient, but their privacy and bot permission models differ from a local console. Telegram is the clearest example:

- Telegram's FAQ distinguishes Secret Chats from Cloud Chats. Secret Chats use end-to-end encryption, while Cloud Chats are stored in Telegram Cloud.
- Telegram bot privacy mode limits what a bot sees in groups by default, but bot admins and bots with privacy mode disabled can receive broader message input.

Sources:

- Telegram FAQ: https://telegram.org/faq/
- Telegram Bot Features: https://core.telegram.org/bots/features

These facts do not make Telegram unusable. They mean OpenChainClaw must not treat a Telegram bot, or any similar IM adapter, as a private local runtime boundary.

## Product Rule

Mobile IM control is notification-first and approval-limited.

Allowed:

- task status notifications;
- short commands such as `status`, `pause`, `reject`, or `approve op_123`;
- high-risk operation summaries that omit raw sensitive content;
- links or prompts that send the user back to the local console for full review;
- adapter health checks and binding status.

Not allowed by default:

- sending raw prompts, model responses, file contents, diffs, API bodies, extracted webpage content, emails, calendar details, or browser credentials through an IM channel;
- executing high-risk file, API, browser, wallet, payment, or MCP operations solely because an IM message requested it;
- treating group chat messages as trusted instructions;
- storing bot tokens, webhook secrets, or chat identifiers in audit records, proof records, analytics events, or exported reports.

## Runtime Requirements

Every IM adapter must have an explicit capability manifest before it can execute anything:

- supported channels;
- allowed commands;
- allowed operation types;
- whether the channel can initiate tasks, only approve summaries, or only receive status;
- max risk level allowed from the channel;
- whether group chats are disabled, read-only, or explicitly supported;
- redaction policy for outbound messages;
- local-console fallback for high-risk operations.

The safe default is:

```text
channel_can_start_tasks = demo_or_low_risk_only
channel_can_approve = summary_only
channel_can_execute_high_risk = false
raw_content_over_channel = false
group_chat_control = disabled
local_console_required_for_privileged_actions = true
```

## Audit And Proof Rules

IM events may enter the local audit log as control-plane events. They should record:

- channel type;
- stable local channel binding ID;
- task ID;
- operation ID;
- command category;
- risk level;
- decision status;
- redacted message hash when useful.

They must not record raw chat content, phone numbers, usernames, chat titles, message URLs, bot tokens, webhook secrets, raw task data, raw file content, raw diffs, API bodies, cookies, browser credentials, private keys, or wallet seed material.

Proof records and on-chain or externally verifiable records must remain even narrower: hashes, indexes, timestamps, risk summaries, and approval summaries only.

## Acceptance Criteria

Before any mobile IM adapter ships:

- high-risk operations still require explicit approval and cannot execute solely from an untrusted message;
- local console review is required for privileged operations involving files, APIs, browser credentials, wallets, payments, calendar/email scopes, or high-permission MCP tools;
- outbound IM messages never contain raw sensitive content;
- analytics events never include raw mobile messages or user identifiers;
- local audit records include enough metadata to explain what happened without storing private chat content;
- tests cover redaction, blocked raw-content sends, group-chat restrictions, approval replay prevention, and analytics sanitization.
