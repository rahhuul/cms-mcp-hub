import { describe, it, expect } from "vitest";
import {
  ListDataCollectionsSchema,
  GetDataCollectionSchema,
  QueryDataItemsSchema,
  GetDataItemSchema,
  InsertDataItemSchema,
  UpdateDataItemSchema,
  RemoveDataItemSchema,
  BulkInsertDataItemsSchema,
  ListContactsSchema,
  CreateContactSchema,
  ListProductsSchema,
  GetProductSchema,
  ListOrdersSchema,
  GetOrderSchema,
  ListBlogPostsSchema,
  CreateBlogPostSchema,
  ListBookingServicesSchema,
  GetSitePropertiesSchema,
} from "../schemas/index.js";

describe("Data Collection schemas", () => {
  it("ListDataCollections applies defaults", () => {
    const r = ListDataCollectionsSchema.parse({});
    expect(r.limit).toBe(25);
    expect(r.offset).toBe(0);
  });

  it("GetDataCollection requires collectionId", () => {
    expect(GetDataCollectionSchema.parse({ collectionId: "Products" }).collectionId).toBe("Products");
  });

  it("GetDataCollection rejects empty collectionId", () => {
    expect(() => GetDataCollectionSchema.parse({ collectionId: "" })).toThrow();
  });
});

describe("Data Item schemas", () => {
  it("QueryDataItems applies defaults", () => {
    const r = QueryDataItemsSchema.parse({ collectionId: "Products" });
    expect(r.limit).toBe(25);
    expect(r.offset).toBe(0);
  });

  it("QueryDataItems accepts WQL filter", () => {
    const r = QueryDataItemsSchema.parse({
      collectionId: "Products",
      filter: { name: { $eq: "Widget" } },
    });
    expect(r.filter).toEqual({ name: { $eq: "Widget" } });
  });

  it("QueryDataItems accepts sort", () => {
    const r = QueryDataItemsSchema.parse({
      collectionId: "Products",
      sort: [{ fieldName: "name", order: "DESC" }],
    });
    expect(r.sort).toHaveLength(1);
    expect(r.sort![0]!.order).toBe("DESC");
  });

  it("GetDataItem requires both IDs", () => {
    const r = GetDataItemSchema.parse({ collectionId: "Products", itemId: "abc-123" });
    expect(r.collectionId).toBe("Products");
    expect(r.itemId).toBe("abc-123");
  });

  it("InsertDataItem requires collection and item", () => {
    const r = InsertDataItemSchema.parse({ collectionId: "Products", item: { name: "Widget", price: 9.99 } });
    expect(r.item.name).toBe("Widget");
  });

  it("UpdateDataItem requires all fields", () => {
    const r = UpdateDataItemSchema.parse({ collectionId: "Products", itemId: "abc", item: { name: "Updated" } });
    expect(r.itemId).toBe("abc");
  });

  it("RemoveDataItem requires both IDs", () => {
    const r = RemoveDataItemSchema.parse({ collectionId: "Products", itemId: "abc" });
    expect(r.itemId).toBe("abc");
  });

  it("BulkInsertDataItems accepts array of items", () => {
    const r = BulkInsertDataItemsSchema.parse({
      collectionId: "Products",
      items: [{ name: "A" }, { name: "B" }],
    });
    expect(r.items).toHaveLength(2);
  });

  it("BulkInsertDataItems rejects empty array", () => {
    expect(() => BulkInsertDataItemsSchema.parse({ collectionId: "Products", items: [] })).toThrow();
  });
});

describe("Contact schemas", () => {
  it("ListContacts applies defaults", () => {
    const r = ListContactsSchema.parse({});
    expect(r.limit).toBe(25);
  });

  it("CreateContact accepts full info", () => {
    const r = CreateContactSchema.parse({
      info: {
        name: { first: "John", last: "Doe" },
        emails: [{ email: "john@example.com", primary: true }],
        company: "Acme",
      },
    });
    expect(r.info.name?.first).toBe("John");
    expect(r.info.emails).toHaveLength(1);
  });
});

describe("Product schemas", () => {
  it("ListProducts applies defaults", () => {
    const r = ListProductsSchema.parse({});
    expect(r.limit).toBe(25);
  });

  it("GetProduct requires productId", () => {
    expect(GetProductSchema.parse({ productId: "prod-123" }).productId).toBe("prod-123");
  });
});

describe("Order schemas", () => {
  it("ListOrders applies defaults", () => {
    const r = ListOrdersSchema.parse({});
    expect(r.limit).toBe(25);
  });

  it("GetOrder requires orderId", () => {
    expect(GetOrderSchema.parse({ orderId: "ord-456" }).orderId).toBe("ord-456");
  });
});

describe("Blog schemas", () => {
  it("ListBlogPosts applies defaults", () => {
    const r = ListBlogPostsSchema.parse({});
    expect(r.limit).toBe(25);
  });

  it("ListBlogPosts accepts featured filter", () => {
    expect(ListBlogPostsSchema.parse({ featured: true }).featured).toBe(true);
  });

  it("CreateBlogPost requires title and defaults to DRAFT", () => {
    const r = CreateBlogPostSchema.parse({ title: "Hello World" });
    expect(r.title).toBe("Hello World");
    expect(r.status).toBe("DRAFT");
  });

  it("CreateBlogPost accepts tags and categories", () => {
    const r = CreateBlogPostSchema.parse({
      title: "Post",
      tags: ["news", "updates"],
      categoryIds: ["cat-1"],
    });
    expect(r.tags).toHaveLength(2);
    expect(r.categoryIds).toHaveLength(1);
  });
});

describe("Bookings schemas", () => {
  it("ListBookingServices applies defaults", () => {
    const r = ListBookingServicesSchema.parse({});
    expect(r.limit).toBe(25);
  });
});

describe("Site schemas", () => {
  it("GetSiteProperties accepts empty object", () => {
    expect(() => GetSitePropertiesSchema.parse({})).not.toThrow();
  });
});
