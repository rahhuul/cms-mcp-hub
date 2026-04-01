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

// ─── Assets ───────────────────────────────────────────────────────────

export const ListAssetsSchema = z.object({
  ...PaginationMixin,
  mimetype_group: z.string().optional().describe("Filter by MIME type group (e.g., 'image', 'video')"),
  order: z.string().optional().describe("Sort order"),
  query: z.string().optional().describe("Full-text search query"),
});

export const UploadAssetSchema = z.object({
  title: z.string().describe("Asset title"),
  description: z.string().optional().describe("Asset description"),
  fileName: z.string().describe("File name including extension"),
  contentType: z.string().describe("MIME type (e.g., 'image/png', 'application/pdf')"),
  uploadUrl: z.string().url().describe("Public URL of the file to upload"),
  locale: z.string().default("en-US").describe("Locale for the asset fields"),
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
