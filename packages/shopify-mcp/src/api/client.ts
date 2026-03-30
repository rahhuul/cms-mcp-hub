/**
 * Shopify Admin REST API client.
 * Auth via X-Shopify-Access-Token header.
 * Handles leaky bucket rate limiting and cursor-based pagination.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { ShopifyConfig } from "../types/index.js";

const DEFAULT_API_VERSION = "2025-01";

export class ShopifyClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;

  constructor(config: ShopifyConfig) {
    this.logger = createLogger("shopify");
    const store = config.store.replace(/\.myshopify\.com$/, "");
    const version = config.apiVersion || DEFAULT_API_VERSION;
    const baseUrl = `https://${store}.myshopify.com/admin/api/${version}`;

    this.api = new ApiClient(
      {
        baseUrl,
        headers: { "X-Shopify-Access-Token": config.accessToken },
        maxRetries: 3,
        rateLimitPerSecond: 2, // Shopify standard: 2 req/sec leaky bucket
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.get<T>(path.endsWith(".json") ? path : `${path}.json`, params);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.api.post<T>(path.endsWith(".json") ? path : `${path}.json`, body);
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.api.put<T>(path.endsWith(".json") ? path : `${path}.json`, body);
  }

  async del<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.delete<T>(path.endsWith(".json") ? path : `${path}.json`, params);
  }

  async list<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
    return this.get<T>(path, { limit: 50, ...params });
  }
}
