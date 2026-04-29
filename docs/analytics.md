# Analytics

OpenChainClaw uses PostHog only for optional server-side product analytics. Analytics are disabled unless the local environment provides a PostHog project token.

## Setup

Create a local `.env` file, then start the server normally:

```env
POSTHOG_PROJECT_API_KEY=phc_your_project_token
POSTHOG_HOST=https://us.i.posthog.com
POSTHOG_DISTINCT_ID=openchainclaw-local-runtime
```

```bash
pnpm start
```

`POSTHOG_PROJECT_TOKEN` is also accepted for compatibility. Do not commit `.env`, PostHog tokens, exported event files, or local runtime data.

## Event Catalog

The current event catalog is intentionally small:

| Event | Trigger | Safe properties |
| --- | --- | --- |
| `task created` | `POST /api/tasks` creates a local task. | `task_id`, `prompt_length` |
| `task demo started` | The deterministic demo runtime starts. | `task_id`, `status`, `operation_count` |
| `high risk operation approved` | A pending high-risk operation is approved. | `task_id`, `status`, `operation_count` |
| `high risk operation rejected` | A pending high-risk operation is rejected. | `task_id`, `status`, `operation_count` |
| `file rollback completed` | A file rollback endpoint completes. | `task_id`, `operation_id`, `status`, `operation_count` |
| Server exception | A server error is captured by the PostHog Node SDK. | `status_code` and safe metadata |

## Verification

After the server logs `PostHog analytics: enabled`, create a task:

```bash
curl -X POST http://127.0.0.1:4173/api/tasks \
  -H 'content-type: application/json' \
  -d '{"prompt":"PostHog smoke test"}'
```

This should create `task created` and `task demo started` in PostHog Activity.

To test the approval event, create a task and approve its pending operation:

```bash
TASK_ID=$(curl -s -X POST http://127.0.0.1:4173/api/tasks \
  -H 'content-type: application/json' \
  -d '{"prompt":"PostHog approval smoke test"}' \
  | jq -r '.task.task_id')

curl -X POST "http://127.0.0.1:4173/api/tasks/$TASK_ID/approval" \
  -H 'content-type: application/json' \
  -d '{"decision":"approved"}'
```

To test rejection, create another task and send `{"decision":"rejected"}` to the same approval endpoint.

PostHog batches server-side events. If an event does not appear immediately, wait briefly, use Reload in PostHog Activity, or stop the local server gracefully so the SDK can flush queued events.

## Privacy Rules

PostHog properties should describe product behavior, not user content. Allowed properties are IDs, statuses, counts, lengths, hashes, risk summaries, and other low-sensitivity metadata.

Never send:

- raw prompts or model messages;
- file contents or raw diffs;
- API request or response bodies;
- tokens, private keys, passwords, cookies, or authorization headers;
- browser credentials or session data;
- local filesystem paths when a stable ID or hash is enough.

The analytics wrapper drops property keys that look like raw prompts, content, request bodies, credentials, secrets, or tokens before sending events. Keep new events inside the same convention instead of calling the PostHog client directly from feature code.

## Mobile Messaging Events

Mobile messaging adapters, including future Telegram, Signal, Discord, Slack, WeChat, Feishu, or similar integrations, must follow a stricter rule: analytics may describe control-plane behavior, never message content.

Allowed properties:

- `channel_type`, for example `telegram` or `signal`;
- `operation_id`, `task_id`, and stable local IDs;
- command category, such as `status_check`, `approve`, or `reject`;
- risk level, approval state, and execution status;
- counts, lengths, hashes, and coarse timestamps.

Never send:

- raw mobile messages;
- chat titles, group names, usernames, phone numbers, or message URLs;
- raw task prompts, model responses, file content, diffs, API bodies, or extracted webpage content;
- bot tokens, webhook secrets, cookies, session data, or authorization headers.

If a mobile adapter needs richer diagnostics, write them to local audit logs first and export only redacted metadata through the analytics wrapper.
