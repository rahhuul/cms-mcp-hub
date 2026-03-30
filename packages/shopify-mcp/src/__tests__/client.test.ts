import { describe, it, expect, vi, beforeEach } from "vitest";
import { ShopifyClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("ShopifyClient", () => {
  let client: ShopifyClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new ShopifyClient({ store: "mystore", accessToken: "shpat_test123" });
  });

  it("sends X-Shopify-Access-Token header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));
    await client.get("products");
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)["X-Shopify-Access-Token"]).toBe("shpat_test123");
  });

  it("constructs correct Shopify URL", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));
    await client.get("products");
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://mystore.myshopify.com/admin/api/2025-01/products.json");
  });

  it("appends .json to paths", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ product: {} }));
    await client.get("products/123");
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("products/123.json");
  });

  it("does not double .json", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({}));
    await client.get("products.json");
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toMatch(/products\.json(\?|$)/);
    expect(url).not.toContain(".json.json");
  });

  it("sends POST with body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ product: { id: 1 } }));
    await client.post("products", { product: { title: "Test" } });
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ product: { title: "Test" } });
  });

  it("list defaults limit to 50", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ products: [] }));
    await client.list("products");
    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("limit=50");
  });
});
