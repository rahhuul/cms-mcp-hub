/**
 * System tools: datasets, document types, assets, transactions, history.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { SanityClient } from "../api/client.js";
import type { SanityMutation } from "../types/index.js";
import {
  ListDatasetsSchema,
  ListDocumentTypesSchema,
  ListAssetsSchema,
  UploadImageSchema,
  UploadFileSchema,
  ExportDatasetSchema,
  CreateTransactionSchema,
  GetHistorySchema,
} from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: SanityClient): void {
  // List Datasets
  server.tool(
    "sanity_list_datasets",
    "List all datasets in the Sanity project. Returns dataset names and access control modes.",
    ListDatasetsSchema.shape,
    async (p) => {
      try {
        ListDatasetsSchema.parse(p);
        const result = await client.listDatasets();
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_list_datasets");
      }
    },
  );

  // List Document Types
  server.tool(
    "sanity_list_document_types",
    "List all unique document types (_type values) in the dataset. Useful for discovering the content schema.",
    ListDocumentTypesSchema.shape,
    async (p) => {
      try {
        ListDocumentTypesSchema.parse(p);
        const result = await client.listDocumentTypes();
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_list_document_types");
      }
    },
  );

  // List Assets
  server.tool(
    "sanity_list_assets",
    "List image or file assets in the dataset with pagination. Returns asset URLs, filenames, sizes, and MIME types.",
    ListAssetsSchema.shape,
    async (p) => {
      try {
        const v = ListAssetsSchema.parse(p);
        const result = await client.listAssets(v.type, v.limit, v.offset);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_list_assets");
      }
    },
  );

  // Upload Image
  server.tool(
    "sanity_upload_image",
    "Upload an image to Sanity from a URL. Returns the asset document with _id and URL for referencing in documents.",
    UploadImageSchema.shape,
    async (p) => {
      try {
        const v = UploadImageSchema.parse(p);
        const result = await client.uploadImage(v.url, v.filename);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_upload_image");
      }
    },
  );

  // Upload File
  server.tool(
    "sanity_upload_file",
    "Upload a file asset to Sanity from a URL. Returns the asset document with _id and URL for referencing in documents. Supports any file type (PDF, CSV, etc.).",
    UploadFileSchema.shape,
    async (p) => {
      try {
        const v = UploadFileSchema.parse(p);
        const result = await client.uploadFile(
          v.url,
          v.filename,
        );
        if (v.label && result.document) {
          result.document["label"] = v.label;
        }
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_upload_file");
      }
    },
  );

  // Export Dataset
  server.tool(
    "sanity_export_dataset",
    "Export an entire Sanity dataset as NDJSON. Optionally filter by document types. Returns all documents, assets, and system documents.",
    ExportDatasetSchema.shape,
    async (p) => {
      try {
        const v = ExportDatasetSchema.parse(p);
        const result = await client.exportDataset(v.dataset, v.types);
        return mcpSuccess({ format: "ndjson", data: result });
      } catch (e) {
        return mcpError(e, "sanity_export_dataset");
      }
    },
  );

  // Create Transaction (atomic mutations)
  server.tool(
    "sanity_create_transaction",
    "Execute multiple mutations atomically in a single transaction. Supports create, createOrReplace, createIfNotExists, delete, and patch operations.",
    CreateTransactionSchema.shape,
    async (p) => {
      try {
        const v = CreateTransactionSchema.parse(p);
        const result = await client.mutate(
          v.mutations as SanityMutation[],
          {
            returnIds: v.returnIds,
            returnDocuments: v.returnDocuments,
            visibility: v.visibility,
          },
        );
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_create_transaction");
      }
    },
  );

  // Get History
  server.tool(
    "sanity_get_history",
    "Get the transaction history for a specific document. Returns a list of mutations applied to the document over time.",
    GetHistorySchema.shape,
    async (p) => {
      try {
        const v = GetHistorySchema.parse(p);
        const result = await client.getHistory(v.documentId);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_get_history");
      }
    },
  );
}
