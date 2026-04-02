/**
 * Content tools (9): list_collections, list_entries, get_entry, create_entry,
 * update_entry, delete_entry, get_version, publish_entry, unpublish_entry
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PayloadClient } from "../api/client.js";
import {
  ListCollectionsSchema,
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  GetVersionSchema,
  PublishEntrySchema,
  UnpublishEntrySchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: PayloadClient): void {
  // ─── 1. payload_list_collections ──────────────────────────────────
  server.tool(
    "payload_list_collections",
    "Discover all available collections and their field schemas. Use this first to learn what collections exist and what fields they have before creating or querying entries.",
    ListCollectionsSchema.shape,
    async () => {
      try {
        const collections = await client.listCollections();
        return mcpSuccess(
          collections.map((c) => ({
            slug: c.slug,
            labels: c.labels,
            auth: c.auth ?? false,
            upload: c.upload ?? false,
            versions: c.versions ?? false,
            fields: c.fields.map((f) => ({
              name: f.name,
              type: f.type,
              required: f.required,
              unique: f.unique,
              relationTo: f.relationTo,
            })),
          })),
        );
      } catch (error) {
        return mcpError(error, "payload_list_collections");
      }
    },
  );

  // ─── 2. payload_list_entries ──────────────────────────────────────
  server.tool(
    "payload_list_entries",
    "List entries for any collection with filtering, sorting, pagination, and relationship population depth. Use payload_list_collections first to discover available collections.",
    ListEntriesSchema.shape,
    async (params) => {
      try {
        const { collection, limit, page, sort, where, depth } =
          ListEntriesSchema.parse(params);
        const result = await client.listEntries(collection, {
          limit,
          page,
          sort,
          where: where as Record<string, unknown> | undefined,
          depth,
        });
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_list_entries");
      }
    },
  );

  // ─── 3. payload_get_entry ─────────────────────────────────────────
  server.tool(
    "payload_get_entry",
    "Get a single entry by ID with optional relationship population depth. Returns full entry data including all fields.",
    GetEntrySchema.shape,
    async (params) => {
      try {
        const { collection, id, depth } = GetEntrySchema.parse(params);
        const result = await client.getEntry(collection, id, { depth });
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_get_entry");
      }
    },
  );

  // ─── 4. payload_create_entry ──────────────────────────────────────
  server.tool(
    "payload_create_entry",
    "Create a new entry in any collection. Provide field data matching the collection schema. Use payload_list_collections to see required fields.",
    CreateEntrySchema.shape,
    async (params) => {
      try {
        const { collection, data } = CreateEntrySchema.parse(params);
        const result = await client.createEntry(collection, data);
        return mcpSuccess({
          ...result,
          message: `Entry created in '${collection}' (ID: ${result.doc.id})`,
        });
      } catch (error) {
        return mcpError(error, "payload_create_entry");
      }
    },
  );

  // ─── 5. payload_update_entry ──────────────────────────────────────
  server.tool(
    "payload_update_entry",
    "Update an existing entry's fields. Only provided fields are changed -- omit fields you don't want to modify.",
    UpdateEntrySchema.shape,
    async (params) => {
      try {
        const { collection, id, data } = UpdateEntrySchema.parse(params);
        const result = await client.updateEntry(collection, id, data);
        return mcpSuccess({ ...result, message: `Entry ${id} updated in '${collection}'` });
      } catch (error) {
        return mcpError(error, "payload_update_entry");
      }
    },
  );

  // ─── 6. payload_delete_entry ──────────────────────────────────────
  server.tool(
    "payload_delete_entry",
    "Delete a single entry by ID.",
    DeleteEntrySchema.shape,
    async (params) => {
      try {
        const { collection, id } = DeleteEntrySchema.parse(params);
        const result = await client.deleteEntry(collection, id);
        return mcpSuccess({ ...result, message: `Entry ${id} deleted from '${collection}'` });
      } catch (error) {
        return mcpError(error, "payload_delete_entry");
      }
    },
  );

  // ─── 7. payload_get_version ──────────────────────────────────────
  server.tool(
    "payload_get_version",
    "Get a specific version of an entry by version ID. Use payload_list_versions to discover version IDs first.",
    GetVersionSchema.shape,
    async (params) => {
      try {
        const { collection, version_id } = GetVersionSchema.parse(params);
        const result = await client.getVersion(collection, version_id);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_get_version");
      }
    },
  );

  // ─── 8. payload_publish_entry ────────────────────────────────────
  server.tool(
    "payload_publish_entry",
    "Publish a draft entry by setting its _status to 'published'. The collection must have drafts enabled.",
    PublishEntrySchema.shape,
    async (params) => {
      try {
        const { collection, id } = PublishEntrySchema.parse(params);
        const result = await client.publishEntry(collection, id);
        return mcpSuccess({ ...result, message: `Entry ${id} published in '${collection}'` });
      } catch (error) {
        return mcpError(error, "payload_publish_entry");
      }
    },
  );

  // ─── 9. payload_unpublish_entry ──────────────────────────────────
  server.tool(
    "payload_unpublish_entry",
    "Unpublish an entry by reverting its _status to 'draft'. The collection must have drafts enabled.",
    UnpublishEntrySchema.shape,
    async (params) => {
      try {
        const { collection, id } = UnpublishEntrySchema.parse(params);
        const result = await client.unpublishEntry(collection, id);
        return mcpSuccess({ ...result, message: `Entry ${id} unpublished in '${collection}'` });
      } catch (error) {
        return mcpError(error, "payload_unpublish_entry");
      }
    },
  );
}
