/**
 * Webflow API v2 REST client.
 * Auth via Bearer token in Authorization header.
 * Rate limit: 60 requests/minute.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { WebflowConfig } from "../types/index.js";

export class WebflowClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;

  constructor(config: WebflowConfig) {
    this.logger = createLogger("webflow");

    this.api = new ApiClient(
      {
        baseUrl: "https://api.webflow.com/v2",
        headers: {
          Authorization: `Bearer ${config.apiToken}`,
        },
        maxRetries: 3,
        rateLimitPerSecond: 1, // 60 req/min = 1 req/sec
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.get<T>(path, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.api.post<T>(path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.api.put<T>(path, body);
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.api.patch<T>(path, body);
  }

  async del<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.delete<T>(path, params);
  }

  async list<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.get<T>(path, { limit: 100, ...params });
  }
}
