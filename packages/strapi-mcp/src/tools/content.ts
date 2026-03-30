/**
 * Content tools (9): list_content_types, list_entries, get_entry, create_entry,
 * update_entry, delete_entry, bulk_delete, publish_entry, unpublish_entry
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { StrapiClient } from "../api/client.js";
import {
  ListContentTypesSchema,
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  BulkDeleteSchema,
  PublishEntrySchema,
  UnpublishEntrySchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: StrapiClient): void {
  // ─── 1. strapi_list_content_types ────────────────────────────────
  server.tool(
    "strapi_list_content_types",
    "Discover all available content types and their field schemas. Use this first to learn what content types exist and what fields they have before creating or querying entries.",
    ListContentTypesSchema.shape,
    async () => {
      try {
        const types = await client.getContentTypes();
        return mcpSuccess(
          types.map((ct) => ({
            uid: ct.uid,
            apiID: ct.apiID,
            displayName: ct.schema.displayName,
            singularName: ct.schema.singularName,
            pluralName: ct.schema.pluralName,
            kind: ct.schema.kind,
            attributes: Object.fromEntries(
              Object.entries(ct.schema.attributes).map(([name, attr]) => [
                name,
                { type: attr.type, required: attr.required, relation: attr.relation, target: attr.target },
              ]),
            ),
          })),
        );
      } catch (error) {
        return mcpError(error, "strapi_list_content_types");
      }
    },
  );

  // ─── 2. strapi_list_entries ──────────────────────────────────────
  server.tool(
    "strapi_list_entries",
    "List entries for any content type with filtering, sorting, pagination, and relation population. Use strapi_list_content_types first to discover available content types.",
    ListEntriesSchema.shape,
    async (params) => {
      try {
        const { contentType, page, pageSize, sort, filters, populate, fields, publicationState, locale } =
          ListEntriesSchema.parse(params);

        const queryParams: Record<string, unknown> = {
          pagination: { page, pageSize },
        };
        if (sort) queryParams["sort"] = [sort];
        if (filters) queryParams["filters"] = filters;
        if (populate) queryParams["populate"] = populate;
        if (fields) queryParams["fields"] = fields;
        if (publicationState) queryParams["publicationState"] = publicationState;
        if (locale) queryParams["locale"] = locale;

        const result = await client.listEntries(contentType, queryParams);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "strapi_list_entries");
      }
    },
  );

  // ─── 3. strapi_get_entry ─────────────────────────────────────────
  server.tool(
    "strapi_get_entry",
    "Get a single entry by ID with optional relation population. Returns full entry data including all fields.",
    GetEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id, populate, fields, locale } = GetEntrySchema.parse(params);
        const queryParams: Record<string, unknown> = {};
        if (populate) queryParams["populate"] = populate;
        if (fields) queryParams["fields"] = fields;
        if (locale) queryParams["locale"] = locale;

        const result = await client.getEntry(contentType, id, queryParams);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "strapi_get_entry");
      }
    },
  );

  // ─── 4. strapi_create_entry ──────────────────────────────────────
  server.tool(
    "strapi_create_entry",
    "Create a new entry for any content type. Provide field data matching the content type schema. Use strapi_list_content_types to see required fields.",
    CreateEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, data } = CreateEntrySchema.parse(params);
        const result = await client.createEntry(contentType, data);
        return mcpSuccess({
          ...result,
          message: `Entry created in '${contentType}' (ID: ${result.data.id})`,
        });
      } catch (error) {
        return mcpError(error, "strapi_create_entry");
      }
    },
  );

  // ─── 5. strapi_update_entry ──────────────────────────────────────
  server.tool(
    "strapi_update_entry",
    "Update an existing entry's fields. Only provided fields are changed — omit fields you don't want to modify.",
    UpdateEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id, data } = UpdateEntrySchema.parse(params);
        const result = await client.updateEntry(contentType, id, data);
        return mcpSuccess({ ...result, message: `Entry ${id} updated in '${contentType}'` });
      } catch (error) {
        return mcpError(error, "strapi_update_entry");
      }
    },
  );

  // ─── 6. strapi_delete_entry ──────────────────────────────────────
  server.tool(
    "strapi_delete_entry",
    "Delete a single entry by ID.",
    DeleteEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id } = DeleteEntrySchema.parse(params);
        await client.deleteEntry(contentType, id);
        return mcpSuccess({ message: `Entry ${id} deleted from '${contentType}'` });
      } catch (error) {
        return mcpError(error, "strapi_delete_entry");
      }
    },
  );

  // ─── 7. strapi_bulk_delete ───────────────────────────────────────
  server.tool(
    "strapi_bulk_delete",
    "Delete multiple entries at once by their IDs.",
    BulkDeleteSchema.shape,
    async (params) => {
      try {
        const { contentType, ids } = BulkDeleteSchema.parse(params);
        const result = await client.bulkDeleteEntries(contentType, ids);
        return mcpSuccess({ ...result, message: `Deleted ${result.count} entries from '${contentType}'` });
      } catch (error) {
        return mcpError(error, "strapi_bulk_delete");
      }
    },
  );

  // ─── 8. strapi_publish_entry ─────────────────────────────────────
  server.tool(
    "strapi_publish_entry",
    "Publish a draft entry, making it publicly visible.",
    PublishEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id } = PublishEntrySchema.parse(params);
        const result = await client.publishEntry(contentType, id);
        return mcpSuccess({ ...result, message: `Entry ${id} published in '${contentType}'` });
      } catch (error) {
        return mcpError(error, "strapi_publish_entry");
      }
    },
  );

  // ─── 9. strapi_unpublish_entry ───────────────────────────────────
  server.tool(
    "strapi_unpublish_entry",
    "Unpublish an entry, reverting it to draft state.",
    UnpublishEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id } = UnpublishEntrySchema.parse(params);
        const result = await client.unpublishEntry(contentType, id);
        return mcpSuccess({ ...result, message: `Entry ${id} unpublished in '${contentType}'` });
      } catch (error) {
        return mcpError(error, "strapi_unpublish_entry");
      }
    },
  );
}
