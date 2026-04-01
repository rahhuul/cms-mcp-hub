/**
 * Content tools: GROQ queries, document CRUD, and publishing.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { SanityClient } from "../api/client.js";
import {
  QuerySchema,
  GetDocumentSchema,
  CreateDocumentSchema,
  UpdateDocumentSchema,
  DeleteDocumentSchema,
  PublishDraftSchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: SanityClient): void {
  // GROQ Query
  server.tool(
    "sanity_query",
    "Execute a GROQ query against the Sanity dataset. Returns matching documents. Example: '*[_type == \"post\"] | order(_createdAt desc) [0...10]'",
    QuerySchema.shape,
    async (p) => {
      try {
        const v = QuerySchema.parse(p);
        const result = await client.query(v.query, v.params);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_query");
      }
    },
  );

  // Get Document
  server.tool(
    "sanity_get_document",
    "Get a single Sanity document by ID. Returns the full document with all fields. Use 'drafts.{id}' to get the draft version.",
    GetDocumentSchema.shape,
    async (p) => {
      try {
        const v = GetDocumentSchema.parse(p);
        const result = await client.getDocument(v.id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_get_document");
      }
    },
  );

  // Create Document
  server.tool(
    "sanity_create_document",
    "Create a new document in Sanity. Provide _type and data fields. Optionally set _id for a custom document ID.",
    CreateDocumentSchema.shape,
    async (p) => {
      try {
        const v = CreateDocumentSchema.parse(p);
        const doc: Record<string, unknown> = {
          _type: v._type,
          ...v.data,
        };
        if (v._id) {
          doc["_id"] = v._id;
        }
        const result = await client.mutate(
          [{ create: doc }],
          { returnIds: true, returnDocuments: true },
        );
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_create_document");
      }
    },
  );

  // Update Document
  server.tool(
    "sanity_update_document",
    "Update an existing Sanity document. Use 'set' to overwrite fields and 'unset' to remove fields. Supports optimistic locking via ifRevisionID.",
    UpdateDocumentSchema.shape,
    async (p) => {
      try {
        const v = UpdateDocumentSchema.parse(p);
        const patch: Record<string, unknown> = { id: v.id };
        if (v.set) patch["set"] = v.set;
        if (v.unset) patch["unset"] = v.unset;
        if (v.ifRevisionID) patch["ifRevisionID"] = v.ifRevisionID;
        const result = await client.mutate(
          [{ patch }],
          { returnIds: true, returnDocuments: true },
        );
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_update_document");
      }
    },
  );

  // Delete Document
  server.tool(
    "sanity_delete_document",
    "Delete a Sanity document by ID. This is permanent and cannot be undone.",
    DeleteDocumentSchema.shape,
    async (p) => {
      try {
        const v = DeleteDocumentSchema.parse(p);
        const result = await client.mutate(
          [{ delete: { id: v.id } }],
          { returnIds: true },
        );
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_delete_document");
      }
    },
  );

  // Publish Draft
  server.tool(
    "sanity_publish_draft",
    "Publish a draft document by copying it to the published document ID. Removes the 'drafts.' prefix and deletes the draft.",
    PublishDraftSchema.shape,
    async (p) => {
      try {
        const v = PublishDraftSchema.parse(p);
        // Ensure the draft ID has the "drafts." prefix
        const draftId = v.draftId.startsWith("drafts.")
          ? v.draftId
          : `drafts.${v.draftId}`;
        const publishedId = draftId.replace(/^drafts\./, "");

        // 1. Fetch the draft document
        const draftResult = await client.getDocument<Record<string, unknown>>(draftId);
        const draft = draftResult.documents?.[0];
        if (!draft) {
          return mcpError(
            new Error(`Draft document not found: ${draftId}`),
            "sanity_publish_draft",
          );
        }

        // 2. Create or replace the published version, then delete the draft
        const { _id: _discardId, _rev: _discardRev, ...docFields } = draft;
        const result = await client.mutate(
          [
            { createOrReplace: { ...docFields, _id: publishedId } },
            { delete: { id: draftId } },
          ],
          { returnIds: true },
        );
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "sanity_publish_draft");
      }
    },
  );
}
