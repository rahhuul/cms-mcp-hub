import { describe, it, expect } from "vitest";
import {
  CreateCollectionSchema,
  CreateCollectionFieldSchema,
  CreateCollectionItemSchema,
  UpdateCollectionItemSchema,
  DeleteCollectionItemSchema,
  GetCollectionSchema,
  GetPageSchema,
  UpdatePageSchema,
  CreateCodeFileSchema,
  UpdateCodeFileSchema,
  GetCodeFileSchema,
  PromoteToProductionSchema,
  UpdateProjectSettingsSchema,
} from "../schemas/index.js";

describe("Collection schemas", () => {
  it("validates CreateCollectionSchema", () => {
    const result = CreateCollectionSchema.parse({ name: "Blog Posts" });
    expect(result.name).toBe("Blog Posts");
  });

  it("rejects empty name in CreateCollectionSchema", () => {
    expect(() => CreateCollectionSchema.parse({ name: "" })).toThrow();
  });

  it("validates GetCollectionSchema", () => {
    const result = GetCollectionSchema.parse({ collectionId: "abc123" });
    expect(result.collectionId).toBe("abc123");
  });

  it("validates CreateCollectionFieldSchema", () => {
    const result = CreateCollectionFieldSchema.parse({
      collectionId: "col1",
      name: "Title",
      type: "string",
    });
    expect(result.type).toBe("string");
    expect(result.required).toBe(false);
  });

  it("validates enum field with cases", () => {
    const result = CreateCollectionFieldSchema.parse({
      collectionId: "col1",
      name: "Status",
      type: "enum",
      enumCases: [{ name: "Draft" }, { name: "Published" }],
    });
    expect(result.enumCases).toHaveLength(2);
  });

  it("validates CreateCollectionItemSchema with defaults", () => {
    const result = CreateCollectionItemSchema.parse({
      collectionId: "col1",
      slug: "my-post",
    });
    expect(result.draft).toBe(false);
    expect(result.fieldData).toEqual({});
  });

  it("validates UpdateCollectionItemSchema", () => {
    const result = UpdateCollectionItemSchema.parse({
      collectionId: "col1",
      itemId: "item1",
      slug: "new-slug",
    });
    expect(result.slug).toBe("new-slug");
    expect(result.fieldData).toBeUndefined();
  });

  it("validates DeleteCollectionItemSchema", () => {
    const result = DeleteCollectionItemSchema.parse({
      itemIds: ["item1", "item2"],
    });
    expect(result.itemIds).toHaveLength(2);
  });

  it("rejects empty itemIds in DeleteCollectionItemSchema", () => {
    expect(() => DeleteCollectionItemSchema.parse({ itemIds: [] })).toThrow();
  });
});

describe("Page schemas", () => {
  it("validates GetPageSchema", () => {
    const result = GetPageSchema.parse({ pageId: "page1" });
    expect(result.pageId).toBe("page1");
  });

  it("validates UpdatePageSchema with partial fields", () => {
    const result = UpdatePageSchema.parse({
      pageId: "page1",
      title: "New Title",
    });
    expect(result.title).toBe("New Title");
    expect(result.path).toBeUndefined();
    expect(result.visible).toBeUndefined();
  });
});

describe("Code file schemas", () => {
  it("validates CreateCodeFileSchema", () => {
    const result = CreateCodeFileSchema.parse({
      name: "Button.tsx",
      code: "export function Button() { return <button>Click</button> }",
    });
    expect(result.name).toBe("Button.tsx");
  });

  it("validates UpdateCodeFileSchema", () => {
    const result = UpdateCodeFileSchema.parse({
      codeFileId: "file1",
      code: "export function Updated() {}",
    });
    expect(result.codeFileId).toBe("file1");
  });

  it("validates GetCodeFileSchema", () => {
    const result = GetCodeFileSchema.parse({ codeFileId: "file1" });
    expect(result.codeFileId).toBe("file1");
  });
});

describe("Publishing schemas", () => {
  it("validates PromoteToProductionSchema", () => {
    const result = PromoteToProductionSchema.parse({
      deploymentId: "deploy1",
    });
    expect(result.deploymentId).toBe("deploy1");
    expect(result.domains).toBeUndefined();
  });

  it("validates PromoteToProductionSchema with domains", () => {
    const result = PromoteToProductionSchema.parse({
      deploymentId: "deploy1",
      domains: ["example.com", "www.example.com"],
    });
    expect(result.domains).toHaveLength(2);
  });
});

describe("Project schemas", () => {
  it("validates UpdateProjectSettingsSchema with custom code", () => {
    const result = UpdateProjectSettingsSchema.parse({
      customCode: {
        location: "headEnd",
        html: "<script>console.log('hello')</script>",
      },
    });
    expect(result.customCode?.location).toBe("headEnd");
  });

  it("validates UpdateProjectSettingsSchema with no fields", () => {
    const result = UpdateProjectSettingsSchema.parse({});
    expect(result.customCode).toBeUndefined();
  });
});
