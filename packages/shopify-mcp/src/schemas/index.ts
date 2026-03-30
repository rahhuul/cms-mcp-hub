import { z } from "zod";

const Pg = { limit: z.number().min(1).max(250).default(50).describe("Items per page (max 250)") };
const Id = (n: string) => z.object({ id: z.number().describe(`${n} ID`) });

// ═══ Products ══════════════════════════════════════════════════════════
export const ListProductsSchema = z.object({ ...Pg, product_type: z.string().optional(), vendor: z.string().optional(), handle: z.string().optional(), status: z.enum(["active","draft","archived"]).optional(), collection_id: z.number().optional(), created_at_min: z.string().optional(), updated_at_min: z.string().optional(), fields: z.string().optional().describe("Comma-separated fields") });
export const GetProductSchema = Id("Product");
export const CountProductsSchema = z.object({ product_type: z.string().optional(), vendor: z.string().optional(), collection_id: z.number().optional() });
export const CreateProductSchema = z.object({ title: z.string().min(1), body_html: z.string().optional(), vendor: z.string().optional(), product_type: z.string().optional(), status: z.enum(["active","draft","archived"]).default("draft"), tags: z.string().optional().describe("Comma-separated tags"), variants: z.array(z.record(z.string(), z.unknown())).optional(), images: z.array(z.object({ src: z.string() })).optional(), options: z.array(z.object({ name: z.string(), values: z.array(z.string()) })).optional() });
export const UpdateProductSchema = z.object({ id: z.number(), title: z.string().optional(), body_html: z.string().optional(), vendor: z.string().optional(), product_type: z.string().optional(), status: z.enum(["active","draft","archived"]).optional(), tags: z.string().optional() });
export const DeleteProductSchema = Id("Product");

// ═══ Product Variants ══════════════════════════════════════════════════
export const ListVariantsSchema = z.object({ product_id: z.number(), ...Pg });
export const GetVariantSchema = z.object({ variant_id: z.number() });
export const CountVariantsSchema = z.object({ product_id: z.number() });
export const CreateVariantSchema = z.object({ product_id: z.number(), option1: z.string().optional(), option2: z.string().optional(), option3: z.string().optional(), price: z.string().optional(), sku: z.string().optional(), barcode: z.string().optional(), weight: z.number().optional(), inventory_quantity: z.number().optional(), compare_at_price: z.string().optional() });
export const UpdateVariantSchema = z.object({ variant_id: z.number(), price: z.string().optional(), sku: z.string().optional(), option1: z.string().optional(), compare_at_price: z.string().optional(), barcode: z.string().optional(), inventory_quantity: z.number().optional() });
export const DeleteVariantSchema = z.object({ product_id: z.number(), variant_id: z.number() });

// ═══ Product Images ════════════════════════════════════════════════════
export const ListProductImagesSchema = z.object({ product_id: z.number() });
export const GetProductImageSchema = z.object({ product_id: z.number(), image_id: z.number() });
export const CountProductImagesSchema = z.object({ product_id: z.number() });
export const CreateProductImageSchema = z.object({ product_id: z.number(), src: z.string().optional().describe("Image URL"), attachment: z.string().optional().describe("Base64 image data"), alt: z.string().optional(), position: z.number().optional(), variant_ids: z.array(z.number()).optional() });
export const UpdateProductImageSchema = z.object({ product_id: z.number(), image_id: z.number(), alt: z.string().optional(), position: z.number().optional(), variant_ids: z.array(z.number()).optional() });
export const DeleteProductImageSchema = z.object({ product_id: z.number(), image_id: z.number() });

// ═══ Custom Collections ════════════════════════════════════════════════
export const ListCustomCollectionsSchema = z.object({ ...Pg, title: z.string().optional(), product_id: z.number().optional(), handle: z.string().optional() });
export const GetCustomCollectionSchema = Id("Custom collection");
export const CreateCustomCollectionSchema = z.object({ title: z.string().min(1), body_html: z.string().optional(), handle: z.string().optional(), image: z.object({ src: z.string() }).optional(), published: z.boolean().optional(), sort_order: z.string().optional() });
export const UpdateCustomCollectionSchema = z.object({ id: z.number(), title: z.string().optional(), body_html: z.string().optional(), handle: z.string().optional(), sort_order: z.string().optional() });
export const DeleteCustomCollectionSchema = Id("Custom collection");

