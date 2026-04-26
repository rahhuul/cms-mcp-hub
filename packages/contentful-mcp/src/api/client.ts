/**
 * Contentful Content Management API (CMA) client.
 *
 * Base URL: https://api.contentful.com/spaces/{spaceId}/environments/{environmentId}/
 * Auth: Bearer token
 * Content-Type: application/vnd.contentful.management.v1+json
 * Rate limit: 10 req/sec
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { ContentfulConfig } from "../types/index.js";

export class ContentfulClient {
  private readonly api: ApiClient;
  private readonly spaceApi: ApiClient;
  private readonly logger: Logger;

  constructor(config: ContentfulConfig) {
    this.logger = createLogger("contentful");

    const envBaseUrl =
      `https://api.contentful.com/spaces/${config.spaceId}/environments/${config.environmentId}`;

    const spaceBaseUrl =
      `https://api.contentful.com/spaces/${config.spaceId}`;

    const commonHeaders: Record<string, string> = {
      Authorization: `Bearer ${config.managementToken}`,
      "Content-Type": "application/vnd.contentful.management.v1+json",
    };

    this.api = new ApiClient(
      {
        baseUrl: envBaseUrl,
        headers: commonHeaders,
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );

    // Space-level API for operations outside environment scope
    this.spaceApi = new ApiClient(
      {
        baseUrl: spaceBaseUrl,
        headers: commonHeaders,
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  // ─── Environment-scoped requests ────────────────────────────────

  async get<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.api.request<T>(path, { method: "GET", params });
  }

  async post<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.api.request<T>(path, { method: "POST", body, headers });
  }

  async put<T>(
    path: string,
    body?: unknown,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.api.request<T>(path, { method: "PUT", body, headers });
  }

  async delete<T>(
    path: string,
    headers?: Record<string, string>,
  ): Promise<T> {
    return this.api.request<T>(path, { method: "DELETE", headers });
  }

  // ─── Space-scoped requests ──────────────────────────────────────

  async getSpace<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    return this.spaceApi.request<T>(path, { method: "GET", params });
  }

  async postSpace<T>(path: string, body?: unknown): Promise<T> {
    return this.spaceApi.request<T>(path, { method: "POST", body });
  }

  // ─── Versioned requests (Contentful uses X-Contentful-Version) ──

  async putWithVersion<T>(
    path: string,
    version: number,
    body?: unknown,
  ): Promise<T> {
    return this.api.request<T>(path, {
      method: "PUT",
      body,
      headers: { "X-Contentful-Version": String(version) },
    });
  }

  async deleteWithVersion<T>(path: string, version: number): Promise<T> {
    return this.api.request<T>(path, {
      method: "DELETE",
      headers: { "X-Contentful-Version": String(version) },
    });
  }
}
