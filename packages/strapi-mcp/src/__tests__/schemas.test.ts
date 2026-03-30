import { describe, it, expect } from "vitest";
import {
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  BulkDeleteSchema,
  PublishEntrySchema,
  ListMediaSchema,
  UploadMediaSchema,
  DeleteMediaSchema,
  CreateLocalizedEntrySchema,
} from "../schemas/index.js";

describe("Entry schemas", () => {
  it("ListEntriesSchema requires contentType", () => {
    expect(() => ListEntriesSchema.parse({})).toThrow();
    const result = ListEntriesSchema.parse({ contentType: "articles" });
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it("ListEntriesSchema accepts all query options", () => {
    const result = ListEntriesSchema.parse({
      contentType: "articles",
      page: 2,
      pageSize: 50,
      sort: "createdAt:desc",
      filters: { title: { $contains: "hello" } },
      populate: "*",
      fields: ["title", "slug"],
      publicationState: "preview",
      locale: "fr",
    });
    expect(result.sort).toBe("createdAt:desc");
    expect(result.publicationState).toBe("preview");
  });

  it("GetEntrySchema requires contentType and id", () => {
    expect(() => GetEntrySchema.parse({ contentType: "articles" })).toThrow();
    const result = GetEntrySchema.parse({ contentType: "articles", id: 42 });
    expect(result.id).toBe(42);
  });

  it("CreateEntrySchema requires contentType and data", () => {
    const result = CreateEntrySchema.parse({
      contentType: "articles",
      data: { title: "Test", content: "Body text" },
    });
    expect(result.data["title"]).toBe("Test");
  });

  it("UpdateEntrySchema requires id", () => {
    const result = UpdateEntrySchema.parse({
      contentType: "articles",
      id: 1,
      data: { title: "Updated" },
    });
    expect(result.id).toBe(1);
  });

  it("DeleteEntrySchema validates", () => {
    const result = DeleteEntrySchema.parse({ contentType: "articles", id: 5 });
    expect(result.id).toBe(5);
  });

  it("BulkDeleteSchema requires non-empty ids", () => {
    expect(() => BulkDeleteSchema.parse({ contentType: "articles", ids: [] })).toThrow();
    const result = BulkDeleteSchema.parse({ contentType: "articles", ids: [1, 2, 3] });
    expect(result.ids).toHaveLength(3);
  });

  it("PublishEntrySchema validates", () => {
    const result = PublishEntrySchema.parse({ contentType: "articles", id: 10 });
    expect(result.id).toBe(10);
  });
});

describe("Media schemas", () => {
  it("ListMediaSchema applies defaults", () => {
    const result = ListMediaSchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(25);
  });

  it("UploadMediaSchema validates URL", () => {
    expect(() => UploadMediaSchema.parse({ url: "not-a-url" })).toThrow();
    const result = UploadMediaSchema.parse({ url: "https://example.com/image.jpg" });
    expect(result.url).toContain("example.com");
  });

  it("DeleteMediaSchema requires id", () => {
    const result = DeleteMediaSchema.parse({ id: 7 });
    expect(result.id).toBe(7);
  });
});

describe("Localization schema", () => {
  it("CreateLocalizedEntrySchema validates all fields", () => {
    const result = CreateLocalizedEntrySchema.parse({
      contentType: "articles",
      id: 1,
      locale: "fr",
      data: { title: "Mon Article" },
    });
    expect(result.locale).toBe("fr");
    expect(result.data["title"]).toBe("Mon Article");
  });

  it("rejects empty locale", () => {
    expect(() =>
      CreateLocalizedEntrySchema.parse({
        contentType: "articles",
        id: 1,
        locale: "",
        data: {},
      }),
    ).toThrow();
  });
});
