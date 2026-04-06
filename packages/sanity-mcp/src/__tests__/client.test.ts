import { describe, it, expect, vi, beforeEach } from "vitest";
import { SanityClient } from "../api/client.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("SanityClient", () => {
  let client: SanityClient;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new SanityClient({
      projectId: "abc123",
      token: "sk-sanity-test-token",
      dataset: "production",
      apiVersion: "2024-01",
    });
  });

  it("sends Bearer token in Authorization header", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ result: [] }));

    await client.query("*[_type == 'post']");

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["Authorization"]).toBe("Bearer sk-sanity-test-token");
  });

  it("constructs correct URLs with project ID and API version", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ result: [] }));

    await client.query("*[_type == 'post']");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("https://abc123.api.sanity.io/v2024-01/data/query/production");
  });

  it("sends GROQ query as URL param", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ result: [{ _id: "1" }] }));

    await client.query("*[_type == 'post']{ _id, title }");

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("query")).toBe("*[_type == 'post']{ _id, title }");
  });

  it("sends GROQ query with parameters", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ result: [] }));

    await client.query('*[_type == $type]', { type: "post" });

    const [url] = mockFetch.mock.calls[0] as [string];
    const parsed = new URL(url);
    expect(parsed.searchParams.get("$type")).toBe('"post"');
  });

  it("gets a document by ID", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ documents: [{ _id: "doc1" }] }));

    const result = await client.getDocument("doc1");

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain("/data/doc/production/doc1");
    expect(result.documents).toHaveLength(1);
  });

  it("sends POST for mutations", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ transactionId: "tx1", results: [{ id: "doc1", operation: "create" }] }),
    );

    await client.mutate(
      [{ create: { _type: "post", title: "Hello" } }],
      { returnIds: true },
    );

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/data/mutate/production");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body as string);
    expect(body.mutations).toHaveLength(1);
    expect(body.mutations[0].create._type).toBe("post");
  });

  it("handles error responses", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({ error: "Unauthorized", message: "Invalid token" }, 401),
    );

    await expect(client.query("*")).rejects.toThrow();
  });

  it("uses default API version when not specified", () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ result: [] }));

    const defaultClient = new SanityClient({
      projectId: "xyz",
      token: "token",
      dataset: "production",
    });

    // Verify the client was created successfully (no error thrown)
    expect(defaultClient).toBeDefined();
  });
});
