/**
 * Payload CMS REST API client.
 *
 * Supports two auth modes:
 * 1. API Key via Authorization header (set in constructor)
 * 2. Email/password login to obtain JWT (lazy, on first request)
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type {
  PayloadConfig,
  PayloadCollection,
  PayloadGlobal,
  PayloadEntry,
  PayloadListResponse,
  PayloadAccessResult,
  PayloadVersionsResponse,
} from "../types/index.js";

export class PayloadClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;
  private readonly config: PayloadConfig;
  private jwtToken: string | null = null;
  private collectionsCache: PayloadCollection[] | null = null;

  constructor(config: PayloadConfig) {
    this.config = config;
    this.logger = createLogger("payload");

    const headers: Record<string, string> = {};
    if (config.apiKey) {
      headers["Authorization"] = `${config.apiKey}`;
    }

    this.api = new ApiClient(
      {
        baseUrl: `${config.url.replace(/\/+$/, "")}/api`,
        headers,
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  // ─── Authentication ─────────────────────────────────────────────

  /** Login with email/password to get JWT token */
  private async ensureAuth(): Promise<void> {
    if (this.config.apiKey || this.jwtToken) return;
    if (!this.config.email || !this.config.password) {
      throw new Error(
        "Payload CMS requires either an API key or email/password credentials. "
        + "Set PAYLOAD_API_KEY or both PAYLOAD_EMAIL and PAYLOAD_PASSWORD.",
      );
    }

    const result = await this.api.post<{ token: string; user: unknown }>(
      "users/login",
      { email: this.config.email, password: this.config.password },
    );
    this.jwtToken = result.token;
    this.logger.info("Authenticated with Payload CMS via email/password");
  }

  /** Build extra headers for JWT auth (API key auth uses base headers) */
  private authHeaders(): Record<string, string> | undefined {
    if (this.jwtToken) {
      return { Authorization: `JWT ${this.jwtToken}` };
    }
    return undefined;
  }

  /** Make an authenticated GET request */
  private async authGet<T>(
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
  ): Promise<T> {
    await this.ensureAuth();
    return this.api.request<T>(path, {
      method: "GET",
      params,
      headers: this.authHeaders(),
    });
  }

  /** Make an authenticated POST request */
  private async authPost<T>(path: string, body?: unknown): Promise<T> {
    await this.ensureAuth();
    return this.api.request<T>(path, {
      method: "POST",
      body,
      headers: this.authHeaders(),
    });
  }

  /** Make an authenticated PATCH request */
  private async authPatch<T>(path: string, body?: unknown): Promise<T> {
    await this.ensureAuth();
    return this.api.request<T>(path, {
      method: "PATCH",
      body,
      headers: this.authHeaders(),
    });
  }

  /** Make an authenticated DELETE request */
  private async authDelete<T>(path: string): Promise<T> {
    await this.ensureAuth();
    return this.api.request<T>(path, {
      method: "DELETE",
      headers: this.authHeaders(),
    });
  }

  // ─── Collections ────────────────────────────────────────────────

  async listCollections(): Promise<PayloadCollection[]> {
    if (this.collectionsCache) return this.collectionsCache;

    // Payload exposes collection configs at a custom admin endpoint
    try {
      const result = await this.authGet<{ collections: PayloadCollection[] }>(
        "../admin/api/config",
      );
      this.collectionsCache = result.collections ?? [];
      return this.collectionsCache;
    } catch {
      // Fallback: use the access endpoint to discover collection slugs
      const access = await this.getAccess();
      const slugs = Object.keys(access).filter(
        (key) => key !== "canAccessAdmin" && typeof access[key] === "object",
      );
      this.collectionsCache = slugs.map((slug) => ({
        slug,
        labels: { singular: slug, plural: slug },
        fields: [],
      }));
      return this.collectionsCache;
    }
  }

  // ─── Entry CRUD ─────────────────────────────────────────────────

  async listEntries(
    collection: string,
    params: {
      limit?: number;
      page?: number;
      sort?: string;
      where?: Record<string, unknown>;
      depth?: number;
    } = {},
  ): Promise<PayloadListResponse> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params.limit !== undefined) query["limit"] = params.limit;
    if (params.page !== undefined) query["page"] = params.page;
    if (params.sort) query["sort"] = params.sort;
    if (params.depth !== undefined) query["depth"] = params.depth;
    if (params.where) {
      // Flatten where queries into bracket notation
      for (const [field, condition] of Object.entries(params.where)) {
        if (typeof condition === "object" && condition !== null) {
          for (const [op, val] of Object.entries(condition as Record<string, unknown>)) {
            query[`where[${field}][${op}]`] = String(val);
          }
        } else {
          query[`where[${field}][equals]`] = String(condition);
        }
      }
    }

    return this.authGet<PayloadListResponse>(collection, query);
  }

  async getEntry(
    collection: string,
    id: string | number,
    params: { depth?: number } = {},
  ): Promise<PayloadEntry> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params.depth !== undefined) query["depth"] = params.depth;
    return this.authGet<PayloadEntry>(`${collection}/${id}`, query);
  }

  async createEntry(
    collection: string,
    data: Record<string, unknown>,
  ): Promise<{ doc: PayloadEntry; message: string }> {
    return this.authPost<{ doc: PayloadEntry; message: string }>(collection, data);
  }

  async updateEntry(
    collection: string,
    id: string | number,
    data: Record<string, unknown>,
  ): Promise<{ doc: PayloadEntry; message: string }> {
    return this.authPatch<{ doc: PayloadEntry; message: string }>(`${collection}/${id}`, data);
  }

  async deleteEntry(
    collection: string,
    id: string | number,
  ): Promise<{ doc: PayloadEntry; message: string }> {
    return this.authDelete<{ doc: PayloadEntry; message: string }>(`${collection}/${id}`);
  }

  // ─── Globals ────────────────────────────────────────────────────

  async listGlobals(): Promise<PayloadGlobal[]> {
    try {
      const result = await this.authGet<{ globals: PayloadGlobal[] }>(
        "../admin/api/config",
      );
      return result.globals ?? [];
    } catch {
      // If config endpoint unavailable, return empty
      return [];
    }
  }

  async getGlobal(
    slug: string,
    params: { depth?: number } = {},
  ): Promise<PayloadEntry> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params.depth !== undefined) query["depth"] = params.depth;
    return this.authGet<PayloadEntry>(`globals/${slug}`, query);
  }

  async updateGlobal(
    slug: string,
    data: Record<string, unknown>,
  ): Promise<{ doc: PayloadEntry; message: string }> {
    return this.authPost<{ doc: PayloadEntry; message: string }>(`globals/${slug}`, data);
  }

  // ─── Media ──────────────────────────────────────────────────────

  async listMedia(
    collection: string,
    params: { limit?: number; page?: number } = {},
  ): Promise<PayloadListResponse> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params.limit !== undefined) query["limit"] = params.limit;
    if (params.page !== undefined) query["page"] = params.page;
    return this.authGet<PayloadListResponse>(collection, query);
  }

  // ─── Access ─────────────────────────────────────────────────────

  async getAccess(): Promise<PayloadAccessResult> {
    return this.authGet<PayloadAccessResult>("access");
  }

  // ─── Versions ───────────────────────────────────────────────────

  async listVersions(
    collection: string,
    id: string | number,
    params: { limit?: number; page?: number } = {},
  ): Promise<PayloadVersionsResponse> {
    const query: Record<string, string | number | boolean | undefined> = {};
    if (params.limit !== undefined) query["limit"] = params.limit;
    if (params.page !== undefined) query["page"] = params.page;
    return this.authGet<PayloadVersionsResponse>(`${collection}/versions`, {
      ...query,
      "where[parent][equals]": String(id),
    });
  }

  async restoreVersion(
    collection: string,
    versionId: string,
  ): Promise<{ doc: PayloadEntry; message: string }> {
    return this.authPost<{ doc: PayloadEntry; message: string }>(
      `${collection}/versions/${versionId}`,
    );
  }
}