// ═══ Smart Collections ═════════════════════════════════════════════════
export const ListSmartCollectionsSchema = z.object({ ...Pg, title: z.string().optional(), product_id: z.number().optional(), handle: z.string().optional() });
export const GetSmartCollectionSchema = Id("Smart collection");
export const CreateSmartCollectionSchema = z.object({ title: z.string().min(1), rules: z.array(z.object({ column: z.string(), relation: z.string(), condition: z.string() })).describe("Auto-matching rules"), disjunctive: z.boolean().optional().describe("true=OR, false=AND"), body_html: z.string().optional() });
export const UpdateSmartCollectionSchema = z.object({ id: z.number(), title: z.string().optional(), rules: z.array(z.object({ column: z.string(), relation: z.string(), condition: z.string() })).optional(), body_html: z.string().optional() });
export const DeleteSmartCollectionSchema = Id("Smart collection");

// ═══ Collects ══════════════════════════════════════════════════════════
export const ListCollectsSchema = z.object({ ...Pg, product_id: z.number().optional(), collection_id: z.number().optional() });
export const CreateCollectSchema = z.object({ product_id: z.number(), collection_id: z.number() });
export const DeleteCollectSchema = Id("Collect");

// ═══ Orders ════════════════════════════════════════════════════════════
export const ListOrdersSchema = z.object({ ...Pg, status: z.enum(["open","closed","cancelled","any"]).optional(), financial_status: z.enum(["authorized","pending","paid","partially_paid","refunded","voided","partially_refunded","any"]).optional(), fulfillment_status: z.enum(["shipped","partial","unshipped","unfulfilled","any"]).optional(), created_at_min: z.string().optional(), created_at_max: z.string().optional(), since_id: z.number().optional(), fields: z.string().optional() });
export const GetOrderSchema = Id("Order");
export const CountOrdersSchema = z.object({ status: z.enum(["open","closed","cancelled","any"]).optional(), financial_status: z.string().optional(), fulfillment_status: z.string().optional() });
export const CreateOrderSchema = z.object({ line_items: z.array(z.object({ variant_id: z.number().optional(), title: z.string().optional(), quantity: z.number(), price: z.string().optional() })), customer: z.object({ id: z.number() }).optional(), email: z.string().optional(), shipping_address: z.record(z.string(), z.unknown()).optional(), billing_address: z.record(z.string(), z.unknown()).optional(), financial_status: z.string().optional(), send_receipt: z.boolean().optional(), tags: z.string().optional() });
export const UpdateOrderSchema = z.object({ id: z.number(), note: z.string().optional(), tags: z.string().optional(), email: z.string().optional(), shipping_address: z.record(z.string(), z.unknown()).optional() });
export const CloseOrderSchema = Id("Order");
export const CancelOrderSchema = z.object({ id: z.number(), reason: z.enum(["customer","fraud","inventory","declined","other"]).optional(), email: z.boolean().optional().describe("Send cancellation email"), restock: z.boolean().optional() });

// ═══ Draft Orders ══════════════════════════════════════════════════════
export const ListDraftOrdersSchema = z.object({ ...Pg, status: z.enum(["open","invoice_sent","completed"]).optional() });
export const GetDraftOrderSchema = Id("Draft order");
export const CreateDraftOrderSchema = z.object({ line_items: z.array(z.object({ variant_id: z.number().optional(), title: z.string().optional(), quantity: z.number(), price: z.string().optional() })), customer: z.object({ id: z.number() }).optional(), email: z.string().optional(), note: z.string().optional(), tags: z.string().optional(), shipping_address: z.record(z.string(), z.unknown()).optional() });
export const UpdateDraftOrderSchema = z.object({ id: z.number(), note: z.string().optional(), tags: z.string().optional(), email: z.string().optional() });
export const DeleteDraftOrderSchema = Id("Draft order");
export const CompleteDraftOrderSchema = z.object({ id: z.number(), payment_pending: z.boolean().optional().describe("true=mark as pending, false=mark as paid") });
export const SendDraftOrderInvoiceSchema = z.object({ id: z.number(), to: z.string().optional().describe("Email override"), subject: z.string().optional(), custom_message: z.string().optional() });

