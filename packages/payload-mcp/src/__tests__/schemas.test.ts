import { describe, it, expect } from "vitest";
import {
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  ListGlobalsSchema,
  GetGlobalSchema,
  UpdateGlobalSchema,
  ListMediaSchema,
  UploadMediaSchema,
  ListVersionsSchema,
  RestoreVersionSchema,
} from "../schemas/index.js";

describe("Entry schemas", () => {
  it("ListEntriesSchema requires collection", () => {
    expect(() => ListEntriesSchema.parse({})).toThrow();
    const result = ListEntriesSchema.parse({ collection: "posts" });
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it("ListEntriesSchema accepts all query options", () => {
    const result = ListEntriesSchema.parse({
      collection: "posts",
      page: 2,
      limit: 50,
      sort: "-createdAt",
      where: { title: { equals: "hello" } },
      depth: 2,
    });
    expect(result.sort).toBe("-createdAt");
    expect(result.depth).toBe(2);
  });

  it("ListEntriesSchema rejects limit > 100", () => {
    expect(() =>
      ListEntriesSchema.parse({ collection: "posts", limit: 200 }),
    ).toThrow();
  });

  it("GetEntrySchema requires collection and id", () => {
    expect(() => GetEntrySchema.parse({ collection: "posts" })).toThrow();
    const result = GetEntrySchema.parse({ collection: "posts", id: 42 });
    expect(result.id).toBe(42);
  });

  it("GetEntrySchema accepts string IDs", () => {
    const result = GetEntrySchema.parse({ collection: "posts", id: "abc123" });
    expect(result.id).toBe("abc123");
  });

  it("CreateEntrySchema requires collection and data", () => {
    expect(() => CreateEntrySchema.parse({ collection: "posts" })).toThrow();
    const result = CreateEntrySchema.parse({
      collection: "posts",
      data: { title: "Test", content: "Body text" },
    });
    expect(result.data["title"]).toBe("Test");
  });

  it("UpdateEntrySchema requires id", () => {
    const result = UpdateEntrySchema.parse({
      collection: "posts",
      id: 1,
      data: { title: "Updated" },
    });
    expect(result.id).toBe(1);
  });

  it("DeleteEntrySchema validates", () => {
    const result = DeleteEntrySchema.parse({ collection: "posts", id: 5 });
    expect(result.id).toBe(5);
  });
});

describe("Global schemas", () => {
  it("ListGlobalsSchema accepts empty object", () => {
    const result = ListGlobalsSchema.parse({});
    expect(result).toEqual({});
  });

  it("GetGlobalSchema requires slug", () => {
    expect(() => GetGlobalSchema.parse({})).toThrow();
    const result = GetGlobalSchema.parse({ slug: "site-settings" });
    expect(result.slug).toBe("site-settings");
  });

  it("GetGlobalSchema accepts optional depth", () => {
    const result = GetGlobalSchema.parse({ slug: "header", depth: 3 });
    expect(result.depth).toBe(3);
  });

  it("UpdateGlobalSchema requires slug and data", () => {
    const result = UpdateGlobalSchema.parse({
      slug: "footer",
      data: { copyright: "2024" },
    });
    expect(result.data["copyright"]).toBe("2024");
  });
});

describe("Media schemas", () => {
  it("ListMediaSchema applies defaults", () => {
    const result = ListMediaSchema.parse({});
    expect(result.collection).toBe("media");
    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it("ListMediaSchema accepts custom collection", () => {
    const result = ListMediaSchema.parse({ collection: "images" });
    expect(result.collection).toBe("images");
  });

  it("UploadMediaSchema validates URL", () => {
    expect(() => UploadMediaSchema.parse({ url: "not-a-url" })).toThrow();
    const result = UploadMediaSchema.parse({ url: "https://example.com/image.jpg" });
    expect(result.url).toContain("example.com");
  });
});

describe("Version schemas", () => {
  it("ListVersionsSchema requires collection and id", () => {
    expect(() => ListVersionsSchema.parse({ collection: "posts" })).toThrow();
    const result = ListVersionsSchema.parse({ collection: "posts", id: "abc" });
    expect(result.limit).toBe(10);
  });

  it("RestoreVersionSchema requires collection and versionId", () => {
    expect(() => RestoreVersionSchema.parse({ collection: "posts" })).toThrow();
    const result = RestoreVersionSchema.parse({
      collection: "posts",
      versionId: "v123",
    });
    expect(result.versionId).toBe("v123");
  });

  it("RestoreVersionSchema rejects empty versionId", () => {
    expect(() =>
      RestoreVersionSchema.parse({ collection: "posts", versionId: "" }),
    ).toThrow();
  });
});
