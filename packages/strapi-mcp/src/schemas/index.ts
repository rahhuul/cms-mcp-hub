/**
 * Zod schemas for all Strapi MCP tool inputs.
 */

import { z } from "zod";

// ─── Content Types ────────────────────────────────────────────────────

export const ListContentTypesSchema = z.object({});

export const ListComponentsSchema = z.object({});

// ─── Entries ──────────────────────────────────────────────────────────

export const ListEntriesSchema = z.object({
  contentType: z.string().min(1).describe("Content type API name (e.g., 'articles', 'products'). Use strapi_list_content_types to discover available types."),
  page: z.number().min(1).default(1).describe("Page number"),
  pageSize: z.number().min(1).max(100).default(25).describe("Items per page (max 100)"),
  sort: z.string().optional().describe("Sort field and direction (e.g., 'createdAt:desc', 'title:asc')"),
  filters: z.record(z.string(), z.unknown()).optional().describe("Strapi filters object (e.g., { title: { $contains: 'hello' } })"),
  populate: z.union([z.string(), z.record(z.string(), z.unknown())]).optional().describe("Relations to populate. Use '*' for all, or specify per-relation."),
  fields: z.array(z.string()).optional().describe("Specific fields to return"),
  publicationState: z.enum(["live", "preview"]).optional().describe("'live' for published only, 'preview' to include drafts"),
  locale: z.string().optional().describe("Locale code for i18n content (e.g., 'en', 'fr')"),
});

export const GetEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Entry ID"),
  populate: z.union([z.string(), z.record(z.string(), z.unknown())]).optional().describe("Relations to populate"),
  fields: z.array(z.string()).optional().describe("Specific fields to return"),
  locale: z.string().optional().describe("Locale code"),
});

export const CreateEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  data: z.record(z.string(), z.unknown()).describe("Entry field data matching the content type schema"),
});

export const UpdateEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Entry ID to update"),
  data: z.record(z.string(), z.unknown()).describe("Fields to update"),
});

export const DeleteEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Entry ID to delete"),
});

export const BulkDeleteSchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  ids: z.array(z.number()).min(1).describe("Array of entry IDs to delete"),
});

// ─── Publish / Unpublish ──────────────────────────────────────────────

export const PublishEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Entry ID to publish"),
});

export const UnpublishEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Entry ID to unpublish"),
});

// ─── Media ────────────────────────────────────────────────────────────

export const ListMediaSchema = z.object({
  page: z.number().min(1).default(1).describe("Page number"),
  pageSize: z.number().min(1).max(100).default(25).describe("Items per page"),
});

export const UploadMediaSchema = z.object({
  url: z.string().url().describe("URL of the file to upload"),
  name: z.string().optional().describe("File name override"),
  caption: z.string().optional().describe("File caption"),
  alternativeText: z.string().optional().describe("Alt text for images"),
});

export const DeleteMediaSchema = z.object({
  id: z.number().describe("Media file ID to delete"),
});

// ─── Users & Roles ────────────────────────────────────────────────────

export const ListUsersSchema = z.object({});

export const ListRolesSchema = z.object({});

// ─── Locales ──────────────────────────────────────────────────────────

export const GetLocalesSchema = z.object({});

export const CreateLocalizedEntrySchema = z.object({
  contentType: z.string().min(1).describe("Content type API name"),
  id: z.number().describe("Source entry ID to create localization for"),
  locale: z.string().min(1).describe("Target locale code (e.g., 'fr', 'de', 'es')"),
  data: z.record(z.string(), z.unknown()).describe("Localized field data"),
});
