/**
 * System tools (8): list_components, list_media, upload_media, delete_media,
 * list_users, list_roles, get_locales, create_localized_entry
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { StrapiClient } from "../api/client.js";
import {
  ListComponentsSchema,
  ListMediaSchema,
  UploadMediaSchema,
  DeleteMediaSchema,
  ListUsersSchema,
  ListRolesSchema,
  GetLocalesSchema,
  CreateLocalizedEntrySchema,
} from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: StrapiClient): void {
  // ─── 10. strapi_list_components ──────────────────────────────────
  server.tool(
    "strapi_list_components",
    "List all reusable component schemas. Components are building blocks that can be used across multiple content types.",
    ListComponentsSchema.shape,
    async () => {
      try {
        const components = await client.getComponents();
        return mcpSuccess(
          components.map((c) => ({
            uid: c.uid,
            category: c.category,
            displayName: c.schema.displayName,
            attributes: c.schema.attributes,
          })),
        );
      } catch (error) {
        return mcpError(error, "strapi_list_components");
      }
    },
  );

  // ─── 11. strapi_list_media ───────────────────────────────────────
  server.tool(
    "strapi_list_media",
    "List uploaded media files (images, videos, documents) with pagination.",
    ListMediaSchema.shape,
    async (params) => {
      try {
        const { page, pageSize } = ListMediaSchema.parse(params);
        const files = await client.listMedia({
          pagination: { page, pageSize },
        });
        return mcpSuccess(files);
      } catch (error) {
        return mcpError(error, "strapi_list_media");
      }
    },
  );

  // ─── 12. strapi_upload_media ─────────────────────────────────────
  server.tool(
    "strapi_upload_media",
    "Upload a media file from a URL to Strapi's media library. The file is fetched from the URL and uploaded via multipart form data. Returns the uploaded file metadata including its ID for use in content entries.",
    UploadMediaSchema.shape,
    async (params) => {
      try {
        const validated = UploadMediaSchema.parse(params);
        const uploaded = await client.uploadFile(validated.url, {
          name: validated.name,
          caption: validated.caption,
          alternativeText: validated.alternativeText,
        });
        return mcpSuccess({
          ...uploaded,
          message: `File uploaded successfully (ID: ${uploaded.id}, name: ${uploaded.name})`,
        });
      } catch (error) {
        return mcpError(error, "strapi_upload_media");
      }
    },
  );

  // ─── 13. strapi_delete_media ─────────────────────────────────────
  server.tool(
    "strapi_delete_media",
    "Delete a media file from the Strapi media library by ID.",
    DeleteMediaSchema.shape,
    async (params) => {
      try {
        const { id } = DeleteMediaSchema.parse(params);
        const deleted = await client.deleteMedia(id);
        return mcpSuccess({ deleted, message: `Media file ${id} deleted` });
      } catch (error) {
        return mcpError(error, "strapi_delete_media");
      }
    },
  );

  // ─── 14. strapi_list_users ───────────────────────────────────────
  server.tool(
    "strapi_list_users",
    "List admin and content manager users registered in Strapi.",
    ListUsersSchema.shape,
    async () => {
      try {
        const users = await client.listUsers();
        return mcpSuccess(users);
      } catch (error) {
        return mcpError(error, "strapi_list_users");
      }
    },
  );

  // ─── 15. strapi_list_roles ───────────────────────────────────────
  server.tool(
    "strapi_list_roles",
    "List all user roles and their permissions.",
    ListRolesSchema.shape,
    async () => {
      try {
        const roles = await client.listRoles();
        return mcpSuccess(roles);
      } catch (error) {
        return mcpError(error, "strapi_list_roles");
      }
    },
  );

  // ─── 16. strapi_get_locales ──────────────────────────────────────
  server.tool(
    "strapi_get_locales",
    "List all configured locales for i18n content. Returns locale codes, names, and which is the default.",
    GetLocalesSchema.shape,
    async () => {
      try {
        const locales = await client.getLocales();
        return mcpSuccess(locales);
      } catch (error) {
        return mcpError(error, "strapi_get_locales");
      }
    },
  );

  // ─── 17. strapi_create_localized_entry ───────────────────────────
  server.tool(
    "strapi_create_localized_entry",
    "Create a localized version of an existing entry. The source entry must already exist. Provide the target locale code and the translated field data.",
    CreateLocalizedEntrySchema.shape,
    async (params) => {
      try {
        const { contentType, id, locale, data } = CreateLocalizedEntrySchema.parse(params);
        const result = await client.createLocalization(contentType, id, locale, data);
        return mcpSuccess({
          ...result,
          message: `Localized entry created for '${contentType}' ID ${id} in locale '${locale}'`,
        });
      } catch (error) {
        return mcpError(error, "strapi_create_localized_entry");
      }
    },
  );
}
