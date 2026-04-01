/**
 * Wix REST API v2 client.
 * Auth via Authorization header (API key) + wix-site-id header.
 * Handles rate limiting, retries, and WQL query support.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { WixConfig } from "../types/index.js";

export class WixClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;

  constructor(config: WixConfig) {
    this.logger = createLogger("wix");

    this.api = new ApiClient(
      {
        baseUrl: "https://www.wixapis.com",
        headers: {
          Authorization: config.apiKey,
          "wix-site-id": config.siteId,
        },
        maxRetries: 3,
        rateLimitPerSecond: 5,
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

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.api.patch<T>(path, body);
  }

  async del<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.delete<T>(path, params);
  }
}
