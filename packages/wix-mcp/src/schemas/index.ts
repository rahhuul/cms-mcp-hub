import { z } from "zod";

// ═══ Data Collections ═════════════════════════════════════════════════
export const ListDataCollectionsSchema = z.object({
  limit: z.number().min(1).max(50).default(25).describe("Items per page (max 50)"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

export const GetDataCollectionSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
});

// ═══ Data Items ═══════════════════════════════════════════════════════
export const QueryDataItemsSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  filter: z.record(z.string(), z.unknown()).optional().describe("WQL filter object, e.g. {\"field\":{\"$eq\":\"value\"}}"),
  sort: z.array(z.object({
    fieldName: z.string(),
    order: z.enum(["ASC", "DESC"]).default("ASC"),
  })).optional().describe("Sort order"),
  limit: z.number().min(1).max(50).default(25).describe("Items per page"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
  fields: z.array(z.string()).optional().describe("Fields to return"),
});

export const GetDataItemSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  itemId: z.string().min(1).describe("Data item ID"),
});

export const InsertDataItemSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  item: z.record(z.string(), z.unknown()).describe("Item data fields"),
});

export const UpdateDataItemSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  itemId: z.string().min(1).describe("Data item ID"),
  item: z.record(z.string(), z.unknown()).describe("Updated item data fields"),
});

export const RemoveDataItemSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  itemId: z.string().min(1).describe("Data item ID"),
});

export const BulkInsertDataItemsSchema = z.object({
  collectionId: z.string().min(1).describe("Data collection ID"),
  items: z.array(z.record(z.string(), z.unknown())).min(1).max(50).describe("Array of item data objects (max 50)"),
});

// ═══ Contacts ═════════════════════════════════════════════════════════
export const ListContactsSchema = z.object({
  filter: z.record(z.string(), z.unknown()).optional().describe("WQL filter for contacts"),
  sort: z.array(z.object({
    fieldName: z.string(),
    order: z.enum(["ASC", "DESC"]).default("ASC"),
  })).optional().describe("Sort order"),
  limit: z.number().min(1).max(50).default(25).describe("Items per page"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

export const CreateContactSchema = z.object({
  info: z.object({
    name: z.object({
      first: z.string().optional(),
      last: z.string().optional(),
    }).optional(),
    emails: z.array(z.object({
      email: z.string(),
      primary: z.boolean().optional(),
      tag: z.enum(["UNTAGGED", "MAIN", "HOME", "WORK"]).optional(),
    })).optional(),
    phones: z.array(z.object({
      phone: z.string(),
      primary: z.boolean().optional(),
      tag: z.enum(["UNTAGGED", "MAIN", "HOME", "MOBILE", "WORK"]).optional(),
    })).optional(),
    company: z.string().optional().describe("Company name"),
    jobTitle: z.string().optional(),
  }).describe("Contact information"),
});

// ═══ Products (Wix Stores) ════════════════════════════════════════════
export const ListProductsSchema = z.object({
  limit: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
  includeVariants: z.boolean().optional().describe("Include product variants"),
});

export const GetProductSchema = z.object({
  productId: z.string().min(1).describe("Product ID"),
  includeVariants: z.boolean().optional().describe("Include product variants"),
});

// ═══ Orders (Wix eCommerce) ═══════════════════════════════════════════
export const ListOrdersSchema = z.object({
  limit: z.number().min(1).max(100).default(25).describe("Items per page"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

export const GetOrderSchema = z.object({
  orderId: z.string().min(1).describe("Order ID"),
});

// ═══ Blog ═════════════════════════════════════════════════════════════
export const ListBlogPostsSchema = z.object({
  limit: z.number().min(1).max(100).default(25).describe("Items per page"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
  featured: z.boolean().optional().describe("Filter by featured status"),
  status: z.enum(["PUBLISHED", "DRAFT"]).optional().describe("Filter by publish status"),
});

export const CreateBlogPostSchema = z.object({
  title: z.string().min(1).describe("Post title"),
  richContent: z.record(z.string(), z.unknown()).optional().describe("Rich content object for post body"),
  excerpt: z.string().optional().describe("Post excerpt"),
  featured: z.boolean().optional().describe("Mark as featured"),
  categoryIds: z.array(z.string()).optional().describe("Blog category IDs"),
  tags: z.array(z.string()).optional().describe("Post tags"),
  status: z.enum(["PUBLISHED", "DRAFT"]).default("DRAFT").describe("Publish status"),
});

// ═══ Bookings ═════════════════════════════════════════════════════════
export const ListBookingServicesSchema = z.object({
  limit: z.number().min(1).max(100).default(25).describe("Items per page"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

// ═══ Site ═════════════════════════════════════════════════════════════
export const GetSitePropertiesSchema = z.object({});
