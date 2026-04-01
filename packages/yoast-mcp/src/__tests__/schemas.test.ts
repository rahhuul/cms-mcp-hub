import { describe, it, expect } from "vitest";
import {
  GetSeoDataSchema,
  UpdateSeoDataSchema,
  GetSeoScoreSchema,
  BulkGetSeoSchema,
  BulkUpdateSeoSchema,
  GetIndexableStatusSchema,
  UpdateIndexableSchema,
  ListRedirectsSchema,
  CreateRedirectSchema,
  GetSocialDataSchema,
  UpdateSocialDataSchema,
  GetSchemaSchema,
  GetSitemapIndexSchema,
} from "../schemas/index.js";

describe("SEO Data schemas", () => {
  it("GetSeoData defaults post_type to post", () => {
    const result = GetSeoDataSchema.parse({ post_id: 42 });
    expect(result.post_type).toBe("post");
    expect(result.post_id).toBe(42);
  });

  it("GetSeoData accepts page type", () => {
    expect(GetSeoDataSchema.parse({ post_id: 1, post_type: "page" }).post_type).toBe("page");
  });

  it("GetSeoData rejects invalid post_id", () => {
    expect(() => GetSeoDataSchema.parse({ post_id: -1 })).toThrow();
    expect(() => GetSeoDataSchema.parse({ post_id: 0 })).toThrow();
  });

  it("UpdateSeoData accepts all optional fields", () => {
    const result = UpdateSeoDataSchema.parse({
      post_id: 10,
      title: "%%title%% %%sep%% %%sitename%%",
      meta_description: "A great page about stuff",
      focus_keyword: "great stuff",
      canonical_url: "https://example.com/stuff",
    });
    expect(result.title).toBe("%%title%% %%sep%% %%sitename%%");
    expect(result.meta_description).toBe("A great page about stuff");
    expect(result.focus_keyword).toBe("great stuff");
    expect(result.canonical_url).toBe("https://example.com/stuff");
  });

  it("UpdateSeoData works with only post_id", () => {
    const result = UpdateSeoDataSchema.parse({ post_id: 5 });
    expect(result.post_id).toBe(5);
    expect(result.title).toBeUndefined();
  });

  it("UpdateSeoData rejects invalid canonical URL", () => {
    expect(() => UpdateSeoDataSchema.parse({ post_id: 1, canonical_url: "not-a-url" })).toThrow();
  });
});

describe("SEO Score schemas", () => {
  it("GetSeoScore requires post_id", () => {
    expect(GetSeoScoreSchema.parse({ post_id: 7 }).post_id).toBe(7);
  });
});

describe("Bulk schemas", () => {
  it("BulkGetSeo accepts array of post IDs", () => {
    const result = BulkGetSeoSchema.parse({ post_ids: [1, 2, 3] });
    expect(result.post_ids).toHaveLength(3);
    expect(result.post_type).toBe("post");
  });

  it("BulkGetSeo rejects empty array", () => {
    expect(() => BulkGetSeoSchema.parse({ post_ids: [] })).toThrow();
  });

  it("BulkGetSeo rejects more than 50 IDs", () => {
    const ids = Array.from({ length: 51 }, (_, i) => i + 1);
    expect(() => BulkGetSeoSchema.parse({ post_ids: ids })).toThrow();
  });

  it("BulkUpdateSeo accepts updates array", () => {
    const result = BulkUpdateSeoSchema.parse({
      updates: [
        { post_id: 1, title: "New Title" },
        { post_id: 2, meta_description: "New desc" },
      ],
    });
    expect(result.updates).toHaveLength(2);
  });

  it("BulkUpdateSeo rejects more than 25 updates", () => {
    const updates = Array.from({ length: 26 }, (_, i) => ({ post_id: i + 1, title: "T" }));
    expect(() => BulkUpdateSeoSchema.parse({ updates })).toThrow();
  });
});

describe("Indexing schemas", () => {
  it("GetIndexableStatus works", () => {
    expect(GetIndexableStatusSchema.parse({ post_id: 1 }).post_id).toBe(1);
  });

  it("UpdateIndexable accepts noindex and canonical", () => {
    const result = UpdateIndexableSchema.parse({
      post_id: 5,
      noindex: true,
      canonical_url: "https://example.com/canonical",
    });
    expect(result.noindex).toBe(true);
    expect(result.canonical_url).toBe("https://example.com/canonical");
  });
});

describe("Redirect schemas", () => {
  it("ListRedirects accepts empty object", () => {
    expect(ListRedirectsSchema.parse({})).toEqual({});
  });

  it("CreateRedirect defaults to 301 plain", () => {
    const result = CreateRedirectSchema.parse({ origin: "/old", url: "/new" });
    expect(result.type).toBe(301);
    expect(result.format).toBe("plain");
  });

  it("CreateRedirect accepts regex format", () => {
    const result = CreateRedirectSchema.parse({ origin: "/old-(.*)", url: "/new-$1", format: "regex" });
    expect(result.format).toBe("regex");
  });

  it("CreateRedirect rejects empty origin", () => {
    expect(() => CreateRedirectSchema.parse({ origin: "", url: "/new" })).toThrow();
  });
});

describe("Social schemas", () => {
  it("GetSocialData works", () => {
    expect(GetSocialDataSchema.parse({ post_id: 1 }).post_id).toBe(1);
  });

  it("UpdateSocialData accepts OG and Twitter fields", () => {
    const result = UpdateSocialDataSchema.parse({
      post_id: 10,
      og_title: "OG Title",
      og_description: "OG Desc",
      og_image: "https://img.com/og.jpg",
      twitter_title: "Tweet Title",
      twitter_description: "Tweet Desc",
      twitter_image: "https://img.com/tw.jpg",
    });
    expect(result.og_title).toBe("OG Title");
    expect(result.twitter_title).toBe("Tweet Title");
  });

  it("UpdateSocialData rejects invalid image URL", () => {
    expect(() => UpdateSocialDataSchema.parse({ post_id: 1, og_image: "not-url" })).toThrow();
  });
});

describe("Schema schemas", () => {
  it("GetSchema requires valid URL", () => {
    expect(GetSchemaSchema.parse({ url: "https://example.com/page" }).url).toBe("https://example.com/page");
  });

  it("GetSchema rejects invalid URL", () => {
    expect(() => GetSchemaSchema.parse({ url: "not-a-url" })).toThrow();
  });
});

describe("Sitemap schemas", () => {
  it("GetSitemapIndex accepts empty object", () => {
    expect(GetSitemapIndexSchema.parse({})).toEqual({});
  });
});
