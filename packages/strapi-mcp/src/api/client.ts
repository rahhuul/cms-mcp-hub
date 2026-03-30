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
  private contentTypesCache: StrapiContentType[] | null = null;

  constructor(config: StrapiConfig) {
    this.logger = createLogger("strapi");
    this.api = new ApiClient(
      {
        baseUrl: `${config.url.replace(/\/+$/, "")}/api`,
        headers: { Authorization: `Bearer ${config.apiToken}` },
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
