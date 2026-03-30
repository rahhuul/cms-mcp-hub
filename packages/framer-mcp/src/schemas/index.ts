/**
 * Zod schemas for all Framer MCP tool inputs.
 */

import { z } from "zod";

// ─── Project ──────────────────────────────────────────────────────────

export const GetProjectInfoSchema = z.object({});

export const GetProjectSettingsSchema = z.object({});

export const UpdateProjectSettingsSchema = z.object({
  customCode: z.object({
    location: z.enum(["headStart", "headEnd", "bodyStart", "bodyEnd"]).describe("Where to inject the code"),
    html: z.string().describe("The HTML/JS code to inject"),
  }).optional().describe("Custom code to inject into pages"),
});

// ─── Collections ──────────────────────────────────────────────────────

export const ListCollectionsSchema = z.object({});

export const GetCollectionSchema = z.object({
  collectionId: z.string().describe("The collection ID"),
});

export const CreateCollectionSchema = z.object({
  name: z.string().min(1).describe("Name for the new collection"),
});

// ─── Collection Fields ────────────────────────────────────────────────

export const CreateCollectionFieldSchema = z.object({
  collectionId: z.string().describe("The collection ID to add the field to"),
  name: z.string().min(1).describe("Display name for the field"),
  type: z.enum([
    "boolean",
    "color",
    "number",
    "string",
    "formattedText",
    "image",
    "link",
    "date",
    "file",
    "enum",
  ]).describe("The field type"),
  required: z.boolean().default(false).describe("Whether the field is required"),
  enumCases: z.array(z.object({
    name: z.string().describe("Enum case name"),
  })).optional().describe("Enum cases (required if type is 'enum')"),
});

// ─── Collection Items ─────────────────────────────────────────────────

export const CreateCollectionItemSchema = z.object({
  collectionId: z.string().describe("The collection ID to add the item to"),
  slug: z.string().min(1).describe("URL-friendly slug for the item (must be unique)"),
  draft: z.boolean().default(false).describe("Whether the item is a draft"),
  fieldData: z.record(z.string(), z.unknown()).default({}).describe(
    "Field data keyed by field ID. Each value should be { type: '<fieldType>', value: <value> }",
  ),
});

export const UpdateCollectionItemSchema = z.object({
  collectionId: z.string().describe("The collection ID containing the item"),
  itemId: z.string().describe("The item ID to update"),
  slug: z.string().optional().describe("New slug for the item"),
  draft: z.boolean().optional().describe("Whether the item is a draft"),
  fieldData: z.record(z.string(), z.unknown()).optional().describe(
    "Updated field data keyed by field ID",
  ),
});

export const DeleteCollectionItemSchema = z.object({
  itemIds: z.array(z.string()).min(1).describe("Array of item IDs to delete"),
});

// ─── Pages ────────────────────────────────────────────────────────────

export const ListPagesSchema = z.object({});

export const GetPageSchema = z.object({
  pageId: z.string().describe("The page node ID"),
});

export const UpdatePageSchema = z.object({
  pageId: z.string().describe("The page node ID to update"),
  title: z.string().optional().describe("New page title"),
  path: z.string().optional().describe("New URL path for the page"),
  visible: z.boolean().optional().describe("Whether the page is visible/published"),
});

// ─── Code Files ───────────────────────────────────────────────────────

export const ListCodeFilesSchema = z.object({});

export const GetCodeFileSchema = z.object({
  codeFileId: z.string().describe("The code file ID"),
});

export const CreateCodeFileSchema = z.object({
  name: z.string().min(1).describe("File name for the code component (e.g., 'MyComponent.tsx')"),
  code: z.string().describe("The TypeScript/React code content"),
});

export const UpdateCodeFileSchema = z.object({
  codeFileId: z.string().describe("The code file ID to update"),
  code: z.string().describe("The updated TypeScript/React code content"),
});

// ─── Publishing ───────────────────────────────────────────────────────

export const GetChangesSchema = z.object({});

export const PublishPreviewSchema = z.object({});

export const PromoteToProductionSchema = z.object({
  deploymentId: z.string().describe("The deployment ID to promote (from a previous publish)"),
  domains: z.array(z.string()).optional().describe("Specific domains to deploy to (optional, deploys to all if omitted)"),
});
