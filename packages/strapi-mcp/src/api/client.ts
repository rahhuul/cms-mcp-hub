/**
 * Strapi REST API client with dynamic content type discovery.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type {
  StrapiConfig,
  StrapiContentType,
  StrapiComponent,
  StrapiListResponse,
  StrapiSingleResponse,
  StrapiMediaFile,
  StrapiLocale,
} from "../types/index.js";

export class StrapiClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;
  private readonly apiBaseUrl: string;
  private readonly authHeader: string;
  private contentTypesCache: StrapiContentType[] | null = null;

  constructor(config: StrapiConfig) {
    this.logger = createLogger("strapi");
    this.apiBaseUrl = `${config.url.replace(/\/+$/, "")}/api`;
    this.authHeader = `Bearer ${config.apiToken}`;
    this.api = new ApiClient(
      {
        baseUrl: this.apiBaseUrl,
        headers: { Authorization: this.authHeader },
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  // ─── Content Type Discovery ──────────────────────────────────────

  async getContentTypes(): Promise<StrapiContentType[]> {
    if (this.contentTypesCache) return this.contentTypesCache;

    const result = await this.api.get<{ data: StrapiContentType[] }>(
      "content-type-builder/content-types",
    );
    // Filter to only api:: content types (user-defined)
    this.contentTypesCache = result.data.filter((ct) => ct.uid.startsWith("api::"));
    return this.contentTypesCache;
  }

  async getComponents(): Promise<StrapiComponent[]> {
    const result = await this.api.get<{ data: StrapiComponent[] }>(
      "content-type-builder/components",
    );
    return result.data;
  }

  /** Resolves a content type name to its plural API ID */
  async resolvePluralName(contentType: string): Promise<string> {
    // If it already looks like a plural name (e.g., "articles"), try it directly
    // Otherwise look up from content types
    const types = await this.getContentTypes();
    const found = types.find(
      (ct) =>
        ct.schema.pluralName === contentType ||
        ct.schema.singularName === contentType ||
        ct.apiID === contentType ||
        ct.uid === `api::${contentType}.${contentType}`,
    );
    return found?.schema.pluralName ?? contentType;
  }

  // ─── CRUD Operations ─────────────────────────────────────────────

  async listEntries(
    contentType: string,
    params: Record<string, unknown> = {},
  ): Promise<StrapiListResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.get<StrapiListResponse>(plural, this.flattenParams(params));
  }

  async getEntry(
    contentType: string,
    id: number,
    params: Record<string, unknown> = {},
  ): Promise<StrapiSingleResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.get<StrapiSingleResponse>(`${plural}/${id}`, this.flattenParams(params));
  }

  async createEntry(
    contentType: string,
    data: Record<string, unknown>,
  ): Promise<StrapiSingleResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.post<StrapiSingleResponse>(plural, { data });
  }

  async updateEntry(
    contentType: string,
    id: number,
    data: Record<string, unknown>,
  ): Promise<StrapiSingleResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.put<StrapiSingleResponse>(`${plural}/${id}`, { data });
  }

  async deleteEntry(contentType: string, id: number): Promise<StrapiSingleResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.delete<StrapiSingleResponse>(`${plural}/${id}`);
  }

  async bulkDeleteEntries(
    contentType: string,
    ids: number[],
  ): Promise<{ count: number }> {
    const plural = await this.resolvePluralName(contentType);
    // Strapi v4 bulk delete via action endpoint
    return this.api.post<{ count: number }>(`${plural}/actions/bulkDelete`, {
      ids,
    });
  }

  // ─── Publish/Unpublish ───────────────────────────────────────────

  async publishEntry(contentType: string, id: number): Promise<StrapiSingleResponse> {
    return this.updateEntry(contentType, id, { publishedAt: new Date().toISOString() });
  }

  async unpublishEntry(contentType: string, id: number): Promise<StrapiSingleResponse> {
    return this.updateEntry(contentType, id, { publishedAt: null } as Record<string, unknown>);
  }

  // ─── Localization ────────────────────────────────────────────────

  async getLocales(): Promise<StrapiLocale[]> {
    return this.api.get<StrapiLocale[]>("i18n/locales");
  }

  async createLocalization(
    contentType: string,
    id: number,
    locale: string,
    data: Record<string, unknown>,
  ): Promise<StrapiSingleResponse> {
    const plural = await this.resolvePluralName(contentType);
    return this.api.post<StrapiSingleResponse>(`${plural}/${id}/localizations`, {
      ...data,
      locale,
    });
  }

  // ─── Media ───────────────────────────────────────────────────────

  async listMedia(params: Record<string, unknown> = {}): Promise<StrapiMediaFile[]> {
    return this.api.get<StrapiMediaFile[]>("upload/files", this.flattenParams(params));
  }

  async deleteMedia(id: number): Promise<StrapiMediaFile> {
    return this.api.delete<StrapiMediaFile>(`upload/files/${id}`);
  }

  // ─── Users & Roles ──────────────────────────────────────────────

  async listUsers(): Promise<unknown[]> {
    return this.api.get<unknown[]>("users", { "populate": "*" });
  }

  async listRoles(): Promise<unknown> {
    return this.api.get<unknown>("users-permissions/roles");
  }

  // ─── Content Type Detail ──────────────────────────────────────

  async getContentType(uid: string): Promise<StrapiContentType> {
    const result = await this.api.get<{ data: StrapiContentType }>(
      `content-type-builder/content-types/${uid}`,
    );
    return result.data;
  }

  // ─── Localization (extended) ─────────────────────────────────

  async listLocalizations(
    contentType: string,
    id: number,
  ): Promise<unknown[]> {
    const plural = await this.resolvePluralName(contentType);
    const entry = await this.api.get<StrapiSingleResponse>(`${plural}/${id}`, {
      populate: "localizations",
    });
    const localizations = (entry.data as Record<string, unknown>)["localizations"];
    return Array.isArray(localizations) ? localizations :
      (localizations as Record<string, unknown>)?.["data"] as unknown[] ?? [];
  }

  async updateLocalization(
    contentType: string,
    id: number,
    locale: string,
    data: Record<string, unknown>,
  ): Promise<StrapiSingleResponse> {
    // Fetch the entry's localizations to find the localized entry ID
    const localizations = await this.listLocalizations(contentType, id);
    const localized = (localizations as Array<Record<string, unknown>>).find(
      (l) => l["locale"] === locale || (l["attributes"] as Record<string, unknown>)?.["locale"] === locale,
    );
    if (!localized) {
      throw new Error(`No localization found for locale '${locale}' on entry ${id}. Create it first with strapi_create_localized_entry.`);
    }
    const localizedId = (localized["id"] as number);
    const plural = await this.resolvePluralName(contentType);
    return this.api.put<StrapiSingleResponse>(`${plural}/${localizedId}`, { data });
  }

  async deleteLocalization(
    contentType: string,
    id: number,
    locale: string,
  ): Promise<StrapiSingleResponse> {
    const localizations = await this.listLocalizations(contentType, id);
    const localized = (localizations as Array<Record<string, unknown>>).find(
      (l) => l["locale"] === locale || (l["attributes"] as Record<string, unknown>)?.["locale"] === locale,
    );
    if (!localized) {
      throw new Error(`No localization found for locale '${locale}' on entry ${id}.`);
    }
    const localizedId = (localized["id"] as number);
    const plural = await this.resolvePluralName(contentType);
    return this.api.delete<StrapiSingleResponse>(`${plural}/${localizedId}`);
  }

  // ─── File Upload ────────────────────────────────────────────

  async uploadFile(
    fileUrl: string,
    options: { name?: string; caption?: string; alternativeText?: string } = {},
  ): Promise<StrapiMediaFile> {
    // 1. Fetch file from URL
    this.logger.info("Fetching file from URL for upload", { url: fileUrl });
    const fileResponse = await fetch(fileUrl, { signal: AbortSignal.timeout(60_000) });
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from URL: ${fileResponse.status} ${fileResponse.statusText}`);
    }

    const buffer = Buffer.from(await fileResponse.arrayBuffer());
    const contentType = fileResponse.headers.get("content-type") ?? "application/octet-stream";

    // Derive filename from URL or override
    const urlPath = new URL(fileUrl).pathname;
    const fileName = options.name ?? urlPath.split("/").pop() ?? "upload";

    // 2. Build multipart form data manually (no external deps)
    const boundary = `----CMSMCPBoundary${Date.now()}${Math.random().toString(36).slice(2)}`;
    const parts: Buffer[] = [];

    // File part
    parts.push(Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="files"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`,
    ));
    parts.push(buffer);
    parts.push(Buffer.from("\r\n"));

    // Optional metadata fields
    if (options.caption) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="fileInfo"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ caption: options.caption, alternativeText: options.alternativeText ?? "" })}\r\n`,
      ));
    } else if (options.alternativeText) {
      parts.push(Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="fileInfo"\r\nContent-Type: application/json\r\n\r\n${JSON.stringify({ alternativeText: options.alternativeText })}\r\n`,
      ));
    }

    parts.push(Buffer.from(`--${boundary}--\r\n`));

    const body = Buffer.concat(parts);

    // 3. POST to Strapi upload endpoint
    const uploadUrl = `${this.apiBaseUrl}/upload`;
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        Authorization: this.authHeader,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
      },
      body,
      signal: AbortSignal.timeout(120_000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = (await response.json()) as StrapiMediaFile[];
    // Strapi upload returns an array; return the first (and typically only) file
    return result[0] as StrapiMediaFile;
  }

  // ─── Helpers ─────────────────────────────────────────────────────

  /** Flattens nested params to query string compatible format */
  private flattenParams(
    params: Record<string, unknown>,
    prefix = "",
  ): Record<string, string | number | boolean | undefined> {
    const result: Record<string, string | number | boolean | undefined> = {};

    for (const [key, value] of Object.entries(params)) {
      const fullKey = prefix ? `${prefix}[${key}]` : key;

      if (value === undefined || value === null) continue;

      if (typeof value === "object" && !Array.isArray(value)) {
        Object.assign(result, this.flattenParams(value as Record<string, unknown>, fullKey));
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (typeof item === "object") {
            Object.assign(result, this.flattenParams(item as Record<string, unknown>, `${fullKey}[${index}]`));
          } else {
            result[`${fullKey}[${index}]`] = item as string | number | boolean;
          }
        });
      } else {
        result[fullKey] = value as string | number | boolean;
      }
    }

    return result;
  }
}
