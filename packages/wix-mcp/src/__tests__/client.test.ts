import { describe, it, expect, vi, beforeEach } from "vitest";
import { WixClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("WixClient", () => {
  let client: WixClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new WixClient({
      apiKey: "wix-api-key-test-123",
      siteId: "site-id-abc",
    });
  });

  it("sends API key in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ site: {} }));

    await client.get("v1/site-properties");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("wix-api-key-test-123");
  });

  it("sends wix-site-id header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ site: {} }));

    await client.get("v1/site-properties");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["wix-site-id"]).toBe("site-id-abc");
  });

  it("constructs correct API URLs", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("v3/items");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://www.wixapis.com/v3/items");
  });

  it("sends GET with query params", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ items: [] }));

    await client.get("v3/items", { limit: 50, offset: 10 });

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("limit")).toBe("50");
    expect(parsed.searchParams.get("offset")).toBe("10");
  });

  it("sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ item: { _id: "1" } }));

    await client.post("v3/items", { dataItem: { data: { title: "Test" } } });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.dataItem.data.title).toBe("Test");
  });

  it("sends PATCH with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ item: { _id: "1" } }));

    await client.patch("v3/items/1", { dataItem: { data: { title: "Updated" } } });

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v3/items/1");
    expect(init.method).toBe("PATCH");
  });

  it("sends DELETE request", async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    await client.del("v3/items/1");

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v3/items/1");
    expect(init.method).toBe("DELETE");
  });

  it("handles error responses", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ message: "Unauthorized", details: {} }, 401),
    );

    await expect(client.get("v1/site-properties")).rejects.toThrow();
  });
});
