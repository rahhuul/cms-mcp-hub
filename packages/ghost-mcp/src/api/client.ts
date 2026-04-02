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

  /**
   * Upload an image to Ghost Admin API via multipart/form-data.
   * Fetches the image from the given URL and uploads it.
   */
  async uploadImage(imageUrl: string, ref?: string): Promise<{ url: string }> {
    // Fetch the image bytes
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.status} ${imageResponse.statusText}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const contentType = imageResponse.headers.get("content-type") ?? "image/png";

    // Derive filename from URL or ref
    const urlPath = new URL(imageUrl).pathname;
    const filename = ref
      ? `${ref}.${this.extensionFromMime(contentType)}`
      : urlPath.split("/").pop() ?? `upload.${this.extensionFromMime(contentType)}`;

    // Build multipart/form-data manually (no external deps)
    const boundary = `----CMSMCPBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
    const CRLF = "\r\n";

    const preamble = `--${boundary}${CRLF}`
      + `Content-Disposition: form-data; name="file"; filename="${filename}"${CRLF}`
      + `Content-Type: ${contentType}${CRLF}${CRLF}`;

    const epilogue = `${CRLF}--${boundary}--${CRLF}`;

    const preambleBuffer = Buffer.from(preamble, "utf-8");
    const epilogueBuffer = Buffer.from(epilogue, "utf-8");
    const body = Buffer.concat([preambleBuffer, imageBuffer, epilogueBuffer]);

    const baseUrl = `${this.config.url.replace(/\/+$/, "")}/ghost/api/admin`;
    const uploadUrl = `${baseUrl}/images/upload/`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: `Ghost ${this.getToken()}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": String(body.byteLength),
      },
      body,
      signal: AbortSignal.timeout(60_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Ghost image upload failed (${response.status}): ${errorText}`);
    }

    const result = (await response.json()) as { images: Array<{ url: string }> };
    return { url: result.images[0]!.url };
  }

  private extensionFromMime(mime: string): string {
    const map: Record<string, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return map[mime] ?? "png";
  }
}
