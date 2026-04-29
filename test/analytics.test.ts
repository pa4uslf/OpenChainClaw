import assert from "node:assert/strict";
import test from "node:test";
import { Analytics, createAnalytics, sanitizeAnalyticsProperties, type AnalyticsClient } from "../src/analytics.js";

class FakePostHogClient implements AnalyticsClient {
  captures: Array<{ distinctId: string; event: string; properties?: Record<string, unknown> }> = [];
  exceptions: Array<{ error: unknown; distinctId?: string; additionalProperties?: Record<string, unknown> }> = [];
  shutdownCalled = false;

  capture(message: { distinctId: string; event: string; properties?: Record<string, unknown> }): void {
    this.captures.push(message);
  }

  captureException(error: unknown, distinctId?: string, additionalProperties?: Record<string, unknown>): void {
    const entry: { error: unknown; distinctId?: string; additionalProperties?: Record<string, unknown> } = { error };
    if (distinctId) {
      entry.distinctId = distinctId;
    }
    if (additionalProperties) {
      entry.additionalProperties = additionalProperties;
    }
    this.exceptions.push(entry);
  }

  async shutdown(): Promise<void> {
    this.shutdownCalled = true;
  }
}

test("PostHog analytics stays disabled without a project token", () => {
  const analytics = createAnalytics({
    POSTHOG_PROJECT_API_KEY: "",
    POSTHOG_HOST: "https://us.i.posthog.com"
  });

  analytics.capture({ event: "task created" });

  assert.equal(analytics.config.enabled, false);
});

test("analytics accepts POSTHOG_PROJECT_TOKEN as the project token variable", () => {
  const analytics = createAnalytics({
    POSTHOG_PROJECT_TOKEN: "phc_test",
    POSTHOG_HOST: "https://us.i.posthog.com"
  });

  assert.equal(analytics.config.enabled, true);
});

test("analytics capture adds a default distinct ID and avoids person profiles", () => {
  const fakeClient = new FakePostHogClient();
  const analytics = new Analytics(
    {
      enabled: true,
      distinctId: "local-user",
      host: "https://us.i.posthog.com"
    },
    fakeClient
  );

  analytics.capture({
    event: "task created",
    properties: {
      task_id: "task_123"
    }
  });

  assert.equal(fakeClient.captures.length, 1);
  assert.equal(fakeClient.captures[0]?.distinctId, "local-user");
  assert.equal(fakeClient.captures[0]?.event, "task created");
  assert.equal(fakeClient.captures[0]?.properties?.task_id, "task_123");
  assert.equal(fakeClient.captures[0]?.properties?.$process_person_profile, false);
});

test("analytics capture drops unsafe property names before sending events", () => {
  const fakeClient = new FakePostHogClient();
  const analytics = new Analytics(
    {
      enabled: true,
      distinctId: "local-user",
      host: "https://us.i.posthog.com"
    },
    fakeClient
  );

  analytics.capture({
    event: "task created",
    properties: {
      task_id: "task_123",
      prompt: "raw user request",
      prompt_length: 16,
      metadata: {
        request_body: "raw payload",
        body_shape: ["name"]
      },
      api_key: "phc_secret",
      file_path: "/Users/frank/private.txt"
    }
  });

  assert.deepEqual(fakeClient.captures[0]?.properties, {
    task_id: "task_123",
    prompt_length: 16,
    metadata: {
      body_shape: ["name"]
    },
    $process_person_profile: false
  });
});

test("sanitizeAnalyticsProperties does not mutate the input object", () => {
  const properties = {
    task_id: "task_123",
    token: "secret"
  };

  assert.deepEqual(sanitizeAnalyticsProperties(properties), { task_id: "task_123" });
  assert.deepEqual(properties, {
    task_id: "task_123",
    token: "secret"
  });
});

test("analytics exception capture uses the configured distinct ID", () => {
  const fakeClient = new FakePostHogClient();
  const analytics = new Analytics(
    {
      enabled: true,
      distinctId: "local-user",
      host: "https://us.i.posthog.com"
    },
    fakeClient
  );
  const error = new Error("boom");

  analytics.captureException(error, { status_code: 500 });

  assert.equal(fakeClient.exceptions.length, 1);
  assert.equal(fakeClient.exceptions[0]?.error, error);
  assert.equal(fakeClient.exceptions[0]?.distinctId, "local-user");
  assert.equal(fakeClient.exceptions[0]?.additionalProperties?.status_code, 500);
  assert.equal(fakeClient.exceptions[0]?.additionalProperties?.$process_person_profile, false);
});
