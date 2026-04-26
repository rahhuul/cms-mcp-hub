/**
 * WooCommerce REST API v3 client.
 *
 * Handles authentication (OAuth 1.0a for HTTP, Basic Auth for HTTPS),
 * retry with backoff, rate limiting, and pagination.
 */

import { ApiClient, createLogger, type Logger } from "@cmsmcp/shared";
import { isHttps, basicAuthHeader, signOAuth } from "./auth.js";
import type { WooConfig, WooBatchRequest, WooBatchResponse } from "../types/index.js";

const API_PATH = "/wp-json/wc/v3";
const DEFAULT_RATE_LIMIT = 25;

export class WooClient {
  private readonly apiClient: ApiClient;
  private readonly config: WooConfig;
  private readonly useBasicAuth: boolean;
  private readonly logger: Logger;

  constructor(config: WooConfig) {
    this.config = config;
    this.useBasicAuth = isHttps(config.url);
    this.logger = createLogger("woocommerce");

    const baseUrl = `${config.url.replace(/\/+$/, "")}${API_PATH}`;

    // For HTTPS, we pass Basic Auth header to the shared ApiClient.
    // For HTTP, we sign each request URL with OAuth (handled in request methods).
    this.apiClient = new ApiClient(
      {
        baseUrl,
        headers: this.useBasicAuth
          ? { Authorization: basicAuthHeader(config.consumerKey, config.consumerSecret) }
          : {},
        maxRetries: 3,
        rateLimitPerSecond: config.rateLimitPerSecond ?? DEFAULT_RATE_LIMIT,
        timeoutMs: 30_000,
      },
      this.logger,
    );

    this.logger.info("WooCommerce client initialized", {
      url: config.url,
      authMethod: this.useBasicAuth ? "Basic Auth (HTTPS)" : "OAuth 1.0a (HTTP)",
    });
  }

  /**
   * GET request with pagination support.
   */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (this.useBasicAuth) {
      return this.apiClient.get<T>(path, params);
    }
    // For HTTP/OAuth, we need to sign the full URL
    return this.oauthRequest<T>("GET", path, params);
  }

  /**
   * POST request.
   */
  async post<T>(path: string, body?: unknown): Promise<T> {
    if (this.useBasicAuth) {
      return this.apiClient.post<T>(path, body);
    }
    return this.oauthRequest<T>("POST", path, undefined, body);
  }

  /**
   * PUT request.
   */
  async put<T>(path: string, body?: unknown): Promise<T> {
    if (this.useBasicAuth) {
      return this.apiClient.put<T>(path, body);
    }
    return this.oauthRequest<T>("PUT", path, undefined, body);
  }

  /**
   * DELETE request.
   */
  async delete<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    if (this.useBasicAuth) {
      return this.apiClient.delete<T>(path, params);
    }
    return this.oauthRequest<T>("DELETE", path, params);
  }

  /**
   * Paginated list request. Converts limit/offset to WooCommerce page/per_page.
   */
  async list<T>(
    path: string,
    params: Record<string, string | number | boolean | undefined> = {},
    page = 1,
    perPage = 25,
  ): Promise<T[]> {
    return this.get<T[]>(path, {
      ...params,
      page,
      per_page: perPage,
    });
  }

  /**
   * Batch create/update/delete operations.
   * WooCommerce supports up to 100 operations per batch.
   */
  async batch(resource: string, operations: WooBatchRequest): Promise<WooBatchResponse> {
    return this.post<WooBatchResponse>(`${resource}/batch`, operations);
  }

  /**
   * Makes an OAuth 1.0a-signed request for HTTP sites.
   */
  private async oauthRequest<T>(
    method: string,
    path: string,
    params?: Record<string, string | number | boolean | undefined>,
    body?: unknown,
  ): Promise<T> {
    // Build the base URL for signing
    const baseUrl = `${this.config.url.replace(/\/+$/, "")}${API_PATH}/${path.replace(/^\/+/, "")}`;
    const url = new URL(baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const signedUrl = signOAuth(method, url.toString(), this.config.consumerKey, this.config.consumerSecret);

    // Use the apiClient.request with the full signed URL
    return this.apiClient.request<T>(signedUrl, {
      method,
      ...(body !== undefined ? { body } : {}),
    });
  }
}
