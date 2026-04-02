/**
 * Zod schemas for all Contentful MCP tool inputs.
 */

import { z } from "zod";

const PaginationMixin = {
  limit: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
  skip: z.number().min(0).default(0).describe("Number of items to skip (pagination offset)"),
};

// ─── Spaces ───────────────────────────────────────────────────────────

export const ListSpacesSchema = z.object({});

// ─── Content Types ────────────────────────────────────────────────────

export const ListContentTypesSchema = z.object({
  ...PaginationMixin,
  order: z.string().optional().describe("Sort order (e.g., 'sys.createdAt', '-sys.updatedAt')"),
});

export const GetContentTypeSchema = z.object({
  contentTypeId: z.string().describe("Content type ID"),
});

export const CreateContentTypeSchema = z.object({
  name: z.string().min(1).describe("Content type name"),
  contentTypeId: z.string().optional().describe("Custom ID (auto-generated if omitted)"),
  description: z.string().optional().describe("Content type description"),
  displayField: z.string().optional().describe("Field ID to use as display/title field"),
  fields: z.array(z.object({
    id: z.string().describe("Field ID"),
    name: z.string().describe("Field display name"),
    type: z.enum([
      "Symbol", "Text", "Integer", "Number", "Date", "Boolean",
      "Object", "Location", "RichText", "Array", "Link",
    ]).describe("Field type"),
    required: z.boolean().default(false).describe("Whether the field is required"),
    localized: z.boolean().default(false).describe("Whether the field supports localization"),
    validations: z.array(z.unknown()).optional().describe("Field validation rules"),
    items: z.object({
      type: z.string().describe("Array item type (e.g., 'Symbol', 'Link')"),
      linkType: z.string().optional().describe("Link type (e.g., 'Entry', 'Asset')"),
      validations: z.array(z.unknown()).optional().describe("Item validation rules"),
    }).optional().describe("Array item definition (required for Array fields)"),
  })).min(1).describe("Content type fields"),
});

// ─── Entries ──────────────────────────────────────────────────────────

export const ListEntriesSchema = z.object({
  ...PaginationMixin,
  content_type: z.string().optional().describe("Filter by content type ID"),
  order: z.string().optional().describe("Sort order (e.g., 'sys.createdAt', '-fields.title')"),
  select: z.string().optional().describe("Fields to include (e.g., 'sys.id,fields.title')"),
  query: z.string().optional().describe("Full-text search query"),
});

export const GetEntrySchema = z.object({
  entryId: z.string().describe("Entry ID"),
});

export const CreateEntrySchema = z.object({
  contentTypeId: z.string().describe("Content type ID for the new entry"),
  fields: z.record(z.unknown()).describe("Entry fields as { fieldId: { locale: value } }"),
  tags: z.array(z.object({
    sys: z.object({
      type: z.literal("Link"),
      linkType: z.literal("Tag"),
      id: z.string(),
    }),
  })).optional().describe("Tags to associate with the entry"),
});

export const UpdateEntrySchema = z.object({
  entryId: z.string().describe("Entry ID to update"),
  version: z.number().describe("Current version (from sys.version) for optimistic locking"),
  fields: z.record(z.unknown()).describe("Updated fields as { fieldId: { locale: value } }"),
  tags: z.array(z.object({
    sys: z.object({
      type: z.literal("Link"),
      linkType: z.literal("Tag"),
      id: z.string(),
    }),
  })).optional().describe("Tags to associate with the entry"),
});

export const DeleteEntrySchema = z.object({
  entryId: z.string().describe("Entry ID to delete"),
  version: z.number().describe("Current version for optimistic locking"),
});

export const PublishEntrySchema = z.object({
  entryId: z.string().describe("Entry ID to publish"),
  version: z.number().describe("Current version for optimistic locking"),
});

export const UnpublishEntrySchema = z.object({
  entryId: z.string().describe("Entry ID to unpublish"),
  version: z.number().describe("Current version for optimistic locking"),
});

// ─── Content Type Mutations ──────────────────────────────────────────

export const UpdateContentTypeSchema = z.object({
  contentTypeId: z.string().describe("Content type ID to update"),
  version: z.number().describe("Current version (from sys.version) for optimistic locking"),
  name: z.string().optional().describe("Updated content type name"),
  description: z.string().optional().describe("Updated description"),
  displayField: z.string().optional().describe("Field ID to use as display/title field"),
  fields: z.array(z.object({
    id: z.string().describe("Field ID"),
    name: z.string().describe("Field display name"),
    type: z.enum([
      "Symbol", "Text", "Integer", "Number", "Date", "Boolean",
      "Object", "Location", "RichText", "Array", "Link",
    ]).describe("Field type"),
    required: z.boolean().default(false).describe("Whether the field is required"),
    localized: z.boolean().default(false).describe("Whether the field supports localization"),
    validations: z.array(z.unknown()).optional().describe("Field validation rules"),
    items: z.object({
      type: z.string().describe("Array item type (e.g., 'Symbol', 'Link')"),
      linkType: z.string().optional().describe("Link type (e.g., 'Entry', 'Asset')"),
      validations: z.array(z.unknown()).optional().describe("Item validation rules"),
    }).optional().describe("Array item definition (required for Array fields)"),
  })).min(1).describe("Full set of content type fields (replaces existing fields)"),
});

