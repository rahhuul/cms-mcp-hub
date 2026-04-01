import { describe, it, expect } from "vitest";
import {
  QuerySchema,
  GetDocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  DeleteDocumentSchema,
  ListDatasetsSchema,
  ListDocumentTypesSchema,
  ListAssetsSchema,
  UploadImageSchema,
  CreateTransactionSchema,
  GetHistorySchema,
  PublishDraftSchema,
} from "../schemas/index.js";

describe("Query schema", () => {
  it("requires a query string", () => {
    expect(QuerySchema.parse({ query: '*[_type == "post"]' }).query).toBe('*[_type == "post"]');
  });

  it("rejects empty query", () => {
    expect(() => QuerySchema.parse({ query: "" })).toThrow();
  });

  it("accepts optional params", () => {
    const result = QuerySchema.parse({ query: "*[_type == $type]", params: { type: "post" } });
    expect(result.params).toEqual({ type: "post" });
  });
});

describe("Document schemas", () => {
  it("GetDocument requires id", () => {
    expect(GetDocumentSchema.parse({ id: "abc123" }).id).toBe("abc123");
  });

  it("GetDocument rejects empty id", () => {
    expect(() => GetDocumentSchema.parse({ id: "" })).toThrow();
  });

  it("CreateDocument requires _type and data", () => {
    const result = CreateDocumentSchema.parse({ _type: "post", data: { title: "Hello" } });
    expect(result._type).toBe("post");
    expect(result.data).toEqual({ title: "Hello" });
  });

  it("CreateDocument accepts optional _id", () => {
    const result = CreateDocumentSchema.parse({ _type: "post", _id: "custom-id", data: { title: "Test" } });
    expect(result._id).toBe("custom-id");
  });

  it("UpdateDocument requires id", () => {
    const result = UpdateDocumentSchema.parse({ id: "abc123", set: { title: "Updated" } });
    expect(result.id).toBe("abc123");
    expect(result.set).toEqual({ title: "Updated" });
  });

  it("UpdateDocument accepts unset", () => {
    const result = UpdateDocumentSchema.parse({ id: "abc123", unset: ["description"] });
    expect(result.unset).toEqual(["description"]);
  });

  it("UpdateDocument accepts ifRevisionID", () => {
    const result = UpdateDocumentSchema.parse({ id: "abc123", set: { title: "X" }, ifRevisionID: "rev1" });
    expect(result.ifRevisionID).toBe("rev1");
  });

  it("DeleteDocument requires id", () => {
    expect(DeleteDocumentSchema.parse({ id: "abc123" }).id).toBe("abc123");
  });
});

describe("Dataset schemas", () => {
  it("ListDatasets accepts empty object", () => {
    expect(ListDatasetsSchema.parse({})).toEqual({});
  });
});

describe("Document type schemas", () => {
  it("ListDocumentTypes accepts empty object", () => {
    expect(ListDocumentTypesSchema.parse({})).toEqual({});
  });
});

describe("Asset schemas", () => {
  it("ListAssets defaults to image type", () => {
    const result = ListAssetsSchema.parse({});
    expect(result.type).toBe("image");
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it("ListAssets accepts file type", () => {
    expect(ListAssetsSchema.parse({ type: "file" }).type).toBe("file");
  });

  it("ListAssets respects limit bounds", () => {
    expect(() => ListAssetsSchema.parse({ limit: 0 })).toThrow();
    expect(() => ListAssetsSchema.parse({ limit: 101 })).toThrow();
    expect(ListAssetsSchema.parse({ limit: 50 }).limit).toBe(50);
  });

  it("UploadImage requires url", () => {
    expect(UploadImageSchema.parse({ url: "https://example.com/img.jpg" }).url).toBe("https://example.com/img.jpg");
  });

  it("UploadImage rejects invalid url", () => {
    expect(() => UploadImageSchema.parse({ url: "not-a-url" })).toThrow();
  });

  it("UploadImage accepts optional filename", () => {
    const result = UploadImageSchema.parse({ url: "https://example.com/img.jpg", filename: "photo.jpg" });
    expect(result.filename).toBe("photo.jpg");
  });
});

describe("Transaction schema", () => {
  it("requires at least one mutation", () => {
    expect(() => CreateTransactionSchema.parse({ mutations: [] })).toThrow();
  });

  it("accepts mutations array", () => {
    const result = CreateTransactionSchema.parse({
      mutations: [{ create: { _type: "post", title: "Hello" } }],
    });
    expect(result.mutations).toHaveLength(1);
    expect(result.returnIds).toBe(true);
    expect(result.visibility).toBe("sync");
  });

  it("accepts visibility option", () => {
    const result = CreateTransactionSchema.parse({
      mutations: [{ delete: { id: "abc" } }],
      visibility: "async",
    });
    expect(result.visibility).toBe("async");
  });
});

describe("History schema", () => {
  it("requires documentId", () => {
    expect(GetHistorySchema.parse({ documentId: "abc123" }).documentId).toBe("abc123");
  });

  it("rejects empty documentId", () => {
    expect(() => GetHistorySchema.parse({ documentId: "" })).toThrow();
  });
});

describe("Publishing schema", () => {
  it("PublishDraft requires draftId", () => {
    expect(PublishDraftSchema.parse({ draftId: "drafts.abc123" }).draftId).toBe("drafts.abc123");
  });

  it("PublishDraft accepts id without drafts prefix", () => {
    expect(PublishDraftSchema.parse({ draftId: "abc123" }).draftId).toBe("abc123");
  });

  it("PublishDraft rejects empty draftId", () => {
    expect(() => PublishDraftSchema.parse({ draftId: "" })).toThrow();
  });
});
