/**
 * Zod schemas for all Webflow MCP tool inputs.
 * 20 tools across sites, collections, items, pages, products, orders, publishing, domains, webhooks.
 */

import { z } from "zod";

const PaginationMixin = {
  limit: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
};

// ─── Sites ────────────────────────────────────────────────────────────

export const ListSitesSchema = z.object({});

export const GetSiteSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
});

// ─── Collections ──────────────────────────────────────────────────────

export const ListCollectionsSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
});

export const GetCollectionSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
});

// ─── Collection Items ─────────────────────────────────────────────────

export const ListItemsSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  ...PaginationMixin,
  cmsLocaleId: z.string().optional().describe("Locale ID for localized content"),
  sortBy: z.string().optional().describe("Field slug to sort by (prefix with - for descending)"),
  sortOrder: z.string().optional().describe("Sort order: 'asc' or 'desc'"),
});

export const GetItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID"),
  cmsLocaleId: z.string().optional().describe("Locale ID for localized content"),
});

export const CreateItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  isArchived: z.boolean().optional().default(false).describe("Whether the item is archived"),
  isDraft: z.boolean().optional().default(false).describe("Whether the item is a draft"),
  fieldData: z.record(z.unknown()).describe("Field data matching the collection schema — must include 'name' and 'slug' at minimum"),
  cmsLocaleId: z.string().optional().describe("Locale ID for localized content"),
});

export const UpdateItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID to update"),
  isArchived: z.boolean().optional().describe("Whether the item is archived"),
  isDraft: z.boolean().optional().describe("Whether the item is a draft"),
  fieldData: z.record(z.unknown()).describe("Updated field data"),
  cmsLocaleId: z.string().optional().describe("Locale ID for localized content"),
});

export const DeleteItemSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemId: z.string().describe("Item ID to delete"),
  cmsLocaleId: z.string().optional().describe("Locale ID for localized content"),
});

export const PublishItemsSchema = z.object({
  collectionId: z.string().describe("Collection ID"),
  itemIds: z.array(z.string()).min(1).max(100).describe("Array of item IDs to publish (max 100)"),
});

// ─── Pages ────────────────────────────────────────────────────────────

export const ListPagesSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  ...PaginationMixin,
  locale: z.string().optional().describe("Locale code for localized content"),
});

export const GetPageSchema = z.object({
  pageId: z.string().describe("Page ID"),
  locale: z.string().optional().describe("Locale code for localized content"),
});

export const UpdatePageSchema = z.object({
  pageId: z.string().describe("Page ID to update"),
  title: z.string().optional().describe("Page title"),
  slug: z.string().optional().describe("Page URL slug"),
  description: z.string().optional().describe("Page meta description"),
  openGraph: z.object({
    title: z.string().optional(),
    titleCopied: z.boolean().optional(),
    description: z.string().optional(),
    descriptionCopied: z.boolean().optional(),
  }).optional().describe("OpenGraph metadata"),
  seo: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
  }).optional().describe("SEO metadata"),
  locale: z.string().optional().describe("Locale code for localized content"),
});

// ─── Products (E-commerce) ────────────────────────────────────────────

export const ListProductsSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  ...PaginationMixin,
});

export const CreateProductSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  isArchived: z.boolean().optional().default(false).describe("Whether the product is archived"),
  isDraft: z.boolean().optional().default(false).describe("Whether the product is a draft"),
  product: z.object({
    fieldData: z.record(z.unknown()).describe("Product field data including name, slug, description, price"),
  }).describe("Product data container"),
  sku: z.object({
    fieldData: z.record(z.unknown()).describe("SKU field data including name, slug, price"),
  }).optional().describe("Default SKU data"),
});

// ─── Orders (E-commerce) ──────────────────────────────────────────────

export const ListOrdersSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  ...PaginationMixin,
  status: z.enum(["pending", "unfulfilled", "fulfilled", "disputed", "dispute-lost", "refunded"]).optional().describe("Filter by order status"),
});

export const GetOrderSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  orderId: z.string().describe("Order ID"),
});

// ─── Publish ──────────────────────────────────────────────────────────

export const PublishSiteSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
  domains: z.array(z.string()).optional().describe("Specific domain IDs to publish to (publishes to all if omitted)"),
});

// ─── Domains ──────────────────────────────────────────────────────────

export const ListDomainsSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
});

// ─── Webhooks ─────────────────────────────────────────────────────────

export const ListWebhooksSchema = z.object({
  siteId: z.string().describe("Webflow Site ID"),
});
