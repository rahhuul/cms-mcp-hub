/**
 * WordPress REST API v2 client.
 * Auth via Application Passwords (Basic Auth, built into WP 5.6+).
 */

import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { WpConfig } from "../types/index.js";

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".gif": "image/gif",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".mp4": "video/mp4", ".webm": "video/webm", ".mov": "video/quicktime",
  ".mp3": "audio/mpeg", ".wav": "audio/wav", ".ogg": "audio/ogg",
  ".pdf": "application/pdf", ".zip": "application/zip",
  ".doc": "application/msword", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export class WpClient {
  private readonly api: ApiClient;
  private readonly baseUrl: string;
  private readonly authHeader: string;
  private readonly logger: Logger;

  constructor(config: WpConfig) {
    this.logger = createLogger("wordpress");
    this.baseUrl = `${config.url.replace(/\/+$/, "")}/wp-json/wp/v2`;
    this.authHeader = `Basic ${Buffer.from(`${config.username}:${config.applicationPassword}`).toString("base64")}`;

    this.api = new ApiClient(
      {
        baseUrl: this.baseUrl,
        headers: { Authorization: this.authHeader },
        maxRetries: 3,
        rateLimitPerSecond: 25,
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

  async del<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.api.delete<T>(path, params);
  }

  async list<T>(path: string, params: Record<string, string | number | boolean | undefined> = {}, page = 1, perPage = 25): Promise<T[]> {
    return this.get<T[]>(path, { ...params, page, per_page: perPage });
  }

  /**
   * Upload a file to the WordPress media library.
   * Accepts either a local file path or a URL.
   */
  async uploadMedia(source: string, filename?: string, meta?: { title?: string; caption?: string; alt_text?: string; description?: string }): Promise<Record<string, unknown>> {
    let fileBuffer: Buffer;
    let resolvedFilename: string;

    if (source.startsWith("http://") || source.startsWith("https://")) {
      // Download from URL
      this.logger.info("Downloading file from URL", { url: source });
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
      fileBuffer = Buffer.from(await response.arrayBuffer());
      // Extract filename from URL or Content-Disposition
      const urlPath = new URL(source).pathname;
      resolvedFilename = filename || basename(urlPath) || "upload";
    } else {
      // Read local file
      this.logger.info("Reading local file", { path: source });
      fileBuffer = await readFile(source);
      resolvedFilename = filename || basename(source);
    }

    const ext = extname(resolvedFilename).toLowerCase();
    const contentType = MIME_MAP[ext] || "application/octet-stream";

    // WordPress media upload: POST raw file with Content-Disposition header
    const url = `${this.baseUrl}/media`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${resolvedFilename}"`,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      throw new Error(`Media upload failed (${response.status}): ${errorBody}`);
    }

    const mediaItem = await response.json() as Record<string, unknown>;

    // Update meta fields if provided
    if (meta && (meta.title || meta.caption || meta.alt_text || meta.description)) {
      const updateData: Record<string, unknown> = {};
      if (meta.title) updateData["title"] = meta.title;
      if (meta.caption) updateData["caption"] = meta.caption;
      if (meta.alt_text) updateData["alt_text"] = meta.alt_text;
      if (meta.description) updateData["description"] = meta.description;
      return this.put<Record<string, unknown>>(`media/${mediaItem["id"]}`, updateData);
    }

    return mediaItem;
  }
}
