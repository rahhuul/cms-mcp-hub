/**
 * Content tools (13): content types (6), entries (7)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { ContentfulClient } from "../api/client.js";
import type {
  ContentfulContentType,
  ContentfulEntry,
  ContentfulCollection,
} from "../types/index.js";
import {
  ListContentTypesSchema,
  GetContentTypeSchema,
  CreateContentTypeSchema,
  UpdateContentTypeSchema,
  DeleteContentTypeSchema,
  PublishContentTypeSchema,
  ListEntriesSchema,
  GetEntrySchema,
  CreateEntrySchema,
  UpdateEntrySchema,
  DeleteEntrySchema,
  PublishEntrySchema,
  UnpublishEntrySchema,
} from "../schemas/index.js";

export function registerContentTools(server: McpServer, client: ContentfulClient): void {
  // ─── 1. contentful_list_content_types ─────────────────────────────
  server.tool(
    "contentful_list_content_types",
    "List all content types in the Contentful environment. Returns names, field schemas, and display fields.",
    ListContentTypesSchema.shape,
    async (params) => {
      try {
        const validated = ListContentTypesSchema.parse(params);
        const result = await client.get<ContentfulCollection<ContentfulContentType>>(
          "content_types",
          validated as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_content_types");
      }
    },
  );

  // ─── 2. contentful_get_content_type ───────────────────────────────
  server.tool(
    "contentful_get_content_type",
    "Get a single content type by ID. Returns full field definitions, validations, and display configuration.",
    GetContentTypeSchema.shape,
    async (params) => {
      try {
        const { contentTypeId } = GetContentTypeSchema.parse(params);
        const result = await client.get<ContentfulContentType>(
          `content_types/${contentTypeId}`,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_get_content_type");
      }
    },
  );

  // ─── 3. contentful_create_content_type ────────────────────────────
  server.tool(
    "contentful_create_content_type",
    "Create a new content type with field definitions. After creation, activate it with a separate publish step to make it usable for entries.",
    CreateContentTypeSchema.shape,
    async (params) => {
      try {
        const { contentTypeId, ...body } = CreateContentTypeSchema.parse(params);

        let result: ContentfulContentType;
        if (contentTypeId) {
          result = await client.put<ContentfulContentType>(
            `content_types/${contentTypeId}`,
            body,
          );
        } else {
          result = await client.post<ContentfulContentType>(
            "content_types",
            body,
          );
        }

        return mcpSuccess({
          id: result.sys.id,
          name: result.name,
          version: result.sys.version,
          fieldsCount: result.fields.length,
          message: `Content type '${result.name}' created (version ${result.sys.version}). Activate it by publishing.`,
        });
      } catch (error) {
        return mcpError(error, "contentful_create_content_type");
      }
    },
  );

  // ─── 4. contentful_update_content_type ─────────────────────────────
  server.tool(
    "contentful_update_content_type",
    "Update an existing content type's fields and configuration. Requires the current version for optimistic locking. All fields must be provided (replaces the entire field set).",
    UpdateContentTypeSchema.shape,
    async (params) => {
      try {
        const { contentTypeId, version, ...body } = UpdateContentTypeSchema.parse(params);

        const result = await client.putWithVersion<ContentfulContentType>(
          `content_types/${contentTypeId}`,
          version,
          body,
        );

        return mcpSuccess({
          id: result.sys.id,
          name: result.name,
          version: result.sys.version,
          fieldsCount: result.fields.length,
          message: `Content type '${result.name}' updated (version ${result.sys.version}). Publish to activate changes.`,
        });
      } catch (error) {
        return mcpError(error, "contentful_update_content_type");
      }
    },
  );

  // ─── 5. contentful_delete_content_type ────────────────────────────
  server.tool(
    "contentful_delete_content_type",
    "Permanently delete a content type. The content type must be unpublished (deactivated) and have no entries. Requires the current version.",
    DeleteContentTypeSchema.shape,
    async (params) => {
      try {
        const { contentTypeId, version } = DeleteContentTypeSchema.parse(params);
        await client.deleteWithVersion(`content_types/${contentTypeId}`, version);
        return mcpSuccess({ message: `Content type '${contentTypeId}' deleted` });
      } catch (error) {
        return mcpError(error, "contentful_delete_content_type");
      }
    },
  );

  // ─── 6. contentful_publish_content_type ───────────────────────────
  server.tool(
    "contentful_publish_content_type",
    "Publish (activate) a content type to make it available for creating entries. Requires the current version for optimistic locking.",
    PublishContentTypeSchema.shape,
    async (params) => {
      try {
        const { contentTypeId, version } = PublishContentTypeSchema.parse(params);
        const result = await client.putWithVersion<ContentfulContentType>(
          `content_types/${contentTypeId}/published`,
          version,
        );
        return mcpSuccess({
          id: result.sys.id,
          name: result.name,
          version: result.sys.version,
          message: `Content type '${result.name}' published (activated)`,
        });
      } catch (error) {
        return mcpError(error, "contentful_publish_content_type");
      }
    },
  );

  // ─── 7. contentful_list_entries ───────────────────────────────────
  server.tool(
    "contentful_list_entries",
    "List entries with filtering by content type, full-text search, field selection, and pagination. Use content_type parameter to filter by type.",
    ListEntriesSchema.shape,
    async (params) => {
      try {
        const validated = ListEntriesSchema.parse(params);
        const result = await client.get<ContentfulCollection<ContentfulEntry>>(
          "entries",
          validated as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_entries");
      }
    },
  );

  // ─── 5. contentful_get_entry ──────────────────────────────────────
  server.tool(
    "contentful_get_entry",
    "Get a single entry by ID. Returns all fields with localized values and system metadata including version.",
    GetEntrySchema.shape,
    async (params) => {
      try {
        const { entryId } = GetEntrySchema.parse(params);
        const result = await client.get<ContentfulEntry>(`entries/${entryId}`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_get_entry");
      }
    },
  );

  // ─── 6. contentful_create_entry ───────────────────────────────────
  server.tool(
    "contentful_create_entry",
    "Create a new entry for a content type. Fields must be localized: { fieldId: { 'en-US': value } }. The entry is created as draft.",
    CreateEntrySchema.shape,
    async (params) => {
      try {
        const { contentTypeId, fields, tags } = CreateEntrySchema.parse(params);

        const body: Record<string, unknown> = { fields };
        if (tags) {
          body["metadata"] = { tags };
        }

        // Contentful requires X-Contentful-Content-Type header for entry creation
        const result = await client.post<ContentfulEntry>(
          "entries",
          body,
          { "X-Contentful-Content-Type": contentTypeId },
        );

        return mcpSuccess({
          id: result.sys.id,
          contentType: result.sys.contentType.sys.id,
          version: result.sys.version,
          message: `Entry created (draft, version ${result.sys.version})`,
        });
      } catch (error) {
        return mcpError(error, "contentful_create_entry");
      }
    },
  );

  // ─── 7. contentful_update_entry ───────────────────────────────────
  server.tool(
    "contentful_update_entry",
    "Update an existing entry. Requires the current version number (from sys.version) for optimistic locking. Get it from contentful_get_entry first.",
    UpdateEntrySchema.shape,
    async (params) => {
      try {
        const { entryId, version, fields, tags } = UpdateEntrySchema.parse(params);

        const body: Record<string, unknown> = { fields };
        if (tags) {
          body["metadata"] = { tags };
        }

        const result = await client.putWithVersion<ContentfulEntry>(
          `entries/${entryId}`,
          version,
          body,
        );

        return mcpSuccess({
          id: result.sys.id,
          version: result.sys.version,
          message: `Entry '${entryId}' updated (version ${result.sys.version})`,
        });
      } catch (error) {
        return mcpError(error, "contentful_update_entry");
      }
    },
  );

  // ─── 8. contentful_delete_entry ───────────────────────────────────
  server.tool(
    "contentful_delete_entry",
    "Permanently delete an entry by ID. The entry must be unpublished first. Requires the current version for optimistic locking.",
    DeleteEntrySchema.shape,
    async (params) => {
      try {
        const { entryId, version } = DeleteEntrySchema.parse(params);
        await client.deleteWithVersion(`entries/${entryId}`, version);
        return mcpSuccess({ message: `Entry '${entryId}' deleted` });
      } catch (error) {
        return mcpError(error, "contentful_delete_entry");
      }
    },
  );

  // ─── 9. contentful_publish_entry ──────────────────────────────────
  server.tool(
    "contentful_publish_entry",
    "Publish an entry to make it available via the Content Delivery API. Requires the current version for optimistic locking.",
    PublishEntrySchema.shape,
    async (params) => {
      try {
        const { entryId, version } = PublishEntrySchema.parse(params);
        const result = await client.putWithVersion<ContentfulEntry>(
          `entries/${entryId}/published`,
          version,
        );
        return mcpSuccess({
          id: result.sys.id,
          version: result.sys.version,
          message: `Entry '${entryId}' published`,
        });
      } catch (error) {
        return mcpError(error, "contentful_publish_entry");
      }
    },
  );

  // ─── 10. contentful_unpublish_entry ───────────────────────────────
  server.tool(
    "contentful_unpublish_entry",
    "Unpublish an entry to remove it from the Content Delivery API. The entry remains as a draft. Requires the current version.",
    UnpublishEntrySchema.shape,
    async (params) => {
      try {
        const { entryId, version } = UnpublishEntrySchema.parse(params);
        const result = await client.deleteWithVersion<ContentfulEntry>(
          `entries/${entryId}/published`,
          version,
        );
        return mcpSuccess({
          id: result.sys.id,
          version: result.sys.version,
          message: `Entry '${entryId}' unpublished`,
        });
      } catch (error) {
        return mcpError(error, "contentful_unpublish_entry");
      }
    },
  );
}