// ═══ Transactions ══════════════════════════════════════════════════════
export const ListTransactionsSchema = z.object({ order_id: z.number() });
export const GetTransactionSchema = z.object({ order_id: z.number(), transaction_id: z.number() });
export const CountTransactionsSchema = z.object({ order_id: z.number() });
export const CreateTransactionSchema = z.object({ order_id: z.number(), kind: z.enum(["capture","void","refund"]).describe("Transaction type"), amount: z.string().optional(), currency: z.string().optional() });

// ═══ Refunds ═══════════════════════════════════════════════════════════
export const ListRefundsSchema = z.object({ order_id: z.number() });
export const GetRefundSchema = z.object({ order_id: z.number(), refund_id: z.number() });
export const CreateRefundSchema = z.object({ order_id: z.number(), notify: z.boolean().optional(), note: z.string().optional(), shipping: z.object({ full_refund: z.boolean().optional(), amount: z.string().optional() }).optional(), refund_line_items: z.array(z.object({ line_item_id: z.number(), quantity: z.number(), restock_type: z.enum(["no_restock","cancel","return"]).optional() })).optional() });
export const CalculateRefundSchema = z.object({ order_id: z.number(), shipping: z.object({ full_refund: z.boolean().optional(), amount: z.string().optional() }).optional(), refund_line_items: z.array(z.object({ line_item_id: z.number(), quantity: z.number() })).optional() });

// ═══ Fulfillments ══════════════════════════════════════════════════════
export const ListFulfillmentsSchema = z.object({ order_id: z.number(), ...Pg });
export const GetFulfillmentSchema = z.object({ order_id: z.number(), fulfillment_id: z.number() });
export const CountFulfillmentsSchema = z.object({ order_id: z.number() });
export const CreateFulfillmentSchema = z.object({ order_id: z.number(), tracking_number: z.string().optional(), tracking_company: z.string().optional(), tracking_url: z.string().optional(), notify_customer: z.boolean().optional(), line_items: z.array(z.object({ id: z.number(), quantity: z.number().optional() })).optional() });
export const UpdateFulfillmentSchema = z.object({ order_id: z.number(), fulfillment_id: z.number(), tracking_number: z.string().optional(), tracking_company: z.string().optional(), tracking_url: z.string().optional() });
export const CancelFulfillmentSchema = z.object({ order_id: z.number(), fulfillment_id: z.number() });

// ═══ Customers ═════════════════════════════════════════════════════════
export const ListCustomersSchema = z.object({ ...Pg, created_at_min: z.string().optional(), updated_at_min: z.string().optional(), fields: z.string().optional() });
export const GetCustomerSchema = Id("Customer");
export const CountCustomersSchema = z.object({});
export const SearchCustomersSchema = z.object({ query: z.string().describe("Search query (name, email, etc.)"), ...Pg });
export const CreateCustomerSchema = z.object({ first_name: z.string().optional(), last_name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), tags: z.string().optional(), note: z.string().optional(), accepts_marketing: z.boolean().optional(), addresses: z.array(z.record(z.string(), z.unknown())).optional() });
export const UpdateCustomerSchema = z.object({ id: z.number(), first_name: z.string().optional(), last_name: z.string().optional(), email: z.string().optional(), phone: z.string().optional(), tags: z.string().optional(), note: z.string().optional() });
export const DeleteCustomerSchema = Id("Customer");

// ═══ Customer Addresses ════════════════════════════════════════════════
export const ListCustomerAddressesSchema = z.object({ customer_id: z.number(), ...Pg });
export const GetCustomerAddressSchema = z.object({ customer_id: z.number(), address_id: z.number() });
export const CreateCustomerAddressSchema = z.object({ customer_id: z.number(), address1: z.string().optional(), address2: z.string().optional(), city: z.string().optional(), province: z.string().optional(), country: z.string().optional(), zip: z.string().optional(), phone: z.string().optional(), first_name: z.string().optional(), last_name: z.string().optional(), company: z.string().optional() });
export const UpdateCustomerAddressSchema = z.object({ customer_id: z.number(), address_id: z.number(), address1: z.string().optional(), city: z.string().optional(), province: z.string().optional(), country: z.string().optional(), zip: z.string().optional() });
export const DeleteCustomerAddressSchema = z.object({ customer_id: z.number(), address_id: z.number() });
export const SetDefaultAddressSchema = z.object({ customer_id: z.number(), address_id: z.number() });

