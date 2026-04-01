import { describe, it, expect } from "vitest";
import {
  ListContentTypesSchema,
  GetContentTypeSchema,
  CreateContentTypeSchema,
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  PublishEntrySchema,
  UnpublishEntrySchema,
  ListAssetsSchema,
  UploadAssetSchema,
  ListTagsSchema,
  BulkPublishSchema,
} from "../schemas/index.js";

describe("Content type schemas", () => {
  it("ListContentTypesSchema applies defaults", () => {
    const result = ListContentTypesSchema.parse({});
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(0);
  });

  it("ListContentTypesSchema accepts order", () => {
    const result = ListContentTypesSchema.parse({
      order: "sys.createdAt",
      limit: 50,
      skip: 10,
    });
    expect(result.order).toBe("sys.createdAt");
    expect(result.limit).toBe(50);
  });

  it("GetContentTypeSchema requires contentTypeId", () => {
    expect(() => GetContentTypeSchema.parse({})).toThrow();
    const result = GetContentTypeSchema.parse({ contentTypeId: "blogPost" });
    expect(result.contentTypeId).toBe("blogPost");
  });

  it("CreateContentTypeSchema requires name and fields", () => {
    expect(() => CreateContentTypeSchema.parse({ name: "Post" })).toThrow();
    expect(() => CreateContentTypeSchema.parse({ name: "Post", fields: [] })).toThrow();

    const result = CreateContentTypeSchema.parse({
      name: "Blog Post",
      contentTypeId: "blogPost",
      description: "A blog post",
      displayField: "title",
      fields: [
        { id: "title", name: "Title", type: "Symbol", required: true },
        { id: "body", name: "Body", type: "RichText" },
      ],
    });
    expect(result.name).toBe("Blog Post");
    expect(result.fields).toHaveLength(2);
    expect(result.fields[0]!.required).toBe(true);
    expect(result.fields[1]!.required).toBe(false); // default
  });

  it("CreateContentTypeSchema validates field types", () => {
    expect(() =>
      CreateContentTypeSchema.parse({
        name: "Test",
        fields: [{ id: "f", name: "F", type: "InvalidType" }],
      }),
    ).toThrow();
  });
});

describe("Entry schemas", () => {
  it("ListEntriesSchema applies defaults", () => {
    const result = ListEntriesSchema.parse({});
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(0);
  });

  it("ListEntriesSchema accepts all filters", () => {
    const result = ListEntriesSchema.parse({
      content_type: "blogPost",
      order: "-sys.createdAt",
      select: "sys.id,fields.title",
      query: "hello world",
      limit: 10,
      skip: 20,
    });
    expect(result.content_type).toBe("blogPost");
    expect(result.query).toBe("hello world");
  });

  it("GetEntrySchema requires entryId", () => {
    expect(() => GetEntrySchema.parse({})).toThrow();
    const result = GetEntrySchema.parse({ entryId: "entry123" });
    expect(result.entryId).toBe("entry123");
  });

  it("CreateEntrySchema requires contentTypeId and fields", () => {
    expect(() => CreateEntrySchema.parse({})).toThrow();
    const result = CreateEntrySchema.parse({
      contentTypeId: "blogPost",
      fields: {
        title: { "en-US": "Hello World" },
        body: { "en-US": "Content here" },
      },
    });
    expect(result.contentTypeId).toBe("blogPost");
    expect(result.fields["title"]).toEqual({ "en-US": "Hello World" });
  });

  it("CreateEntrySchema accepts tags", () => {
    const result = CreateEntrySchema.parse({
      contentTypeId: "blogPost",
      fields: { title: { "en-US": "Tagged" } },
      tags: [
        { sys: { type: "Link", linkType: "Tag", id: "tag1" } },
      ],
    });
    expect(result.tags).toHaveLength(1);
  });

  it("UpdateEntrySchema requires entryId, version, and fields", () => {
    expect(() => UpdateEntrySchema.parse({ entryId: "e1" })).toThrow();
    expect(() => UpdateEntrySchema.parse({ entryId: "e1", version: 1 })).toThrow();

    const result = UpdateEntrySchema.parse({
      entryId: "entry123",
      version: 5,
      fields: { title: { "en-US": "Updated" } },
    });
    expect(result.version).toBe(5);
  });

  it("DeleteEntrySchema requires entryId and version", () => {
    expect(() => DeleteEntrySchema.parse({ entryId: "e1" })).toThrow();
    const result = DeleteEntrySchema.parse({ entryId: "entry123", version: 3 });
    expect(result.entryId).toBe("entry123");
    expect(result.version).toBe(3);
  });

  it("PublishEntrySchema requires entryId and version", () => {
    const result = PublishEntrySchema.parse({ entryId: "e1", version: 2 });
    expect(result.entryId).toBe("e1");
  });

  it("UnpublishEntrySchema requires entryId and version", () => {
    const result = UnpublishEntrySchema.parse({ entryId: "e1", version: 4 });
    expect(result.version).toBe(4);
  });
});

describe("Asset schemas", () => {
  it("ListAssetsSchema applies defaults", () => {
    const result = ListAssetsSchema.parse({});
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(0);
  });

  it("ListAssetsSchema accepts filters", () => {
    const result = ListAssetsSchema.parse({
      mimetype_group: "image",
      query: "logo",
      limit: 10,
    });
    expect(result.mimetype_group).toBe("image");
  });

  it("UploadAssetSchema validates URL and applies locale default", () => {
    expect(() =>
      UploadAssetSchema.parse({
        title: "Logo",
        fileName: "logo.png",
        contentType: "image/png",
        uploadUrl: "not-a-url",
      }),
    ).toThrow();

    const result = UploadAssetSchema.parse({
      title: "Logo",
      fileName: "logo.png",
      contentType: "image/png",
      uploadUrl: "https://example.com/logo.png",
    });
    expect(result.locale).toBe("en-US");
    expect(result.title).toBe("Logo");
  });

  it("UploadAssetSchema accepts custom locale", () => {
    const result = UploadAssetSchema.parse({
      title: "Logo",
      fileName: "logo.png",
      contentType: "image/png",
      uploadUrl: "https://example.com/logo.png",
      locale: "de-DE",
    });
    expect(result.locale).toBe("de-DE");
  });
});

describe("Tag schemas", () => {
  it("ListTagsSchema applies defaults", () => {
    const result = ListTagsSchema.parse({});
    expect(result.limit).toBe(25);
    expect(result.skip).toBe(0);
  });
});

describe("Bulk publish schema", () => {
  it("BulkPublishSchema requires at least one entity", () => {
    expect(() => BulkPublishSchema.parse({ entities: [] })).toThrow();
  });

  it("BulkPublishSchema accepts entries and assets", () => {
    const result = BulkPublishSchema.parse({
      entities: [
        { sys: { type: "Link", linkType: "Entry", id: "e1", version: 2 } },
        { sys: { type: "Link", linkType: "Asset", id: "a1", version: 1 } },
      ],
    });
    expect(result.entities).toHaveLength(2);
  });

  it("BulkPublishSchema rejects invalid linkType", () => {
    expect(() =>
      BulkPublishSchema.parse({
        entities: [
          { sys: { type: "Link", linkType: "Tag", id: "t1", version: 1 } },
        ],
      }),
    ).toThrow();
  });
});
