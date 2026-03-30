/**
 * Ghost API client with Admin API (JWT) and Content API (key) support.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import { generateAdminToken } from "./auth.js";
import type { GhostConfig } from "../types/index.js";

export class GhostClient {
  private readonly adminApi: ApiClient;
  private readonly config: GhostConfig;
  private readonly logger: Logger;
  private tokenExpiry = 0;
  private currentToken = "";

  constructor(config: GhostConfig) {
    this.config = config;
    this.logger = createLogger("ghost");

    const baseUrl = `${config.url.replace(/\/+$/, "")}/ghost/api/admin`;

    this.adminApi = new ApiClient(
      {
        baseUrl,
        headers: {}, // Auth header set per-request via getAuthHeaders
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  /** Gets a fresh JWT token, refreshing if expired */
  private getToken(): string {
    const now = Math.floor(Date.now() / 1000);
    // Refresh 30 seconds before expiry
    if (now >= this.tokenExpiry - 30) {
      this.currentToken = generateAdminToken(this.config.adminApiKey);
      this.tokenExpiry = now + 5 * 60;
    }
    return this.currentToken;
  }

  // ─── Admin API Methods ───────────────────────────────────────────

  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.adminApi.request<T>(path, {
      method: "GET",
      params,
      headers: { Authorization: `Ghost ${this.getToken()}` },
    });
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.adminApi.request<T>(path, {
      method: "POST",
      body,
      headers: { Authorization: `Ghost ${this.getToken()}` },
    });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.adminApi.request<T>(path, {
      method: "PUT",
      body,
      headers: { Authorization: `Ghost ${this.getToken()}` },
    });
  }

  async delete<T>(path: string): Promise<T> {
    return this.adminApi.request<T>(path, {
      method: "DELETE",
      headers: { Authorization: `Ghost ${this.getToken()}` },
    });
  }
}
