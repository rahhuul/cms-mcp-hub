import { describe, it, expect, vi, beforeEach } from "vitest";
import { WooClient } from "../api/client.js";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WooClient", () => {
  let httpsClient: WooClient;
  let httpClient: WooClient;

  beforeEach(() => {
    mockFetch.mockReset();

    httpsClient = new WooClient({
      url: "https://mystore.com",
      consumerKey: "ck_test_key",
      consumerSecret: "cs_test_secret",
      rateLimitPerSecond: 100,
    });

    httpClient = new WooClient({
      url: "http://mystore.local",
      consumerKey: "ck_test_key",
      consumerSecret: "cs_test_secret",
      rateLimitPerSecond: 100,
    });
  });

  describe("HTTPS (Basic Auth)", () => {
    it("includes Basic Auth header in requests", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1, name: "Product" }]));

      await httpsClient.get("products");

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("https://mystore.com/wp-json/wc/v3/products");
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toMatch(/^Basic /);
    });

    it("appends query parameters", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await httpsClient.get("products", { per_page: 10, page: 2 });

      const [url] = mockFetch.mock.calls[0] as [string];
      const parsed = new URL(url);
      expect(parsed.searchParams.get("per_page")).toBe("10");
      expect(parsed.searchParams.get("page")).toBe("2");
    });

    it("sends POST with body", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1 }));

      await httpsClient.post("products", { name: "Test" });

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("POST");
      expect(JSON.parse(init.body as string)).toEqual({ name: "Test" });
    });
  });

  describe("HTTP (OAuth 1.0a)", () => {
    it("signs requests with OAuth parameters", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([{ id: 1 }]));

      await httpClient.get("products");

      const [url] = mockFetch.mock.calls[0] as [string];
      const parsed = new URL(url);
      expect(parsed.searchParams.has("oauth_consumer_key")).toBe(true);
      expect(parsed.searchParams.has("oauth_signature")).toBe(true);
      expect(parsed.searchParams.get("oauth_consumer_key")).toBe("ck_test_key");
    });
  });

  describe("list()", () => {
    it("adds page and per_page params", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse([]));

      await httpsClient.list("products", {}, 3, 50);

      const [url] = mockFetch.mock.calls[0] as [string];
      const parsed = new URL(url);
      expect(parsed.searchParams.get("page")).toBe("3");
      expect(parsed.searchParams.get("per_page")).toBe("50");
    });
  });

  describe("batch()", () => {
    it("posts to the batch endpoint", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ create: [], update: [], delete: [] }));

      await httpsClient.batch("products", {
        create: [{ name: "New" }],
        delete: [5],
      });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/products/batch");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.create).toHaveLength(1);
      expect(body.delete).toEqual([5]);
    });
  });
});
