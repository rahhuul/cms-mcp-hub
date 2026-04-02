/**
 * WordPress REST API client for Yoast SEO operations.
 * Auth via Basic Authentication (Application Passwords).
 * Endpoints: wp/v2/ for post meta, yoast/v1/ for Yoast-specific.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import type { YoastConfig, YoastSeoMeta, WpPostWithSeo, YoastHeadResponse, YoastRedirect } from "../types/index.js";

export class YoastClient {
  private readonly api: ApiClient;
  private readonly siteUrl: string;
  private readonly logger: Logger;

  constructor(config: YoastConfig) {
    this.logger = createLogger("yoast");
    this.siteUrl = config.url.replace(/\/+$/, "");
    const baseUrl = `${this.siteUrl}/wp-json`;
    const credentials = Buffer.from(`${config.username}:${config.applicationPassword}`).toString("base64");

    this.api = new ApiClient(
      {
        baseUrl,
        headers: { Authorization: `Basic ${credentials}` },
        maxRetries: 3,
        rateLimitPerSecond: 5,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  /** Get the configured site URL */
  getSiteUrl(): string {
    return this.siteUrl;
  }

  // ── WordPress REST API (wp/v2/) ──────────────────────────────────

  /** Get a single post/page with meta fields */
  async getPost(postId: number, postType: string = "posts"): Promise<WpPostWithSeo> {
    const endpoint = this.wpEndpoint(postType);
    return this.api.get<WpPostWithSeo>(`wp/v2/${endpoint}/${postId}`, { context: "edit" });
  }

  /** List posts/pages with meta fields */
  async listPosts(postType: string = "posts", params: Record<string, string | number | boolean | undefined> = {}): Promise<WpPostWithSeo[]> {
    const endpoint = this.wpEndpoint(postType);
    return this.api.get<WpPostWithSeo[]>(`wp/v2/${endpoint}`, { context: "edit", ...params });
  }

  /** Update post meta (SEO fields) */
  async updatePostMeta(postId: number, postType: string = "posts", meta: YoastSeoMeta): Promise<WpPostWithSeo> {
    const endpoint = this.wpEndpoint(postType);
    return this.api.post<WpPostWithSeo>(`wp/v2/${endpoint}/${postId}`, { meta });
  }

  // ── Yoast REST API (yoast/v1/) ──────────────────────────────────

  /** Get Yoast head data for a URL (SEO preview, schema, etc.) */
  async getHead(url: string): Promise<YoastHeadResponse> {
    return this.api.get<YoastHeadResponse>("yoast/v1/get_head", { url });
  }

  /** Get site representation configuration */
  async getSiteRepresentation(): Promise<Record<string, unknown>> {
    return this.api.get<Record<string, unknown>>("yoast/v1/configuration/site_representation");
  }

  // ── Redirects (Yoast Premium) ────────────────────────────────────

  /** List all redirects (requires Yoast Premium) */
  async listRedirects(): Promise<YoastRedirect[]> {
    return this.api.get<YoastRedirect[]>("yoast/v1/redirects");
  }

  /** Create a redirect (requires Yoast Premium) */
  async createRedirect(data: { origin: string; url: string; type: number; format?: string }): Promise<YoastRedirect> {
    return this.api.post<YoastRedirect>("yoast/v1/redirects", data);
  }

  /** Update a redirect (requires Yoast Premium) */
  async updateRedirect(id: string, data: { origin?: string; target?: string; type?: number }): Promise<YoastRedirect> {
    return this.api.put<YoastRedirect>(`yoast/v1/redirects/${id}`, data);
  }

  /** Delete a redirect (requires Yoast Premium) */
  async deleteRedirect(id: string): Promise<Record<string, unknown>> {
    return this.api.delete<Record<string, unknown>>(`yoast/v1/redirects/${id}`);
  }

  // ── Sitemap ──────────────────────────────────────────────────────

  /** Fetch sitemap index XML and return as text */
  async getSitemapIndex(): Promise<string> {
    const url = `${this.siteUrl}/sitemap_index.xml`;
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) {
      throw new Error(`Failed to fetch sitemap: ${response.status} ${response.statusText}`);
    }
    return response.text();
  }

  // ── Helpers ──────────────────────────────────────────────────────

  /** Map post_type param to WordPress REST endpoint slug */
  private wpEndpoint(postType: string): string {
    switch (postType) {
      case "page":
      case "pages":
        return "pages";
      case "product":
      case "products":
        return "products";
      default:
        return "posts";
    }
  }
}