// ═══ Inventory ═════════════════════════════════════════════════════════
export const ListInventoryItemsSchema = z.object({ ids: z.string().describe("Comma-separated inventory item IDs"), ...Pg });
export const GetInventoryItemSchema = Id("Inventory item");
export const UpdateInventoryItemSchema = z.object({ id: z.number(), sku: z.string().optional(), tracked: z.boolean().optional(), cost: z.string().optional() });
export const ListInventoryLevelsSchema = z.object({ inventory_item_ids: z.string().optional(), location_ids: z.string().optional(), ...Pg });
export const AdjustInventorySchema = z.object({ inventory_item_id: z.number(), location_id: z.number(), available_adjustment: z.number().describe("Amount to adjust (positive or negative)") });
export const SetInventorySchema = z.object({ inventory_item_id: z.number(), location_id: z.number(), available: z.number().describe("New quantity to set") });
export const ListLocationsSchema = z.object({});
export const GetLocationSchema = Id("Location");
export const CountLocationsSchema = z.object({});

// ═══ Pages ═════════════════════════════════════════════════════════════
export const ListPagesSchema = z.object({ ...Pg, title: z.string().optional(), handle: z.string().optional(), created_at_min: z.string().optional() });
export const GetPageSchema = Id("Page");
export const CountPagesSchema = z.object({});
export const CreatePageSchema = z.object({ title: z.string().min(1), body_html: z.string().optional(), handle: z.string().optional(), published: z.boolean().optional(), template_suffix: z.string().optional(), metafield: z.record(z.string(), z.unknown()).optional() });
export const UpdatePageSchema = z.object({ id: z.number(), title: z.string().optional(), body_html: z.string().optional(), handle: z.string().optional(), published: z.boolean().optional() });
export const DeletePageSchema = Id("Page");

// ═══ Blogs & Articles ══════════════════════════════════════════════════
export const ListBlogsSchema = z.object({ ...Pg });
export const GetBlogSchema = Id("Blog");
export const CreateBlogSchema = z.object({ title: z.string().min(1) });
export const UpdateBlogSchema = z.object({ id: z.number(), title: z.string().optional() });
export const DeleteBlogSchema = Id("Blog");
export const ListArticlesSchema = z.object({ blog_id: z.number(), ...Pg, author: z.string().optional(), tag: z.string().optional(), created_at_min: z.string().optional() });
export const GetArticleSchema = z.object({ blog_id: z.number(), article_id: z.number() });
export const CountArticlesSchema = z.object({ blog_id: z.number() });
export const CreateArticleSchema = z.object({ blog_id: z.number(), title: z.string().min(1), body_html: z.string().optional(), author: z.string().optional(), tags: z.string().optional(), published: z.boolean().optional(), image: z.object({ src: z.string() }).optional() });
export const UpdateArticleSchema = z.object({ blog_id: z.number(), article_id: z.number(), title: z.string().optional(), body_html: z.string().optional(), tags: z.string().optional(), published: z.boolean().optional() });
export const DeleteArticleSchema = z.object({ blog_id: z.number(), article_id: z.number() });
export const ListArticleAuthorsSchema = z.object({});
export const ListArticleTagsSchema = z.object({ blog_id: z.number().optional(), ...Pg, popular: z.number().optional() });

// ═══ Themes & Assets ═══════════════════════════════════════════════════
export const ListThemesSchema = z.object({});
export const GetThemeSchema = Id("Theme");
export const ListAssetsSchema = z.object({ theme_id: z.number() });
export const GetAssetSchema = z.object({ theme_id: z.number(), key: z.string().describe("Asset key (e.g., 'templates/index.json')") });
export const CreateOrUpdateAssetSchema = z.object({ theme_id: z.number(), key: z.string(), value: z.string().optional().describe("File content"), src: z.string().optional().describe("External URL") });
export const DeleteAssetSchema = z.object({ theme_id: z.number(), key: z.string() });

// ═══ Redirects ═════════════════════════════════════════════════════════
export const ListRedirectsSchema = z.object({ ...Pg, path: z.string().optional(), target: z.string().optional() });
export const GetRedirectSchema = Id("Redirect");
export const CountRedirectsSchema = z.object({});
export const CreateRedirectSchema = z.object({ path: z.string().describe("Old URL path"), target: z.string().describe("New URL or path to redirect to") });
export const UpdateRedirectSchema = z.object({ id: z.number(), path: z.string().optional(), target: z.string().optional() });
export const DeleteRedirectSchema = Id("Redirect");

