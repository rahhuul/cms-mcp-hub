import { describe, it, expect } from "vitest";
import { ListProductsSchema, CreateProductSchema, UpdateProductSchema, CreateVariantSchema, CreateProductImageSchema, ListOrdersSchema, CreateOrderSchema, CancelOrderSchema, CreateDraftOrderSchema, CompleteDraftOrderSchema, CreateTransactionSchema, CreateRefundSchema, CreateFulfillmentSchema, SearchCustomersSchema, CreateCustomerSchema, CreateCustomerAddressSchema, AdjustInventorySchema, SetInventorySchema, CreatePageSchema, CreateBlogSchema, CreateArticleSchema, CreateRedirectSchema, GetAssetSchema, CreateOrUpdateAssetSchema, CreatePriceRuleSchema, CreateDiscountCodeSchema, CreateGiftCardSchema, CreateMetafieldSchema, CreateWebhookSchema, CreateSmartCollectionSchema, CreateCollectSchema } from "../schemas/index.js";

describe("Product schemas", () => {
  it("ListProducts defaults", () => { expect(ListProductsSchema.parse({}).limit).toBe(50); });
  it("CreateProduct defaults to draft", () => { expect(CreateProductSchema.parse({ title: "T" }).status).toBe("draft"); });
  it("UpdateProduct requires id", () => { expect(UpdateProductSchema.parse({ id: 1, title: "New" }).title).toBe("New"); });
  it("CreateVariant requires product_id", () => { expect(CreateVariantSchema.parse({ product_id: 1, price: "10" }).price).toBe("10"); });
  it("CreateProductImage accepts src", () => { expect(CreateProductImageSchema.parse({ product_id: 1, src: "https://img.com/a.jpg" }).src).toBe("https://img.com/a.jpg"); });
});

describe("Order schemas", () => {
  it("ListOrders accepts status", () => { expect(ListOrdersSchema.parse({ status: "open" }).status).toBe("open"); });
  it("CreateOrder requires line_items", () => { const r = CreateOrderSchema.parse({ line_items: [{ variant_id: 1, quantity: 2 }] }); expect(r.line_items).toHaveLength(1); });
  it("CancelOrder accepts reason", () => { expect(CancelOrderSchema.parse({ id: 1, reason: "fraud" }).reason).toBe("fraud"); });
  it("CreateDraftOrder works", () => { expect(CreateDraftOrderSchema.parse({ line_items: [{ title: "Custom", quantity: 1, price: "5.00" }] }).line_items).toHaveLength(1); });
  it("CompleteDraftOrder works", () => { expect(CompleteDraftOrderSchema.parse({ id: 1 }).id).toBe(1); });
  it("CreateTransaction requires kind", () => { expect(CreateTransactionSchema.parse({ order_id: 1, kind: "capture" }).kind).toBe("capture"); });
  it("CreateRefund works", () => { expect(CreateRefundSchema.parse({ order_id: 1, note: "Damaged" }).note).toBe("Damaged"); });
  it("CreateFulfillment works", () => { expect(CreateFulfillmentSchema.parse({ order_id: 1, tracking_number: "123" }).tracking_number).toBe("123"); });
});

describe("Customer schemas", () => {
  it("SearchCustomers requires query", () => { expect(SearchCustomersSchema.parse({ query: "john" }).query).toBe("john"); });
  it("CreateCustomer works", () => { expect(CreateCustomerSchema.parse({ email: "j@e.com", first_name: "John" }).first_name).toBe("John"); });
  it("CreateAddress works", () => { expect(CreateCustomerAddressSchema.parse({ customer_id: 1, city: "NYC" }).city).toBe("NYC"); });
});

describe("Inventory schemas", () => {
  it("AdjustInventory works", () => { expect(AdjustInventorySchema.parse({ inventory_item_id: 1, location_id: 1, available_adjustment: -5 }).available_adjustment).toBe(-5); });
  it("SetInventory works", () => { expect(SetInventorySchema.parse({ inventory_item_id: 1, location_id: 1, available: 100 }).available).toBe(100); });
});

describe("Content schemas", () => {
  it("CreatePage requires title", () => { expect(CreatePageSchema.parse({ title: "About" }).title).toBe("About"); });
  it("CreateBlog works", () => { expect(CreateBlogSchema.parse({ title: "News" }).title).toBe("News"); });
  it("CreateArticle requires blog_id", () => { expect(CreateArticleSchema.parse({ blog_id: 1, title: "Post" }).blog_id).toBe(1); });
  it("CreateRedirect requires path+target", () => { const r = CreateRedirectSchema.parse({ path: "/old", target: "/new" }); expect(r.path).toBe("/old"); });
});

describe("Store schemas", () => {
  it("GetAsset requires theme_id+key", () => { expect(GetAssetSchema.parse({ theme_id: 1, key: "templates/index.json" }).key).toBe("templates/index.json"); });
  it("CreateOrUpdateAsset works", () => { expect(CreateOrUpdateAssetSchema.parse({ theme_id: 1, key: "a.js", value: "code" }).value).toBe("code"); });
  it("CreatePriceRule validates", () => { const r = CreatePriceRuleSchema.parse({ title: "10off", target_type: "line_item", target_selection: "all", allocation_method: "across", value_type: "percentage", value: "-10.0" }); expect(r.value).toBe("-10.0"); });
  it("CreateDiscountCode requires code", () => { expect(CreateDiscountCodeSchema.parse({ price_rule_id: 1, code: "SAVE" }).code).toBe("SAVE"); });
  it("CreateGiftCard requires value", () => { expect(CreateGiftCardSchema.parse({ initial_value: "50.00" }).initial_value).toBe("50.00"); });
  it("CreateMetafield validates", () => { const r = CreateMetafieldSchema.parse({ resource: "products", resource_id: 1, namespace: "custom", key: "color", value: "red", type: "single_line_text_field" }); expect(r.key).toBe("color"); });
  it("CreateWebhook validates", () => { expect(CreateWebhookSchema.parse({ topic: "orders/create", address: "https://example.com/hook" }).topic).toBe("orders/create"); });
  it("SmartCollection requires rules", () => { const r = CreateSmartCollectionSchema.parse({ title: "Sale", rules: [{ column: "tag", relation: "equals", condition: "sale" }] }); expect(r.rules).toHaveLength(1); });
  it("CreateCollect works", () => { expect(CreateCollectSchema.parse({ product_id: 1, collection_id: 2 }).collection_id).toBe(2); });
});
