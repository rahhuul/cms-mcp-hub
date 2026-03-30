import { describe, it, expect, vi, beforeEach } from "vitest";
import { StrapiClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("StrapiClient", () => {
  let client: StrapiClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new StrapiClient({
      url: "http://localhost:1337",
      apiToken: "test-token",
    });
  });

  it("sends Bearer token in requests", async () => {
    // First: content type discovery, second: actual list
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
        ],
      }),
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } }),
    );

    await client.listEntries("articles");

    // Second call (the actual list) should have auth header
    const [, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer test-token");
  });

  it("constructs correct URL for list entries", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
        ],
      }),
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { pagination: { page: 1, pageSize: 25, pageCount: 0, total: 0 } } }),
    );

    await client.listEntries("articles");

    const [url] = mockFetch.mock.calls[1] as [string];
    expect(url).toContain("http://localhost:1337/api/articles");
  });

  it("getContentTypes fetches and caches", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
          { uid: "plugin::users.user", apiID: "user", schema: { displayName: "User", singularName: "user", pluralName: "users", kind: "collectionType", attributes: {} } },
        ],
      }),
    );

    const types1 = await client.getContentTypes();
    const types2 = await client.getContentTypes();

    // Only one fetch call — second was cached
    expect(mockFetch).toHaveBeenCalledTimes(1);
    // Only api:: types returned
    expect(types1).toHaveLength(1);
    expect(types1[0]!.uid).toBe("api::article.article");
    expect(types2).toBe(types1);
  });

  it("resolvePluralName looks up content types", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
        ],
      }),
    );

    // Resolve singular -> plural
    const plural = await client.resolvePluralName("article");
    expect(plural).toBe("articles");
  });

  it("createEntry sends correct payload", async () => {
    // First call: content types discovery
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
        ],
      }),
    );
    // Second call: create
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: 1, attributes: { title: "Test" } }, meta: {} }),
    );

    await client.createEntry("article", { title: "Test" });

    const [url, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    expect(url).toContain("/api/articles");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ data: { title: "Test" } });
  });

  it("publishEntry sets publishedAt", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { uid: "api::article.article", apiID: "article", schema: { displayName: "Article", singularName: "article", pluralName: "articles", kind: "collectionType", attributes: {} } },
        ],
      }),
    );
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: 1, attributes: {} }, meta: {} }),
    );

    await client.publishEntry("article", 1);

    const [, init] = mockFetch.mock.calls[1] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.data.publishedAt).toBeDefined();
    expect(init.method).toBe("PUT");
  });
});
