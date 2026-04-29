import { PostHog } from "posthog-node";

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
        ...properties,
        $process_person_profile: false
      }
    });
  }

  captureException(error: unknown, properties?: Record<string, unknown>): void {
    if (!this.client) {
      return;
    }

    this.client.captureException(error, this.config.distinctId, {
      ...properties,
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
