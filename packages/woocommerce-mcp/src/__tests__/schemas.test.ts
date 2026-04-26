import { describe, it, expect } from "vitest";
import {
  ListProductsSchema, CreateProductSchema, DeleteProductSchema,
  GetProductVariationSchema, CreateProductVariationSchema, UpdateProductVariationSchema,
  CreateProductAttributeSchema,
  CreateAttributeTermSchema,
  GetCategorySchema, UpdateCategorySchema,
  CreateTagSchema, UpdateTagSchema, DeleteTagSchema,
  CreateShippingClassSchema,
  CreateProductReviewSchema, UpdateProductReviewSchema,
  CreateOrderSchema, DeleteOrderSchema,
  CreateOrderNoteSchema,
  CreateOrderRefundSchema,
  UpdateCustomerSchema, DeleteCustomerSchema, GetCustomerDownloadsSchema,
  GetCouponSchema, UpdateCouponSchema, DeleteCouponSchema,
  CreateTaxRateSchema, CreateTaxClassSchema, DeleteTaxClassSchema,
  CreateWebhookSchema, UpdateWebhookSchema,
  GetReportsTotalsSchema,
  UpdateSettingSchema, UpdatePaymentGatewaySchema,
  RunSystemStatusToolSchema, ListDataSchema, GetDataItemSchema,
  BatchUpdateSchema,
} from "../schemas/index.js";

describe("Product schemas", () => {
  it("ListProductsSchema applies defaults", () => {
    const r = ListProductsSchema.parse({});
    expect(r.page).toBe(1); expect(r.per_page).toBe(25);
  });
  it("CreateProductSchema applies defaults", () => {
    const r = CreateProductSchema.parse({ name: "Test" });
    expect(r.type).toBe("simple"); expect(r.status).toBe("draft");
  });
  it("DeleteProductSchema defaults force to false", () => {
    expect(DeleteProductSchema.parse({ product_id: 1 }).force).toBe(false);
  });
});

describe("Variation schemas", () => {
  it("GetProductVariationSchema requires both IDs", () => {
    const r = GetProductVariationSchema.parse({ product_id: 10, variation_id: 5 });
    expect(r.variation_id).toBe(5);
  });
  it("UpdateProductVariationSchema works", () => {
    const r = UpdateProductVariationSchema.parse({ product_id: 1, variation_id: 2, regular_price: "9.99" });
    expect(r.regular_price).toBe("9.99");
  });
  it("CreateProductVariationSchema requires attributes", () => {
    const r = CreateProductVariationSchema.parse({ product_id: 1, attributes: [{ name: "Size", option: "L" }] });
    expect(r.attributes).toHaveLength(1);
  });
});

describe("Attribute schemas", () => {
  it("CreateProductAttributeSchema requires name", () => {
    const r = CreateProductAttributeSchema.parse({ name: "Color" });
    expect(r.type).toBe("select");
  });
  it("CreateAttributeTermSchema requires attribute_id and name", () => {
    const r = CreateAttributeTermSchema.parse({ attribute_id: 1, name: "Red" });
    expect(r.name).toBe("Red");
  });
});

describe("Category & Tag schemas", () => {
  it("GetCategorySchema requires ID", () => { expect(GetCategorySchema.parse({ category_id: 5 }).category_id).toBe(5); });
  it("UpdateCategorySchema works", () => { expect(UpdateCategorySchema.parse({ category_id: 1, name: "New" }).name).toBe("New"); });
  it("CreateTagSchema requires name", () => { expect(CreateTagSchema.parse({ name: "Sale" }).name).toBe("Sale"); });
  it("UpdateTagSchema works", () => { expect(UpdateTagSchema.parse({ tag_id: 1, name: "Updated" }).name).toBe("Updated"); });
  it("DeleteTagSchema defaults force", () => { expect(DeleteTagSchema.parse({ tag_id: 1 }).force).toBe(false); });
});

describe("Shipping class schemas", () => {
  it("CreateShippingClassSchema requires name", () => { expect(CreateShippingClassSchema.parse({ name: "Heavy" }).name).toBe("Heavy"); });
});

describe("Review schemas", () => {
  it("CreateProductReviewSchema validates", () => {
    const r = CreateProductReviewSchema.parse({ product_id: 1, review: "Great!", reviewer: "John", reviewer_email: "j@e.com", rating: 5 });
    expect(r.rating).toBe(5);
  });
  it("rejects invalid rating", () => { expect(() => CreateProductReviewSchema.parse({ product_id: 1, review: "x", reviewer: "x", reviewer_email: "x@x.com", rating: 6 })).toThrow(); });
  it("UpdateProductReviewSchema accepts status", () => { expect(UpdateProductReviewSchema.parse({ review_id: 1, status: "approved" }).status).toBe("approved"); });
});

