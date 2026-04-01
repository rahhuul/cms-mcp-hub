import { describe, it, expect } from "vitest";
import {
  ListSitesSchema,
  GetSiteSchema,
  ListCollectionsSchema,
  GetCollectionSchema,
  ListItemsSchema,
  GetItemSchema,
  CreateItemSchema,
  UpdateItemSchema,
  DeleteItemSchema,
  PublishItemsSchema,
  ListPagesSchema,
  GetPageSchema,
  UpdatePageSchema,
  ListProductsSchema,
  CreateProductSchema,
  ListOrdersSchema,
  GetOrderSchema,
  PublishSiteSchema,
  ListDomainsSchema,
  ListWebhooksSchema,
} from "../schemas/index.js";

describe("Site schemas", () => {
  it("ListSitesSchema accepts empty object", () => {
    const result = ListSitesSchema.parse({});
    expect(result).toEqual({});
  });

  it("GetSiteSchema requires siteId", () => {
    expect(() => GetSiteSchema.parse({})).toThrow();
    const result = GetSiteSchema.parse({ siteId: "site123" });
    expect(result.siteId).toBe("site123");
  });
});

describe("Collection schemas", () => {
  it("ListCollectionsSchema requires siteId", () => {
    expect(() => ListCollectionsSchema.parse({})).toThrow();
    const result = ListCollectionsSchema.parse({ siteId: "site123" });
    expect(result.siteId).toBe("site123");
  });

  it("GetCollectionSchema requires collectionId", () => {
    expect(() => GetCollectionSchema.parse({})).toThrow();
    const result = GetCollectionSchema.parse({ collectionId: "col123" });
    expect(result.collectionId).toBe("col123");
  });
});

describe("Item schemas", () => {
  it("ListItemsSchema applies defaults", () => {
    const result = ListItemsSchema.parse({ collectionId: "col123" });
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
    expect(result.collectionId).toBe("col123");
  });

  it("ListItemsSchema accepts all params", () => {
    const result = ListItemsSchema.parse({
      collectionId: "col123",
      limit: 50,
      offset: 10,
      cmsLocaleId: "en",
      sortBy: "name",
      sortOrder: "asc",
    });
    expect(result.limit).toBe(50);
    expect(result.sortBy).toBe("name");
  });

  it("GetItemSchema requires collectionId and itemId", () => {
    expect(() => GetItemSchema.parse({})).toThrow();
    expect(() => GetItemSchema.parse({ collectionId: "col123" })).toThrow();
    const result = GetItemSchema.parse({ collectionId: "col123", itemId: "item456" });
    expect(result.itemId).toBe("item456");
  });

  it("CreateItemSchema requires collectionId and fieldData", () => {
    expect(() => CreateItemSchema.parse({ collectionId: "col123" })).toThrow();
    const result = CreateItemSchema.parse({
      collectionId: "col123",
      fieldData: { name: "Test Item", slug: "test-item" },
    });
    expect(result.fieldData).toHaveProperty("name");
    expect(result.isArchived).toBe(false);
    expect(result.isDraft).toBe(false);
  });

  it("UpdateItemSchema requires collectionId, itemId, and fieldData", () => {
    const result = UpdateItemSchema.parse({
      collectionId: "col123",
      itemId: "item456",
      fieldData: { name: "Updated" },
      isDraft: true,
    });
    expect(result.isDraft).toBe(true);
    expect(result.fieldData).toHaveProperty("name");
  });

  it("DeleteItemSchema requires collectionId and itemId", () => {
    const result = DeleteItemSchema.parse({
      collectionId: "col123",
      itemId: "item456",
    });
    expect(result.itemId).toBe("item456");
  });

  it("PublishItemsSchema requires itemIds array", () => {
    expect(() => PublishItemsSchema.parse({ collectionId: "col123", itemIds: [] })).toThrow();
    const result = PublishItemsSchema.parse({
      collectionId: "col123",
      itemIds: ["item1", "item2"],
    });
    expect(result.itemIds).toHaveLength(2);
  });
});

describe("Page schemas", () => {
  it("ListPagesSchema applies defaults", () => {
    const result = ListPagesSchema.parse({ siteId: "site123" });
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it("GetPageSchema requires pageId", () => {
    expect(() => GetPageSchema.parse({})).toThrow();
    const result = GetPageSchema.parse({ pageId: "page123" });
    expect(result.pageId).toBe("page123");
  });

  it("UpdatePageSchema requires pageId", () => {
    const result = UpdatePageSchema.parse({
      pageId: "page123",
      title: "New Title",
      slug: "new-slug",
      seo: { title: "SEO Title", description: "SEO Desc" },
    });
    expect(result.title).toBe("New Title");
    expect(result.seo?.title).toBe("SEO Title");
  });
});

describe("Product schemas", () => {
  it("ListProductsSchema applies defaults", () => {
    const result = ListProductsSchema.parse({ siteId: "site123" });
    expect(result.limit).toBe(25);
  });

  it("CreateProductSchema requires product fieldData", () => {
    const result = CreateProductSchema.parse({
      siteId: "site123",
      product: {
        fieldData: { name: "Widget", slug: "widget", description: "A widget" },
      },
    });
    expect(result.product.fieldData).toHaveProperty("name");
    expect(result.isArchived).toBe(false);
  });
});

describe("Order schemas", () => {
  it("ListOrdersSchema accepts status filter", () => {
    const result = ListOrdersSchema.parse({
      siteId: "site123",
      status: "fulfilled",
    });
    expect(result.status).toBe("fulfilled");
  });

  it("ListOrdersSchema rejects invalid status", () => {
    expect(() => ListOrdersSchema.parse({ siteId: "site123", status: "invalid" })).toThrow();
  });

  it("GetOrderSchema requires siteId and orderId", () => {
    const result = GetOrderSchema.parse({ siteId: "site123", orderId: "ord456" });
    expect(result.orderId).toBe("ord456");
  });
});

describe("Publish schema", () => {
  it("PublishSiteSchema requires siteId", () => {
    const result = PublishSiteSchema.parse({ siteId: "site123" });
    expect(result.siteId).toBe("site123");
    expect(result.domains).toBeUndefined();
  });

  it("PublishSiteSchema accepts domains", () => {
    const result = PublishSiteSchema.parse({
      siteId: "site123",
      domains: ["domain1", "domain2"],
    });
    expect(result.domains).toHaveLength(2);
  });
});

describe("Domain schema", () => {
  it("ListDomainsSchema requires siteId", () => {
    const result = ListDomainsSchema.parse({ siteId: "site123" });
    expect(result.siteId).toBe("site123");
  });
});

describe("Webhook schema", () => {
  it("ListWebhooksSchema requires siteId", () => {
    const result = ListWebhooksSchema.parse({ siteId: "site123" });
    expect(result.siteId).toBe("site123");
  });
});