// ═══ Price Rules & Discount Codes ══════════════════════════════════════
export const ListPriceRulesSchema = z.object({ ...Pg });
export const GetPriceRuleSchema = Id("Price rule");
export const CreatePriceRuleSchema = z.object({ title: z.string().min(1), target_type: z.enum(["line_item","shipping_line"]), target_selection: z.enum(["all","entitled"]), allocation_method: z.enum(["across","each"]), value_type: z.enum(["fixed_amount","percentage"]), value: z.string().describe("Negative number (e.g., '-10.0')"), customer_selection: z.enum(["all","prerequisite"]).default("all"), starts_at: z.string().optional(), ends_at: z.string().optional(), usage_limit: z.number().optional() });
export const UpdatePriceRuleSchema = z.object({ id: z.number(), title: z.string().optional(), value: z.string().optional(), ends_at: z.string().optional(), usage_limit: z.number().optional() });
export const DeletePriceRuleSchema = Id("Price rule");
export const ListDiscountCodesSchema = z.object({ price_rule_id: z.number() });
export const GetDiscountCodeSchema = z.object({ price_rule_id: z.number(), discount_code_id: z.number() });
export const CreateDiscountCodeSchema = z.object({ price_rule_id: z.number(), code: z.string().min(1).describe("Discount code (e.g., 'SAVE20')") });
export const UpdateDiscountCodeSchema = z.object({ price_rule_id: z.number(), discount_code_id: z.number(), code: z.string().optional() });
export const DeleteDiscountCodeSchema = z.object({ price_rule_id: z.number(), discount_code_id: z.number() });

// ═══ Gift Cards ════════════════════════════════════════════════════════
export const ListGiftCardsSchema = z.object({ ...Pg, status: z.enum(["enabled","disabled"]).optional() });
export const GetGiftCardSchema = Id("Gift card");
export const CountGiftCardsSchema = z.object({ status: z.enum(["enabled","disabled"]).optional() });
export const CreateGiftCardSchema = z.object({ initial_value: z.string().describe("Gift card amount"), code: z.string().optional(), note: z.string().optional(), template_suffix: z.string().optional() });
export const UpdateGiftCardSchema = z.object({ id: z.number(), note: z.string().optional(), expires_on: z.string().optional() });
export const SearchGiftCardsSchema = z.object({ query: z.string(), ...Pg });

// ═══ Metafields ════════════════════════════════════════════════════════
export const ListMetafieldsSchema = z.object({ resource: z.string().describe("Resource type (products, orders, customers, shop, etc.)"), resource_id: z.number().optional().describe("Resource ID (omit for shop metafields)"), namespace: z.string().optional() });
export const GetMetafieldSchema = Id("Metafield");
export const CreateMetafieldSchema = z.object({ resource: z.string(), resource_id: z.number().optional(), namespace: z.string(), key: z.string(), value: z.string(), type: z.string().describe("e.g., single_line_text_field, number_integer, json, boolean") });
export const UpdateMetafieldSchema = z.object({ id: z.number(), value: z.string(), type: z.string().optional() });
export const DeleteMetafieldSchema = Id("Metafield");

// ═══ Webhooks ══════════════════════════════════════════════════════════
export const ListWebhooksSchema = z.object({ ...Pg, topic: z.string().optional() });
export const GetWebhookSchema = Id("Webhook");
export const CountWebhooksSchema = z.object({ topic: z.string().optional() });
export const CreateWebhookSchema = z.object({ topic: z.string().describe("e.g., orders/create, products/update, customers/delete"), address: z.string().url().describe("Callback URL"), format: z.enum(["json","xml"]).default("json") });
export const UpdateWebhookSchema = z.object({ id: z.number(), address: z.string().url().optional(), topic: z.string().optional() });
export const DeleteWebhookSchema = Id("Webhook");

// ═══ Shop, Policies, Events ════════════════════════════════════════════
export const GetShopSchema = z.object({});
export const ListPoliciesSchema = z.object({});
export const ListCurrenciesSchema = z.object({});
export const ListEventsSchema = z.object({ ...Pg, filter: z.string().optional(), verb: z.string().optional(), created_at_min: z.string().optional() });
export const GetEventSchema = Id("Event");
export const CountEventsSchema = z.object({});
export const ListCountriesSchema = z.object({});
export const GetCountrySchema = Id("Country");
