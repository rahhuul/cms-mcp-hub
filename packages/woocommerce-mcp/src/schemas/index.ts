/**
 * Zod schemas for all WooCommerce MCP tool inputs.
 * Full coverage of WooCommerce REST API v3.
 */

import { z } from "zod";

// ─── Common ───────────────────────────────────────────────────────────

const PaginationMixin = {
  page: z.number().min(1).default(1).describe("Page number (starts at 1)"),
  per_page: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
};

const ForceDeleteMixin = {
  force: z.boolean().default(false).describe("True to permanently delete (skip trash)"),
};

// ═══════════════════════════════════════════════════════════════════════
// PRODUCTS
// ═══════════════════════════════════════════════════════════════════════

export const ListProductsSchema = z.object({
  ...PaginationMixin,
  search: z.string().optional().describe("Search keyword"),
  status: z.enum(["publish", "draft", "pending", "private", "any"]).optional().describe("Product status filter"),
  category: z.number().optional().describe("Category ID to filter by"),
  tag: z.number().optional().describe("Tag ID to filter by"),
  sku: z.string().optional().describe("Filter by exact SKU"),
  orderby: z.enum(["date", "id", "title", "slug", "price", "popularity", "rating"]).optional().describe("Sort field"),
  order: z.enum(["asc", "desc"]).optional().describe("Sort direction"),
});

export const GetProductSchema = z.object({ product_id: z.number().describe("Product ID") });

export const CreateProductSchema = z.object({
  name: z.string().min(1).describe("Product name"),
  type: z.enum(["simple", "grouped", "external", "variable"]).default("simple").describe("Product type"),
  status: z.enum(["publish", "draft", "pending", "private"]).default("draft").describe("Product status"),
  regular_price: z.string().optional().describe("Regular price (e.g., '29.99')"),
  sale_price: z.string().optional().describe("Sale price"),
  description: z.string().optional().describe("Full product description (HTML allowed)"),
  short_description: z.string().optional().describe("Short description"),
  sku: z.string().optional().describe("Stock keeping unit"),
  categories: z.array(z.object({ id: z.number() })).optional().describe("Category IDs"),
  tags: z.array(z.object({ id: z.number() })).optional().describe("Tag IDs"),
  images: z.array(z.object({ src: z.string(), alt: z.string().optional() })).optional().describe("Product images"),
  manage_stock: z.boolean().optional().describe("Enable stock management"),
  stock_quantity: z.number().optional().describe("Stock quantity"),
  weight: z.string().optional().describe("Product weight"),
  dimensions: z.object({ length: z.string().optional(), width: z.string().optional(), height: z.string().optional() }).optional().describe("Product dimensions"),
  attributes: z.array(z.object({ name: z.string(), options: z.array(z.string()), visible: z.boolean().optional(), variation: z.boolean().optional() })).optional().describe("Product attributes"),
});

export const UpdateProductSchema = z.object({
  product_id: z.number().describe("Product ID to update"),
  name: z.string().optional(), status: z.enum(["publish", "draft", "pending", "private"]).optional(),
  regular_price: z.string().optional(), sale_price: z.string().optional(),
  description: z.string().optional(), short_description: z.string().optional(), sku: z.string().optional(),
  categories: z.array(z.object({ id: z.number() })).optional(),
  tags: z.array(z.object({ id: z.number() })).optional(),
  images: z.array(z.object({ src: z.string(), alt: z.string().optional() })).optional(),
  manage_stock: z.boolean().optional(), stock_quantity: z.number().optional(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]).optional(),
});

