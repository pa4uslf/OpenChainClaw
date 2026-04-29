import { PostHog } from "posthog-node";

export const ANALYTICS_EVENTS = {
  taskCreated: "task created",
  taskDemoStarted: "task demo started",
  highRiskOperationApproved: "high risk operation approved",
  highRiskOperationRejected: "high risk operation rejected",
  fileRollbackCompleted: "file rollback completed"
} as const;

export interface AnalyticsEvent {
  distinctId?: string;
  event: string;
  properties?: Record<string, unknown>;
}

export interface AnalyticsClient {
  capture(message: { distinctId: string; event: string; properties?: Record<string, unknown> }): void;
  captureException(error: unknown, distinctId?: string, additionalProperties?: Record<string, unknown>): void;
  shutdown(): Promise<void>;
}

export interface AnalyticsConfig {
  enabled: boolean;
  distinctId: string;
  host: string;
}

const UNSAFE_PROPERTY_FRAGMENTS = [
  "api_key",
  "authorization",
  "browser_credential",
  "content",
  "cookie",
  "credential",
  "file_path",
  "headers",
  "local_path",
  "password",
  "private_key",
  "raw_diff",
  "request_body",
  "secret",
  "token"
];

function normalizePropertyKey(key: string): string {
  return key.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function isSafeDerivedPromptKey(key: string): boolean {
  return key === "prompt_length" || key.endsWith("_prompt_length");
}

function isSafeDerivedBodyKey(key: string): boolean {
  return key === "body_shape" || key.endsWith("_body_shape");
}

function isUnsafeAnalyticsPropertyKey(key: string): boolean {
  const normalized = normalizePropertyKey(key);

  if (normalized.includes("prompt") && !isSafeDerivedPromptKey(normalized)) {
    return true;
  }

  if (normalized.includes("body") && !isSafeDerivedBodyKey(normalized)) {
    return true;
  }

  return UNSAFE_PROPERTY_FRAGMENTS.some((fragment) => normalized.includes(fragment));
}

function sanitizeAnalyticsValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeAnalyticsValue(entry));
  }

  if (!value || typeof value !== "object" || value instanceof Date) {
    return value;
  }

  return sanitizeAnalyticsProperties(value as Record<string, unknown>);
}

export function sanitizeAnalyticsProperties(properties: Record<string, unknown> = {}): Record<string, unknown> {
  const safeProperties: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(properties)) {
    if (isUnsafeAnalyticsPropertyKey(key)) {
      continue;
    }

    safeProperties[key] = sanitizeAnalyticsValue(value);
  }

  return safeProperties;
}

export class Analytics {
  readonly config: AnalyticsConfig;
  private readonly client: AnalyticsClient | null;

  constructor(config: AnalyticsConfig, client: AnalyticsClient | null) {
    this.config = config;
    this.client = client;
  }

  capture({ distinctId, event, properties }: AnalyticsEvent): void {
    if (!this.client) {
      return;
    }

    this.client.capture({
      distinctId: distinctId || this.config.distinctId,
      event,
      properties: {
        ...sanitizeAnalyticsProperties(properties),
        $process_person_profile: false
      }
    });
  }

  captureException(error: unknown, properties?: Record<string, unknown>): void {
    if (!this.client) {
      return;
    }

    this.client.captureException(error, this.config.distinctId, {
      ...sanitizeAnalyticsProperties(properties),
      $process_person_profile: false
    });
  }

  async shutdown(): Promise<void> {
    if (!this.client) {
      return;
    }
    await this.client.shutdown();
  }
}

export function createAnalytics(env: NodeJS.ProcessEnv = process.env): Analytics {
  const token = env.POSTHOG_PROJECT_API_KEY || env.POSTHOG_PROJECT_TOKEN;
  const distinctId = env.POSTHOG_DISTINCT_ID || "openchainclaw-local-runtime";
  const host = env.POSTHOG_HOST || "https://us.i.posthog.com";

  if (!token) {
    return new Analytics({ enabled: false, distinctId, host }, null);
  }

  const client = new PostHog(token, {
    host,
    enableExceptionAutocapture: true
  });

  return new Analytics({ enabled: true, distinctId, host }, client);
}
