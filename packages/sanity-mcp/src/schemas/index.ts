import { z } from "zod";

// ═══ Query ════════════════════════════════════════════════════════════════
export const QuerySchema = z.object({
  query: z.string().min(1).describe("GROQ query string (e.g., '*[_type == \"post\"]')"),
  params: z.record(z.string(), z.string()).optional().describe("GROQ query parameters as key-value pairs"),
});

// ═══ Documents ════════════════════════════════════════════════════════════
export const GetDocumentSchema = z.object({
  id: z.string().min(1).describe("Document ID (e.g., 'abc123' or 'drafts.abc123')"),
});

export const CreateDocumentSchema = z.object({
  _type: z.string().min(1).describe("Document type (e.g., 'post', 'author')"),
  _id: z.string().optional().describe("Optional document ID (auto-generated if omitted)"),
  data: z.record(z.string(), z.unknown()).describe("Document fields as key-value pairs"),
});

export const UpdateDocumentSchema = z.object({
  id: z.string().min(1).describe("Document ID to update"),
  set: z.record(z.string(), z.unknown()).optional().describe("Fields to set/overwrite"),
  unset: z.array(z.string()).optional().describe("Field paths to remove"),
  ifRevisionID: z.string().optional().describe("Optimistic locking — only apply if document revision matches"),
});

export const DeleteDocumentSchema = z.object({
  id: z.string().min(1).describe("Document ID to delete"),
});

// ═══ Datasets ═════════════════════════════════════════════════════════════
export const ListDatasetsSchema = z.object({});

// ═══ Document Types ═══════════════════════════════════════════════════════
export const ListDocumentTypesSchema = z.object({});

// ═══ Assets ═══════════════════════════════════════════════════════════════
export const ListAssetsSchema = z.object({
  type: z.enum(["image", "file"]).default("image").describe("Asset type to list"),
  limit: z.number().min(1).max(100).default(25).describe("Number of assets to return"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

export const UploadImageSchema = z.object({
  url: z.string().url().describe("URL of the image to upload to Sanity"),
  filename: z.string().optional().describe("Optional filename for the uploaded image"),
});

// ═══ Transactions ═════════════════════════════════════════════════════════
export const CreateTransactionSchema = z.object({
  mutations: z.array(z.record(z.string(), z.unknown())).min(1).describe("Array of mutation objects (create, createOrReplace, createIfNotExists, delete, patch)"),
  returnIds: z.boolean().optional().default(true).describe("Return document IDs in response"),
  returnDocuments: z.boolean().optional().default(false).describe("Return full documents in response"),
  visibility: z.enum(["sync", "async", "deferred"]).optional().default("sync").describe("Transaction visibility mode"),
});

// ═══ History ══════════════════════════════════════════════════════════════
export const GetHistorySchema = z.object({
  documentId: z.string().min(1).describe("Document ID to get history for"),
});

// ═══ Publishing ═══════════════════════════════════════════════════════════
export const PublishDraftSchema = z.object({
  draftId: z.string().min(1).describe("Draft document ID (with or without 'drafts.' prefix)"),
});
