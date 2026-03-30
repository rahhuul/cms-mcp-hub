/**
 * Base API client with retry, rate limiting, and error handling.
 * Each CMS package extends or wraps this for platform-specific needs.
 */

import type { ApiClientConfig, RequestOptions } from "./types/index.js";
import { ApiError, isRetryableStatus } from "./errors.js";
import { RateLimiter } from "./rate-limiter.js";
import { Logger } from "./logger.js";

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RATE_LIMIT = 10;
const BASE_BACKOFF_MS = 1000;

export class ApiClient {
  protected readonly baseUrl: string;
  protected readonly headers: Record<string, string>;
  private readonly maxRetries: number;
  private readonly timeoutMs: number;
  private readonly rateLimiter: RateLimiter;
  private readonly logger: Logger;

  constructor(config: ApiClientConfig, logger?: Logger) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.headers = config.headers ?? {};
    this.maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.rateLimiter = new RateLimiter(config.rateLimitPerSecond ?? DEFAULT_RATE_LIMIT);
    this.logger = logger ?? new Logger({ prefix: "cmsmcp:api" });
  }

  /**
   * Makes an HTTP request with automatic retry, rate limiting, and error handling.
   */
  async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const url = this.buildUrl(path, options.params);
    const { body, params: _params, ...fetchOptions } = options;

    const init: RequestInit = {
      ...fetchOptions,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...this.headers,
        ...(fetchOptions.headers as Record<string, string> | undefined),
      },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(this.timeoutMs),
    };

    let lastError: ApiError | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      await this.rateLimiter.acquire();

      if (attempt > 0) {
        const backoff = this.calculateBackoff(attempt, lastError);
        this.logger.debug(`Retry ${attempt}/${this.maxRetries} after ${backoff}ms`, {
          url,
          statusCode: lastError?.statusCode,
        });
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }

      try {
        const response = await fetch(url, init);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => "");
          const message = this.parseErrorMessage(errorBody, response.statusText);
          const retryable = isRetryableStatus(response.status);

          lastError = new ApiError(message, response.status, retryable);

          if (retryable && attempt < this.maxRetries) {
            continue;
          }

          throw lastError;
        }

        if (response.status === 204) {
          return undefined as T;
        }

        return (await response.json()) as T;
      } catch (error) {
        if (error instanceof ApiError) {
          throw error;
        }

        // Network or timeout errors
        const message = error instanceof Error ? error.message : "Network request failed";
        lastError = new ApiError(message, 0, true);

        if (attempt < this.maxRetries) {
          continue;
        }

        throw lastError;
      }
    }

    throw lastError ?? new ApiError("Request failed after retries", 0);
  }

  /** Shorthand for GET requests */
  async get<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: "GET", params });
  }

  /** Shorthand for POST requests */
  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "POST", body });
  }

  /** Shorthand for PUT requests */
  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PUT", body });
  }

  /** Shorthand for PATCH requests */
  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, { method: "PATCH", body });
  }

  /** Shorthand for DELETE requests */
  async delete<T>(path: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(path, { method: "DELETE", params });
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(path.startsWith("http") ? path : `${this.baseUrl}/${path.replace(/^\/+/, "")}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  private calculateBackoff(attempt: number, lastError?: ApiError): number {
    // If we got a Retry-After header value via 429, respect a base wait
    const base = lastError?.statusCode === 429 ? BASE_BACKOFF_MS * 2 : BASE_BACKOFF_MS;
    // Exponential backoff with jitter
    const exponential = base * Math.pow(2, attempt - 1);
    const jitter = Math.random() * BASE_BACKOFF_MS;
    return Math.min(exponential + jitter, 30_000);
  }

  private parseErrorMessage(body: string, fallback: string): string {
    try {
      const parsed: unknown = JSON.parse(body);
      if (typeof parsed === "object" && parsed !== null) {
        const obj = parsed as Record<string, unknown>;
        // Common error response shapes across CMS APIs
        if (typeof obj["message"] === "string") return obj["message"];
        if (typeof obj["error"] === "string") return obj["error"];
        if (typeof obj["error_description"] === "string") return obj["error_description"] as string;
        if (typeof obj["errors"] === "object" && obj["errors"] !== null) {
          return JSON.stringify(obj["errors"]);
        }
      }
    } catch {
      // body wasn't JSON
    }
    return body || fallback;
  }
}