export const DeleteProductSchema = z.object({ product_id: z.number().describe("Product ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT VARIATIONS
// ═══════════════════════════════════════════════════════════════════════

export const ListProductVariationsSchema = z.object({ product_id: z.number().describe("Parent product ID"), ...PaginationMixin });

export const GetProductVariationSchema = z.object({ product_id: z.number().describe("Parent product ID"), variation_id: z.number().describe("Variation ID") });

export const CreateProductVariationSchema = z.object({
  product_id: z.number().describe("Parent product ID"),
  regular_price: z.string().optional(), sale_price: z.string().optional(), sku: z.string().optional(),
  manage_stock: z.boolean().optional(), stock_quantity: z.number().optional(),
  attributes: z.array(z.object({ name: z.string().describe("Attribute name"), option: z.string().describe("Attribute option value") })).describe("Variation attributes (one option per attribute)"),
});

export const UpdateProductVariationSchema = z.object({
  product_id: z.number().describe("Parent product ID"), variation_id: z.number().describe("Variation ID to update"),
  regular_price: z.string().optional(), sale_price: z.string().optional(), sku: z.string().optional(),
  manage_stock: z.boolean().optional(), stock_quantity: z.number().optional(),
  stock_status: z.enum(["instock", "outofstock", "onbackorder"]).optional(),
  attributes: z.array(z.object({ name: z.string(), option: z.string() })).optional(),
});

export const DeleteProductVariationSchema = z.object({ product_id: z.number().describe("Parent product ID"), variation_id: z.number().describe("Variation ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT ATTRIBUTES
// ═══════════════════════════════════════════════════════════════════════

export const ListProductAttributesSchema = z.object({});
export const GetProductAttributeSchema = z.object({ attribute_id: z.number().describe("Attribute ID") });
export const CreateProductAttributeSchema = z.object({
  name: z.string().min(1).describe("Attribute name (e.g., 'Color', 'Size')"),
  slug: z.string().optional().describe("URL slug"),
  type: z.enum(["select"]).default("select").describe("Attribute type"),
  order_by: z.enum(["menu_order", "name", "name_num", "id"]).optional().describe("Sort order for terms"),
  has_archives: z.boolean().optional().describe("Enable attribute archives"),
});
export const UpdateProductAttributeSchema = z.object({
  attribute_id: z.number().describe("Attribute ID to update"),
  name: z.string().optional(), slug: z.string().optional(),
  order_by: z.enum(["menu_order", "name", "name_num", "id"]).optional(),
});
export const DeleteProductAttributeSchema = z.object({ attribute_id: z.number().describe("Attribute ID to delete") });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT ATTRIBUTE TERMS
// ═══════════════════════════════════════════════════════════════════════

export const ListAttributeTermsSchema = z.object({ attribute_id: z.number().describe("Parent attribute ID"), ...PaginationMixin });
export const GetAttributeTermSchema = z.object({ attribute_id: z.number().describe("Parent attribute ID"), term_id: z.number().describe("Term ID") });
export const CreateAttributeTermSchema = z.object({
  attribute_id: z.number().describe("Parent attribute ID"),
  name: z.string().min(1).describe("Term name (e.g., 'Red', 'Large')"),
  slug: z.string().optional().describe("URL slug"),
  description: z.string().optional(),
  menu_order: z.number().optional().describe("Sort order"),
});
export const UpdateAttributeTermSchema = z.object({
  attribute_id: z.number().describe("Parent attribute ID"), term_id: z.number().describe("Term ID to update"),
  name: z.string().optional(), slug: z.string().optional(), description: z.string().optional(), menu_order: z.number().optional(),
});
export const DeleteAttributeTermSchema = z.object({ attribute_id: z.number().describe("Parent attribute ID"), term_id: z.number().describe("Term ID to delete") });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT CATEGORIES
// ═══════════════════════════════════════════════════════════════════════

export const ListCategoriesSchema = z.object({
  ...PaginationMixin, search: z.string().optional(), parent: z.number().optional(),
  orderby: z.enum(["id", "include", "name", "slug", "term_group", "description", "count"]).optional(),
  order: z.enum(["asc", "desc"]).optional(), hide_empty: z.boolean().optional(),
});
export const GetCategorySchema = z.object({ category_id: z.number().describe("Category ID") });
export const CreateCategorySchema = z.object({
  name: z.string().min(1).describe("Category name"), slug: z.string().optional(),
  parent: z.number().optional().describe("Parent category ID"), description: z.string().optional(),
  image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
});
export const UpdateCategorySchema = z.object({
  category_id: z.number().describe("Category ID to update"),
  name: z.string().optional(), slug: z.string().optional(), parent: z.number().optional(),
  description: z.string().optional(), image: z.object({ src: z.string(), alt: z.string().optional() }).optional(),
});
export const DeleteCategorySchema = z.object({ category_id: z.number().describe("Category ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT TAGS
// ═══════════════════════════════════════════════════════════════════════

export const ListTagsSchema = z.object({
  ...PaginationMixin, search: z.string().optional(),
  orderby: z.enum(["id", "include", "name", "slug", "term_group", "description", "count"]).optional(),
  order: z.enum(["asc", "desc"]).optional(), hide_empty: z.boolean().optional(),
});
export const GetTagSchema = z.object({ tag_id: z.number().describe("Tag ID") });
export const CreateTagSchema = z.object({ name: z.string().min(1).describe("Tag name"), slug: z.string().optional(), description: z.string().optional() });
export const UpdateTagSchema = z.object({ tag_id: z.number().describe("Tag ID to update"), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() });
export const DeleteTagSchema = z.object({ tag_id: z.number().describe("Tag ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT SHIPPING CLASSES
// ═══════════════════════════════════════════════════════════════════════

export const ListShippingClassesSchema = z.object({ ...PaginationMixin });
export const GetShippingClassSchema = z.object({ shipping_class_id: z.number().describe("Shipping class ID") });
export const CreateShippingClassSchema = z.object({ name: z.string().min(1).describe("Shipping class name"), slug: z.string().optional(), description: z.string().optional() });
export const UpdateShippingClassSchema = z.object({ shipping_class_id: z.number().describe("Shipping class ID to update"), name: z.string().optional(), slug: z.string().optional(), description: z.string().optional() });
export const DeleteShippingClassSchema = z.object({ shipping_class_id: z.number().describe("Shipping class ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// PRODUCT REVIEWS
// ═══════════════════════════════════════════════════════════════════════

export const ListProductReviewsSchema = z.object({ ...PaginationMixin, product: z.array(z.number()).optional().describe("Filter by product ID(s)"), status: z.enum(["approved", "hold", "spam", "unspam", "trash", "untrash"]).optional() });
export const GetProductReviewSchema = z.object({ review_id: z.number().describe("Review ID") });
export const CreateProductReviewSchema = z.object({
  product_id: z.number().describe("Product ID to review"), review: z.string().min(1).describe("Review content"),
  reviewer: z.string().min(1).describe("Reviewer name"), reviewer_email: z.string().email().describe("Reviewer email"),
  rating: z.number().min(0).max(5).optional().describe("Star rating (0-5)"),
});
export const UpdateProductReviewSchema = z.object({
  review_id: z.number().describe("Review ID to update"), review: z.string().optional(),
  rating: z.number().min(0).max(5).optional(), status: z.enum(["approved", "hold", "spam", "unspam", "trash", "untrash"]).optional(),
});
export const DeleteProductReviewSchema = z.object({ review_id: z.number().describe("Review ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════

export const ListOrdersSchema = z.object({
  ...PaginationMixin,
  status: z.enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed", "trash", "any"]).optional(),
  customer: z.number().optional(), after: z.string().optional(), before: z.string().optional(),
  orderby: z.enum(["date", "id", "title", "slug"]).optional(), order: z.enum(["asc", "desc"]).optional(),
  search: z.string().optional(),
});
export const GetOrderSchema = z.object({ order_id: z.number().describe("Order ID") });
export const CreateOrderSchema = z.object({
  status: z.enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]).default("pending").describe("Order status"),
  customer_id: z.number().optional().describe("Customer ID (0 for guest)"),
  billing: z.record(z.string(), z.unknown()).optional().describe("Billing address fields"),
  shipping: z.record(z.string(), z.unknown()).optional().describe("Shipping address fields"),
  line_items: z.array(z.object({ product_id: z.number(), quantity: z.number().default(1), variation_id: z.number().optional() })).optional().describe("Order line items"),
  shipping_lines: z.array(z.object({ method_id: z.string(), method_title: z.string(), total: z.string() })).optional(),
  coupon_lines: z.array(z.object({ code: z.string() })).optional().describe("Applied coupon codes"),
  payment_method: z.string().optional(), payment_method_title: z.string().optional(),
  set_paid: z.boolean().optional().describe("Mark order as paid immediately"),
});
export const UpdateOrderSchema = z.object({
  order_id: z.number().describe("Order ID to update"),
  status: z.enum(["pending", "processing", "on-hold", "completed", "cancelled", "refunded", "failed"]).optional(),
  customer_note: z.string().optional(),
  meta_data: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});
export const DeleteOrderSchema = z.object({ order_id: z.number().describe("Order ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// ORDER NOTES
// ═══════════════════════════════════════════════════════════════════════

export const ListOrderNotesSchema = z.object({ order_id: z.number().describe("Order ID") });
export const GetOrderNoteSchema = z.object({ order_id: z.number().describe("Order ID"), note_id: z.number().describe("Note ID") });
export const CreateOrderNoteSchema = z.object({
  order_id: z.number().describe("Order ID"), note: z.string().min(1).describe("Note content"),
  customer_note: z.boolean().default(false).describe("True to send note to customer, false for private"),
});
export const DeleteOrderNoteSchema = z.object({ order_id: z.number().describe("Order ID"), note_id: z.number().describe("Note ID to delete") });

// ═══════════════════════════════════════════════════════════════════════
// ORDER REFUNDS
// ═══════════════════════════════════════════════════════════════════════

export const ListOrderRefundsSchema = z.object({ order_id: z.number().describe("Order ID"), ...PaginationMixin });
export const GetOrderRefundSchema = z.object({ order_id: z.number().describe("Order ID"), refund_id: z.number().describe("Refund ID") });
export const CreateOrderRefundSchema = z.object({
  order_id: z.number().describe("Order ID"),
  amount: z.string().optional().describe("Refund amount (omit for full refund)"),
  reason: z.string().optional().describe("Refund reason"),
  refunded_by: z.number().optional().describe("User ID who processed the refund"),
  line_items: z.array(z.object({
    id: z.number().describe("Line item ID"), quantity: z.number().optional(), refund_total: z.string().optional(),
  })).optional().describe("Specific line items to refund"),
  api_refund: z.boolean().default(true).describe("True to process refund via payment gateway"),
});
export const DeleteOrderRefundSchema = z.object({ order_id: z.number().describe("Order ID"), refund_id: z.number().describe("Refund ID to delete") });

// ═══════════════════════════════════════════════════════════════════════
// CUSTOMERS
// ═══════════════════════════════════════════════════════════════════════

export const ListCustomersSchema = z.object({
  ...PaginationMixin, search: z.string().optional(), email: z.string().optional(),
  role: z.enum(["all", "administrator", "editor", "author", "contributor", "subscriber", "customer"]).optional(),
  orderby: z.enum(["id", "include", "name", "registered_date"]).optional(), order: z.enum(["asc", "desc"]).optional(),
});
export const GetCustomerSchema = z.object({ customer_id: z.number().describe("Customer ID") });
export const CreateCustomerSchema = z.object({
  email: z.string().email().describe("Customer email"), first_name: z.string().optional(), last_name: z.string().optional(),
  username: z.string().optional(), password: z.string().optional(),
  billing: z.object({ first_name: z.string().optional(), last_name: z.string().optional(), company: z.string().optional(), address_1: z.string().optional(), address_2: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postcode: z.string().optional(), country: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  shipping: z.object({ first_name: z.string().optional(), last_name: z.string().optional(), company: z.string().optional(), address_1: z.string().optional(), address_2: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postcode: z.string().optional(), country: z.string().optional() }).optional(),
});
export const UpdateCustomerSchema = z.object({
  customer_id: z.number().describe("Customer ID to update"),
  email: z.string().email().optional(), first_name: z.string().optional(), last_name: z.string().optional(),
  billing: z.object({ first_name: z.string().optional(), last_name: z.string().optional(), company: z.string().optional(), address_1: z.string().optional(), address_2: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postcode: z.string().optional(), country: z.string().optional(), email: z.string().optional(), phone: z.string().optional() }).optional(),
  shipping: z.object({ first_name: z.string().optional(), last_name: z.string().optional(), company: z.string().optional(), address_1: z.string().optional(), address_2: z.string().optional(), city: z.string().optional(), state: z.string().optional(), postcode: z.string().optional(), country: z.string().optional() }).optional(),
});
export const DeleteCustomerSchema = z.object({ customer_id: z.number().describe("Customer ID to delete"), ...ForceDeleteMixin, reassign: z.number().optional().describe("Reassign posts to this user ID") });
export const GetCustomerDownloadsSchema = z.object({ customer_id: z.number().describe("Customer ID") });

// ═══════════════════════════════════════════════════════════════════════
// COUPONS
// ═══════════════════════════════════════════════════════════════════════

export const ListCouponsSchema = z.object({ ...PaginationMixin, search: z.string().optional() });
export const GetCouponSchema = z.object({ coupon_id: z.number().describe("Coupon ID") });
export const CreateCouponSchema = z.object({
  code: z.string().min(1).describe("Coupon code"),
  discount_type: z.enum(["percent", "fixed_cart", "fixed_product"]).default("fixed_cart"),
  amount: z.string().describe("Discount amount (e.g., '10.00')"),
  description: z.string().optional(), date_expires: z.string().optional(),
  individual_use: z.boolean().optional(), usage_limit: z.number().optional(), usage_limit_per_user: z.number().optional(),
  minimum_amount: z.string().optional(), maximum_amount: z.string().optional(),
  product_ids: z.array(z.number()).optional(), excluded_product_ids: z.array(z.number()).optional(),
  product_categories: z.array(z.number()).optional(), free_shipping: z.boolean().optional(),
});
export const UpdateCouponSchema = z.object({
  coupon_id: z.number().describe("Coupon ID to update"),
  code: z.string().optional(), discount_type: z.enum(["percent", "fixed_cart", "fixed_product"]).optional(),
  amount: z.string().optional(), description: z.string().optional(), date_expires: z.string().optional(),
  individual_use: z.boolean().optional(), usage_limit: z.number().optional(),
  minimum_amount: z.string().optional(), maximum_amount: z.string().optional(),
});
export const DeleteCouponSchema = z.object({ coupon_id: z.number().describe("Coupon ID to delete"), ...ForceDeleteMixin });

// ═══════════════════════════════════════════════════════════════════════
// TAX RATES & CLASSES
// ═══════════════════════════════════════════════════════════════════════

export const ListTaxRatesSchema = z.object({ ...PaginationMixin, class: z.string().optional().describe("Filter by tax class slug") });
export const GetTaxRateSchema = z.object({ tax_rate_id: z.number().describe("Tax rate ID") });
export const CreateTaxRateSchema = z.object({
  country: z.string().optional().describe("Country code (e.g., 'US')"), state: z.string().optional().describe("State code"),
  postcode: z.string().optional(), city: z.string().optional(),
  rate: z.string().describe("Tax rate percentage (e.g., '10.0000')"), name: z.string().describe("Tax rate name"),
  priority: z.number().optional(), compound: z.boolean().optional(), shipping: z.boolean().optional().describe("Apply to shipping"),
  class: z.string().optional().describe("Tax class slug"),
});
export const UpdateTaxRateSchema = z.object({
  tax_rate_id: z.number().describe("Tax rate ID to update"),
  country: z.string().optional(), state: z.string().optional(), rate: z.string().optional(), name: z.string().optional(),
  priority: z.number().optional(), compound: z.boolean().optional(), shipping: z.boolean().optional(), class: z.string().optional(),
});
export const DeleteTaxRateSchema = z.object({ tax_rate_id: z.number().describe("Tax rate ID to delete") });

export const ListTaxClassesSchema = z.object({});
export const CreateTaxClassSchema = z.object({ name: z.string().min(1).describe("Tax class name") });
export const DeleteTaxClassSchema = z.object({ slug: z.string().describe("Tax class slug to delete") });

// ═══════════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════

export const ListWebhooksSchema = z.object({ ...PaginationMixin, status: z.enum(["active", "paused", "disabled"]).optional() });
export const GetWebhookSchema = z.object({ webhook_id: z.number().describe("Webhook ID") });
export const CreateWebhookSchema = z.object({
  name: z.string().min(1).describe("Webhook name"),
  topic: z.string().describe("Event topic (e.g., 'order.created', 'product.updated', 'customer.deleted')"),
  delivery_url: z.string().url().describe("Payload delivery URL"),
  secret: z.string().optional().describe("Signing secret for payload verification"),
  status: z.enum(["active", "paused", "disabled"]).default("active"),
});
export const UpdateWebhookSchema = z.object({
  webhook_id: z.number().describe("Webhook ID to update"),
  name: z.string().optional(), topic: z.string().optional(), delivery_url: z.string().url().optional(),
  secret: z.string().optional(), status: z.enum(["active", "paused", "disabled"]).optional(),
});
export const DeleteWebhookSchema = z.object({ webhook_id: z.number().describe("Webhook ID to delete") });

// ═══════════════════════════════════════════════════════════════════════
// REPORTS
// ═══════════════════════════════════════════════════════════════════════

export const GetReportsSalesSchema = z.object({ period: z.enum(["week", "month", "last_month", "year"]).optional(), date_min: z.string().optional(), date_max: z.string().optional() });
export const GetReportsTopSellersSchema = z.object({ period: z.enum(["week", "month", "last_month", "year"]).optional(), date_min: z.string().optional(), date_max: z.string().optional() });
export const GetReportsTotalsSchema = z.object({ resource: z.enum(["coupons", "customers", "orders", "products", "reviews"]).describe("Totals for which resource") });

// ═══════════════════════════════════════════════════════════════════════
// SHIPPING, PAYMENTS, SETTINGS
// ═══════════════════════════════════════════════════════════════════════

export const ListShippingZonesSchema = z.object({});
export const GetPaymentGatewaysSchema = z.object({});
export const UpdatePaymentGatewaySchema = z.object({
  gateway_id: z.string().describe("Payment gateway ID (e.g., 'bacs', 'stripe')"),
  enabled: z.boolean().optional().describe("Enable/disable the gateway"),
  title: z.string().optional(), description: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional().describe("Gateway-specific settings"),
});
export const GetSettingsSchema = z.object({ group: z.string().optional().describe("Settings group ID (e.g., 'general', 'products', 'tax')") });
export const UpdateSettingSchema = z.object({
  group: z.string().describe("Settings group ID"), setting_id: z.string().describe("Setting option ID"),
  value: z.unknown().describe("New value for the setting"),
});

// ═══════════════════════════════════════════════════════════════════════
// SYSTEM STATUS & DATA
// ═══════════════════════════════════════════════════════════════════════

export const GetSystemStatusSchema = z.object({});
export const ListSystemStatusToolsSchema = z.object({});
export const RunSystemStatusToolSchema = z.object({ tool_id: z.string().describe("Tool ID to run (e.g., 'clear_transients', 'recount_terms')") });

export const ListDataSchema = z.object({ endpoint: z.enum(["continents", "countries", "currencies"]).optional().describe("Data category. Omit to list all data endpoints.") });
export const GetDataItemSchema = z.object({
  endpoint: z.enum(["continents", "countries", "currencies"]).describe("Data category"),
  code: z.string().describe("Item code (e.g., 'US', 'EU', 'USD')"),
});
export const GetCurrentCurrencySchema = z.object({});

// ═══════════════════════════════════════════════════════════════════════
// BATCH
// ═══════════════════════════════════════════════════════════════════════

export const BatchUpdateSchema = z.object({
  resource: z.enum([
    "products", "orders", "coupons", "customers",
    "products/categories", "products/tags", "products/attributes",
    "products/reviews", "taxes", "webhooks", "products/shipping_classes",
  ]).describe("Resource type to batch operate on"),
  create: z.array(z.record(z.string(), z.unknown())).optional().describe("Items to create (max 100 total operations)"),
  update: z.array(z.record(z.string(), z.unknown()).and(z.object({ id: z.number() }))).optional().describe("Items to update (must include id)"),
  delete: z.array(z.number()).optional().describe("Item IDs to delete"),
});

// ═══════════════════════════════════════════════════════════════════════
// WOOCOMMERCE WORKFLOWS
// ═══════════════════════════════════════════════════════════════════════

export const StoreDashboardSchema = z.object({
  period: z.enum(["week", "month", "last_month", "year"]).default("month"),
});

export const CreateFullProductSchema = z.object({
  name: z.string().min(1), type: z.enum(["simple", "variable"]).default("simple"),
  regular_price: z.string().optional(), description: z.string().optional(),
  short_description: z.string().optional(), status: z.enum(["publish", "draft"]).default("draft"),
  category_names: z.array(z.string()).optional().describe("Category names (created if needed)"),
  tag_names: z.array(z.string()).optional().describe("Tag names (created if needed)"),
  image_urls: z.array(z.string()).optional().describe("Product image URLs (first = main image)"),
  sku: z.string().optional(), manage_stock: z.boolean().optional(), stock_quantity: z.number().optional(),
  attributes: z.array(z.object({ name: z.string(), options: z.array(z.string()), variation: z.boolean().optional() })).optional(),
  variations: z.array(z.object({ regular_price: z.string(), attributes: z.array(z.object({ name: z.string(), option: z.string() })) })).optional().describe("Auto-create variations (for variable products)"),
});

export const ProcessOrderSchema = z.object({
  order_id: z.number().describe("Order ID"),
  new_status: z.enum(["processing", "completed", "on-hold", "cancelled"]).describe("New status"),
  customer_note: z.string().optional().describe("Note to send to customer"),
  private_note: z.string().optional().describe("Internal/private note"),
});
