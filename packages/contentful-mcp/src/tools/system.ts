/**
 * System tools (7): spaces, environments, locales, tags, assets, bulk publish
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { ContentfulClient } from "../api/client.js";
import type {
  ContentfulSpace,
  ContentfulEnvironment,
  ContentfulLocale,
  ContentfulTag,
  ContentfulAsset,
  ContentfulCollection,
  ContentfulBulkAction,
} from "../types/index.js";
import {
  ListSpacesSchema,
  ListEnvironmentsSchema,
  ListLocalesSchema,
  ListTagsSchema,
  ListAssetsSchema,
  UploadAssetSchema,
  BulkPublishSchema,
} from "../schemas/index.js";

export function registerSystemTools(server: McpServer, client: ContentfulClient): void {
  // ─── 11. contentful_list_spaces ───────────────────────────────────
  server.tool(
    "contentful_list_spaces",
    "Get the current Contentful space details including name, default locale, and system metadata.",
    ListSpacesSchema.shape,
    async () => {
      try {
        // CMA: GET /spaces/{spaceId} returns the current space
        const result = await client.getSpace<ContentfulSpace>("");
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_spaces");
      }
    },
  );

  // ─── 12. contentful_list_environments ─────────────────────────────
  server.tool(
    "contentful_list_environments",
    "List all environments in the Contentful space. Environments are isolated copies of content (e.g., master, staging, dev).",
    ListEnvironmentsSchema.shape,
    async () => {
      try {
        const result = await client.getSpace<ContentfulCollection<ContentfulEnvironment>>(
          "environments",
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_environments");
      }
    },
  );

  // ─── 13. contentful_list_locales ──────────────────────────────────
  server.tool(
    "contentful_list_locales",
    "List all locales configured in the environment. Shows locale codes, names, defaults, and fallback chains.",
    ListLocalesSchema.shape,
    async () => {
      try {
        const result = await client.get<ContentfulCollection<ContentfulLocale>>("locales");
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_locales");
      }
    },
  );

  // ─── 14. contentful_list_tags ─────────────────────────────────────
  server.tool(
    "contentful_list_tags",
    "List all content tags in the environment. Tags can be attached to entries and assets for categorization.",
    ListTagsSchema.shape,
    async (params) => {
      try {
        const validated = ListTagsSchema.parse(params);
        const result = await client.get<ContentfulCollection<ContentfulTag>>(
          "tags",
          validated as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_tags");
      }
    },
  );

  // ─── 15. contentful_list_assets ───────────────────────────────────
  server.tool(
    "contentful_list_assets",
    "List assets (images, videos, documents) with filtering by MIME type group, search, and pagination.",
    ListAssetsSchema.shape,
    async (params) => {
      try {
        const validated = ListAssetsSchema.parse(params);
        const result = await client.get<ContentfulCollection<ContentfulAsset>>(
          "assets",
          validated as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "contentful_list_assets");
      }
    },
  );

  // ─── 16. contentful_upload_asset ──────────────────────────────────
  server.tool(
    "contentful_upload_asset",
    "Create and process an asset from a public URL. The asset is created as draft. Publish it separately after processing completes.",
    UploadAssetSchema.shape,
    async (params) => {
      try {
        const validated = UploadAssetSchema.parse(params);

        // Step 1: Create the asset with an external URL reference
        const assetBody = {
          fields: {
            title: { [validated.locale]: validated.title },
            description: validated.description
              ? { [validated.locale]: validated.description }
              : undefined,
            file: {
              [validated.locale]: {
                contentType: validated.contentType,
                fileName: validated.fileName,
                upload: validated.uploadUrl,
              },
            },
          },
        };

        const created = await client.post<ContentfulAsset>("assets", assetBody);

        // Step 2: Process the asset (downloads from URL and creates derivatives)
        await client.putWithVersion<undefined>(
          `assets/${created.sys.id}/files/${validated.locale}/process`,
          created.sys.version,
        );

        return mcpSuccess({
          id: created.sys.id,
          version: created.sys.version,
          title: validated.title,
          fileName: validated.fileName,
          message: `Asset '${validated.title}' created and processing started. Check back and publish once processing completes.`,
        });
      } catch (error) {
        return mcpError(error, "contentful_upload_asset");
      }
    },
  );

  // ─── 17. contentful_bulk_publish ──────────────────────────────────
  server.tool(
    "contentful_bulk_publish",
    "Publish multiple entries and/or assets in a single bulk action (max 200). Each entity requires its current version number.",
    BulkPublishSchema.shape,
    async (params) => {
      try {
        const validated = BulkPublishSchema.parse(params);

        const result = await client.post<ContentfulBulkAction>(
          "bulk_actions/publish",
          { entities: { items: validated.entities } },
        );

        return mcpSuccess({
          id: result.sys.id,
          status: result.sys.status,
          entityCount: validated.entities.length,
          message: `Bulk publish started for ${validated.entities.length} entities (action: ${result.sys.id})`,
        });
      } catch (error) {
        return mcpError(error, "contentful_bulk_publish");
      }
    },
  );
}