describe("Order schemas", () => {
  it("CreateOrderSchema applies defaults", () => { expect(CreateOrderSchema.parse({}).status).toBe("pending"); });
  it("CreateOrderSchema accepts full order", () => {
    const r = CreateOrderSchema.parse({ line_items: [{ product_id: 1, quantity: 2 }], set_paid: true });
    expect(r.line_items).toHaveLength(1); expect(r.set_paid).toBe(true);
  });
  it("DeleteOrderSchema works", () => { expect(DeleteOrderSchema.parse({ order_id: 1, force: true }).force).toBe(true); });
});

describe("Order Note schemas", () => {
  it("CreateOrderNoteSchema defaults customer_note", () => {
    const r = CreateOrderNoteSchema.parse({ order_id: 1, note: "Test note" });
    expect(r.customer_note).toBe(false);
  });
});

describe("Order Refund schemas", () => {
  it("CreateOrderRefundSchema defaults api_refund", () => {
    const r = CreateOrderRefundSchema.parse({ order_id: 1 });
    expect(r.api_refund).toBe(true);
  });
  it("CreateOrderRefundSchema accepts line items", () => {
    const r = CreateOrderRefundSchema.parse({ order_id: 1, amount: "10.00", reason: "Damaged", line_items: [{ id: 5, quantity: 1 }] });
    expect(r.line_items).toHaveLength(1);
  });
});

describe("Customer schemas", () => {
  it("UpdateCustomerSchema works", () => { expect(UpdateCustomerSchema.parse({ customer_id: 1, first_name: "Jane" }).first_name).toBe("Jane"); });
  it("DeleteCustomerSchema accepts reassign", () => { expect(DeleteCustomerSchema.parse({ customer_id: 1, reassign: 2 }).reassign).toBe(2); });
  it("GetCustomerDownloadsSchema works", () => { expect(GetCustomerDownloadsSchema.parse({ customer_id: 1 }).customer_id).toBe(1); });
});

describe("Coupon schemas", () => {
  it("GetCouponSchema works", () => { expect(GetCouponSchema.parse({ coupon_id: 5 }).coupon_id).toBe(5); });
  it("UpdateCouponSchema works", () => { expect(UpdateCouponSchema.parse({ coupon_id: 1, amount: "20" }).amount).toBe("20"); });
  it("DeleteCouponSchema works", () => { expect(DeleteCouponSchema.parse({ coupon_id: 1 }).force).toBe(false); });
});

describe("Tax schemas", () => {
  it("CreateTaxRateSchema requires rate and name", () => {
    const r = CreateTaxRateSchema.parse({ rate: "10.0000", name: "State Tax", country: "US", state: "CA" });
    expect(r.rate).toBe("10.0000");
  });
  it("CreateTaxClassSchema requires name", () => { expect(CreateTaxClassSchema.parse({ name: "Reduced" }).name).toBe("Reduced"); });
  it("DeleteTaxClassSchema requires slug", () => { expect(DeleteTaxClassSchema.parse({ slug: "reduced" }).slug).toBe("reduced"); });
});

describe("Webhook schemas", () => {
  it("CreateWebhookSchema validates", () => {
    const r = CreateWebhookSchema.parse({ name: "Order Hook", topic: "order.created", delivery_url: "https://example.com/hook" });
    expect(r.status).toBe("active");
  });
  it("UpdateWebhookSchema accepts partial", () => { expect(UpdateWebhookSchema.parse({ webhook_id: 1, status: "paused" }).status).toBe("paused"); });
});

describe("Report schemas", () => {
  it("GetReportsTotalsSchema requires resource", () => {
    expect(GetReportsTotalsSchema.parse({ resource: "orders" }).resource).toBe("orders");
  });
  it("rejects invalid resource", () => { expect(() => GetReportsTotalsSchema.parse({ resource: "invalid" })).toThrow(); });
});

describe("Settings schemas", () => {
  it("UpdateSettingSchema validates", () => {
    const r = UpdateSettingSchema.parse({ group: "general", setting_id: "woocommerce_currency", value: "EUR" });
    expect(r.value).toBe("EUR");
  });
  it("UpdatePaymentGatewaySchema validates", () => {
    const r = UpdatePaymentGatewaySchema.parse({ gateway_id: "stripe", enabled: true });
    expect(r.enabled).toBe(true);
  });
});

describe("System & Data schemas", () => {
  it("RunSystemStatusToolSchema validates", () => { expect(RunSystemStatusToolSchema.parse({ tool_id: "clear_transients" }).tool_id).toBe("clear_transients"); });
  it("ListDataSchema accepts endpoint", () => { expect(ListDataSchema.parse({ endpoint: "countries" }).endpoint).toBe("countries"); });
  it("GetDataItemSchema validates", () => { expect(GetDataItemSchema.parse({ endpoint: "currencies", code: "USD" }).code).toBe("USD"); });
});

describe("Batch schema", () => {
  it("accepts expanded resource list", () => {
    for (const r of ["products", "orders", "coupons", "customers", "products/categories", "products/tags", "products/attributes", "products/reviews", "taxes", "webhooks", "products/shipping_classes"] as const) {
      expect(BatchUpdateSchema.parse({ resource: r }).resource).toBe(r);
    }
  });
});
