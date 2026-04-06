import { describe, it, expect, vi, beforeEach } from "vitest";
import { PayloadClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("PayloadClient", () => {
  describe("with API key auth", () => {
    let client: PayloadClient;

    beforeEach(() => {
      mockFetch.mockReset();
      client = new PayloadClient({
        url: "https://my-payload.com",
        apiKey: "payload-api-key-123",
      });
    });

    it("sends API key in Authorization header", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ docs: [], totalDocs: 0 }));

      await client.listEntries("posts");

      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      const headers = init.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("payload-api-key-123");
    });

    it("constructs correct API URLs", async () => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ docs: [], totalDocs: 0 }));

      await client.listEntries("posts");

      const [url] = mockFetch.mock.calls[0] as [string];
      expect(url).toContain("https://my-payload.com/api/posts");
    });

    it("sends GET request for listing entries", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ docs: [{ id: "1", title: "Test" }], totalDocs: 1 }),
      );

      const result = await client.listEntries("posts", { limit: 10, page: 1 });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe("GET");
      const parsed = new URL(url);
      expect(parsed.searchParams.get("limit")).toBe("10");
      expect(parsed.searchParams.get("page")).toBe("1");
      expect(result.docs).toHaveLength(1);
    });

    it("sends POST for creating entries", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ doc: { id: "1", title: "New" }, message: "created" }),
      );

      await client.createEntry("posts", { title: "New" });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/posts");
      expect(init.method).toBe("POST");
      const body = JSON.parse(init.body as string);
      expect(body.title).toBe("New");
    });

    it("sends PATCH for updating entries", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ doc: { id: "1", title: "Updated" }, message: "updated" }),
      );

      await client.updateEntry("posts", "1", { title: "Updated" });

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/posts/1");
      expect(init.method).toBe("PATCH");
    });

    it("sends DELETE request", async () => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ doc: { id: "1" }, message: "deleted" }),
      );

      await client.deleteEntry("posts", "1");

      const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(url).toContain("/api/posts/1");
      expect(init.method).toBe("DELETE");
    });

    it("handles error responses", async () => {
      mockFetch.mockResolvedValue(
        jsonResponse({ errors: [{ message: "Not Found" }] }, 404),
      );

      await expect(client.getEntry("posts", "nonexistent")).rejects.toThrow();
    });
  });

  describe("with email/password auth", () => {
    let client: PayloadClient;

    beforeEach(() => {
      mockFetch.mockReset();
      client = new PayloadClient({
        url: "https://my-payload.com",
        email: "admin@example.com",
        password: "secret123",
      });
    });

    it("authenticates with email/password before first request", async () => {
      // First call: login, Second call: actual request
      mockFetch
        .mockResolvedValueOnce(jsonResponse({ token: "jwt-token-abc", user: { id: 1 } }))
        .mockResolvedValueOnce(jsonResponse({ docs: [], totalDocs: 0 }));

      await client.listEntries("posts");

      // Login request
      const [loginUrl, loginInit] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(loginUrl).toContain("/api/users/login");
      expect(loginInit.method).toBe("POST");
      const loginBody = JSON.parse(loginInit.body as string);
      expect(loginBody.email).toBe("admin@example.com");

      // Actual request should have JWT header
      const [, dataInit] = mockFetch.mock.calls[1] as [string, RequestInit];
      const headers = dataInit.headers as Record<string, string>;
      expect(headers["Authorization"]).toBe("JWT jwt-token-abc");
    });
  });
});
