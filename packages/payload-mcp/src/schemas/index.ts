/**
 * Zod schemas for all Payload CMS MCP tool inputs (14 tools).
 */

import { z } from "zod";

// ─── Collections ─────────────────────────────────────────────────────

export const ListCollectionsSchema = z.object({});

// ─── Entries ─────────────────────────────────────────────────────────

export const ListEntriesSchema = z.object({
  collection: z.string().min(1).describe("Collection slug (e.g., 'posts', 'pages'). Use payload_list_collections to discover available collections."),
  limit: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
  page: z.number().min(1).default(1).describe("Page number"),
  sort: z.string().optional().describe("Sort field with optional minus prefix for descending (e.g., '-createdAt', 'title')"),
  where: z.record(z.string(), z.unknown()).optional().describe("Payload where query object (e.g., { title: { equals: 'Hello' } })"),
  depth: z.number().min(0).max(10).optional().describe("Depth for populating relationships (0-10, default varies by server config)"),
});

export const GetEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  id: z.union([z.string(), z.number()]).describe("Entry ID"),
  depth: z.number().min(0).max(10).optional().describe("Depth for populating relationships"),
});

export const CreateEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  data: z.record(z.string(), z.unknown()).describe("Entry field data matching the collection schema"),
});

export const UpdateEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  id: z.union([z.string(), z.number()]).describe("Entry ID to update"),
  data: z.record(z.string(), z.unknown()).describe("Fields to update"),
});

export const DeleteEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  id: z.union([z.string(), z.number()]).describe("Entry ID to delete"),
});

// ─── Globals ─────────────────────────────────────────────────────────

export const ListGlobalsSchema = z.object({});

export const GetGlobalSchema = z.object({
  slug: z.string().min(1).describe("Global slug (e.g., 'site-settings', 'header', 'footer')"),
  depth: z.number().min(0).max(10).optional().describe("Depth for populating relationships"),
});

export const UpdateGlobalSchema = z.object({
  slug: z.string().min(1).describe("Global slug"),
  data: z.record(z.string(), z.unknown()).describe("Fields to update"),
});

// ─── Media ───────────────────────────────────────────────────────────

export const ListMediaSchema = z.object({
  collection: z.string().min(1).default("media").describe("Upload-enabled collection slug (default: 'media')"),
  limit: z.number().min(1).max(100).default(25).describe("Items per page"),
  page: z.number().min(1).default(1).describe("Page number"),
});

export const UploadMediaSchema = z.object({
  collection: z.string().min(1).default("media").describe("Upload-enabled collection slug (default: 'media')"),
  url: z.string().url().describe("URL of the file to upload"),
  filename: z.string().optional().describe("Override filename"),
  alt: z.string().optional().describe("Alt text for the media file"),
});

// ─── Access ──────────────────────────────────────────────────────────

export const GetAccessSchema = z.object({});

// ─── Versions ────────────────────────────────────────────────────────

export const ListVersionsSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  id: z.union([z.string(), z.number()]).describe("Entry ID to list versions for"),
  limit: z.number().min(1).max(100).default(10).describe("Versions per page"),
  page: z.number().min(1).default(1).describe("Page number"),
});

export const RestoreVersionSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  versionId: z.string().min(1).describe("Version ID to restore"),
});

export const GetVersionSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  version_id: z.string().min(1).describe("Version ID to retrieve"),
});

export const PublishEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug (must have drafts enabled)"),
  id: z.union([z.string(), z.number()]).describe("Entry ID to publish"),
});

export const UnpublishEntrySchema = z.object({
  collection: z.string().min(1).describe("Collection slug (must have drafts enabled)"),
  id: z.union([z.string(), z.number()]).describe("Entry ID to unpublish (revert to draft)"),
});

// ─── System ─────────────────────────────────────────────────────────

export const GetCurrentUserSchema = z.object({});

export const BulkCreateSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  entries: z.array(z.record(z.string(), z.unknown())).min(1).describe("Array of entry data objects to create"),
});

export const BulkUpdateSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  entries: z.array(z.object({
    id: z.union([z.string(), z.number()]).describe("Entry ID to update"),
    data: z.record(z.string(), z.unknown()).describe("Fields to update"),
  })).min(1).describe("Array of entries with id and data to update"),
});

export const BulkDeleteSchema = z.object({
  collection: z.string().min(1).describe("Collection slug"),
  ids: z.array(z.union([z.string(), z.number()])).min(1).describe("Array of entry IDs to delete"),
});
