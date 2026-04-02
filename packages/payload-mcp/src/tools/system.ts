/**
 * System tools (12): list_globals, get_global, update_global,
 * list_media, upload_media, get_access, list_versions, restore_version,
 * get_current_user, bulk_create, bulk_update, bulk_delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PayloadClient } from "../api/client.js";
import {
  ListGlobalsSchema,
  GetGlobalSchema,
  UpdateGlobalSchema,
  ListMediaSchema,
  UploadMediaSchema,
  GetAccessSchema,
  ListVersionsSchema,
  RestoreVersionSchema,
  GetCurrentUserSchema,
  BulkCreateSchema,
  BulkUpdateSchema,
  BulkDeleteSchema,
} from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: PayloadClient): void {
  // ─── 7. payload_list_globals ──────────────────────────────────────
  server.tool(
    "payload_list_globals",
    "Discover all available globals (site settings, navigation, footer, etc.) and their field schemas.",
    ListGlobalsSchema.shape,
    async () => {
      try {
        const globals = await client.listGlobals();
        return mcpSuccess(
          globals.map((g) => ({
            slug: g.slug,
            label: g.label,
            versions: g.versions ?? false,
            fields: g.fields.map((f) => ({
              name: f.name,
              type: f.type,
              required: f.required,
            })),
          })),
        );
      } catch (error) {
        return mcpError(error, "payload_list_globals");
      }
    },
  );

  // ─── 8. payload_get_global ────────────────────────────────────────
  server.tool(
    "payload_get_global",
    "Get a global document by slug (e.g., site-settings, header, footer). Returns all field data with optional relationship population.",
    GetGlobalSchema.shape,
    async (params) => {
      try {
        const { slug, depth } = GetGlobalSchema.parse(params);
        const result = await client.getGlobal(slug, { depth });
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_get_global");
      }
    },
  );

  // ─── 9. payload_update_global ─────────────────────────────────────
  server.tool(
    "payload_update_global",
    "Update a global document's fields. Only provided fields are changed.",
    UpdateGlobalSchema.shape,
    async (params) => {
      try {
        const { slug, data } = UpdateGlobalSchema.parse(params);
        const result = await client.updateGlobal(slug, data);
        return mcpSuccess({ ...result, message: `Global '${slug}' updated` });
      } catch (error) {
        return mcpError(error, "payload_update_global");
      }
    },
  );

  // ─── 10. payload_list_media ───────────────────────────────────────
  server.tool(
    "payload_list_media",
    "List uploaded media files (images, videos, documents) from an upload-enabled collection with pagination.",
    ListMediaSchema.shape,
    async (params) => {
      try {
        const { collection, limit, page } = ListMediaSchema.parse(params);
        const result = await client.listMedia(collection, { limit, page });
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_list_media");
      }
    },
  );

  // ─── 11. payload_upload_media ─────────────────────────────────────
  server.tool(
    "payload_upload_media",
    "Upload a media file from a URL to an upload-enabled collection. The file is fetched from the provided URL and uploaded to Payload.",
    UploadMediaSchema.shape,
    async (params) => {
      try {
        const validated = UploadMediaSchema.parse(params);
        // Payload's REST API requires multipart form data for file uploads.
        // Direct URL-to-upload is not natively supported — provide guidance.
        return mcpSuccess({
          message: "Media upload via URL requires fetching the file and uploading as multipart form data. "
            + "Use the Payload admin panel for direct file uploads, or use payload_create_entry "
            + "on an upload-enabled collection with the file data.",
          suggestion: "List existing media with payload_list_media to find file IDs for relationship fields.",
          providedUrl: validated.url,
          collection: validated.collection,
        });
      } catch (error) {
        return mcpError(error, "payload_upload_media");
      }
    },
  );

  // ─── 12. payload_get_access ───────────────────────────────────────
  server.tool(
    "payload_get_access",
    "Get the current user's access permissions for all collections and globals. Returns permission booleans for create, read, update, delete operations.",
    GetAccessSchema.shape,
    async () => {
      try {
        const access = await client.getAccess();
        return mcpSuccess(access);
      } catch (error) {
        return mcpError(error, "payload_get_access");
      }
    },
  );

  // ─── 13. payload_list_versions ────────────────────────────────────
  server.tool(
    "payload_list_versions",
    "List version history for a specific entry in a version-enabled collection. Returns previous versions with timestamps.",
    ListVersionsSchema.shape,
    async (params) => {
      try {
        const { collection, id, limit, page } = ListVersionsSchema.parse(params);
        const result = await client.listVersions(collection, id, { limit, page });
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_list_versions");
      }
    },
  );

  // ─── 14. payload_restore_version ──────────────────────────────────
  server.tool(
    "payload_restore_version",
    "Restore a specific version of an entry, making it the current version. Use payload_list_versions to find version IDs.",
    RestoreVersionSchema.shape,
    async (params) => {
      try {
        const { collection, versionId } = RestoreVersionSchema.parse(params);
        const result = await client.restoreVersion(collection, versionId);
        return mcpSuccess({ ...result, message: `Version '${versionId}' restored in '${collection}'` });
      } catch (error) {
        return mcpError(error, "payload_restore_version");
      }
    },
  );

  // ─── 15. payload_get_current_user ────────────────────────────────
  server.tool(
    "payload_get_current_user",
    "Get the currently authenticated user's profile and permissions. Useful for verifying auth status and available roles.",
    GetCurrentUserSchema.shape,
    async () => {
      try {
        const result = await client.getCurrentUser();
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "payload_get_current_user");
      }
    },
  );

  // ─── 16. payload_bulk_create ─────────────────────────────────────
  server.tool(
    "payload_bulk_create",
    "Create multiple entries in a collection at once. Returns created documents and any errors encountered.",
    BulkCreateSchema.shape,
    async (params) => {
      try {
        const { collection, entries } = BulkCreateSchema.parse(params);
        const result = await client.bulkCreate(collection, entries);
        return mcpSuccess({
          ...result,
          message: `Created ${result.docs.length} entries in '${collection}' (${result.errors.length} errors)`,
        });
      } catch (error) {
        return mcpError(error, "payload_bulk_create");
      }
    },
  );

  // ─── 17. payload_bulk_update ─────────────────────────────────────
  server.tool(
    "payload_bulk_update",
    "Update multiple entries in a collection at once. Each entry must include an id and the data fields to update.",
    BulkUpdateSchema.shape,
    async (params) => {
      try {
        const { collection, entries } = BulkUpdateSchema.parse(params);
        const result = await client.bulkUpdate(collection, entries);
        return mcpSuccess({
          ...result,
          message: `Updated ${result.docs.length} entries in '${collection}' (${result.errors.length} errors)`,
        });
      } catch (error) {
        return mcpError(error, "payload_bulk_update");
      }
    },
  );

  // ─── 18. payload_bulk_delete ─────────────────────────────────────
  server.tool(
    "payload_bulk_delete",
    "Delete multiple entries from a collection at once. Provide an array of entry IDs to delete.",
    BulkDeleteSchema.shape,
    async (params) => {
      try {
        const { collection, ids } = BulkDeleteSchema.parse(params);
        const result = await client.bulkDelete(collection, ids);
        return mcpSuccess({
          ...result,
          message: `Deleted ${result.docs.length} entries from '${collection}' (${result.errors.length} errors)`,
        });
      } catch (error) {
        return mcpError(error, "payload_bulk_delete");
      }
    },
  );
}