export const DeleteContentTypeSchema = z.object({
  contentTypeId: z.string().describe("Content type ID to delete"),
  version: z.number().describe("Current version for optimistic locking"),
});

export const PublishContentTypeSchema = z.object({
  contentTypeId: z.string().describe("Content type ID to publish/activate"),
  version: z.number().describe("Current version for optimistic locking"),
});

// ─── Assets ───────────────────────────────────────────────────────────

export const ListAssetsSchema = z.object({
  ...PaginationMixin,
  mimetype_group: z.string().optional().describe("Filter by MIME type group (e.g., 'image', 'video')"),
  order: z.string().optional().describe("Sort order"),
  query: z.string().optional().describe("Full-text search query"),
});

export const GetAssetSchema = z.object({
  assetId: z.string().describe("Asset ID"),
});

export const UploadAssetSchema = z.object({
  title: z.string().describe("Asset title"),
  description: z.string().optional().describe("Asset description"),
  fileName: z.string().describe("File name including extension"),
  contentType: z.string().describe("MIME type (e.g., 'image/png', 'application/pdf')"),
  uploadUrl: z.string().url().describe("Public URL of the file to upload"),
  locale: z.string().default("en-US").describe("Locale for the asset fields"),
});

export const UpdateAssetSchema = z.object({
  assetId: z.string().describe("Asset ID to update"),
  version: z.number().describe("Current version (from sys.version) for optimistic locking"),
  fields: z.object({
    title: z.record(z.string()).optional().describe("Localized title, e.g. { 'en-US': 'My Image' }"),
    description: z.record(z.string()).optional().describe("Localized description"),
    file: z.record(z.object({
      contentType: z.string().describe("MIME type"),
      fileName: z.string().describe("File name"),
      upload: z.string().url().optional().describe("New upload URL (re-processes the asset)"),
      uploadFrom: z.object({
        sys: z.object({
          type: z.literal("Link"),
          linkType: z.literal("Upload"),
          id: z.string(),
        }),
      }).optional().describe("Reference to an existing upload"),
    })).optional().describe("Localized file object"),
  }).describe("Asset fields to update (title, description, file)"),
});

export const DeleteAssetSchema = z.object({
  assetId: z.string().describe("Asset ID to delete"),
  version: z.number().describe("Current version for optimistic locking"),
});

export const PublishAssetSchema = z.object({
  assetId: z.string().describe("Asset ID to publish"),
  version: z.number().describe("Current version for optimistic locking"),
});

export const UnpublishAssetSchema = z.object({
  assetId: z.string().describe("Asset ID to unpublish"),
  version: z.number().describe("Current version for optimistic locking"),
});

// ─── Environments ─────────────────────────────────────────────────────

export const ListEnvironmentsSchema = z.object({});

// ─── Locales ──────────────────────────────────────────────────────────

export const ListLocalesSchema = z.object({});

// ─── Tags ─────────────────────────────────────────────────────────────

export const ListTagsSchema = z.object({
  ...PaginationMixin,
  order: z.string().optional().describe("Sort order"),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).describe("Tag name"),
  tagId: z.string().min(1).describe("Tag ID (used as the resource identifier)"),
  visibility: z.enum(["public", "private"]).default("private").describe("Tag visibility: 'public' (visible via CDA) or 'private' (CMA only)"),
});

export const DeleteTagSchema = z.object({
  tagId: z.string().describe("Tag ID to delete"),
  version: z.number().describe("Current version for optimistic locking"),
});

// ─── Bulk Actions ─────────────────────────────────────────────────────

export const BulkPublishSchema = z.object({
  entities: z.array(z.object({
    sys: z.object({
      type: z.literal("Link"),
      linkType: z.enum(["Entry", "Asset"]).describe("Entity type to publish"),
      id: z.string().describe("Entity ID"),
      version: z.number().describe("Current version of the entity"),
    }),
  })).min(1).max(200).describe("Entities to publish (max 200 per request)"),
});

export const BulkUnpublishSchema = z.object({
  entities: z.array(z.object({
    sys: z.object({
      type: z.literal("Link"),
      linkType: z.enum(["Entry", "Asset"]).describe("Entity type to unpublish"),
      id: z.string().describe("Entity ID"),
    }),
  })).min(1).max(200).describe("Entities to unpublish (max 200 per request)"),
});

// ─── Webhooks (space-level) ──────────────────────────────────────────

export const ListWebhooksSchema = z.object({});

export const CreateWebhookSchema = z.object({
  name: z.string().min(1).describe("Webhook name"),
  url: z.string().url().describe("Webhook endpoint URL"),
  topics: z.array(z.string()).min(1).describe("Event topics to subscribe to (e.g., 'Entry.publish', 'Asset.create', 'ContentType.*')"),
  headers: z.array(z.object({
    key: z.string().describe("Header name"),
    value: z.string().describe("Header value"),
  })).optional().describe("Custom headers to send with the webhook request"),
  httpBasicUsername: z.string().optional().describe("HTTP basic auth username"),
  httpBasicPassword: z.string().optional().describe("HTTP basic auth password"),
});

export const DeleteWebhookSchema = z.object({
  webhookId: z.string().describe("Webhook definition ID to delete"),
});
