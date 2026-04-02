/**
 * Site, collection, and collection item tools (10):
 * - Sites: list, get (2)
 * - Collections: list, get (2)
 * - Items: list, get, create, update, delete, publish (6)
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WebflowClient } from "../api/client.js";
import type { WebflowSite, WebflowCollection, WebflowCollectionField, WebflowItem } from "../types/index.js";
import {
  ListSitesSchema,
  GetSiteSchema,
  ListCollectionsSchema,
  GetCollectionSchema,
  ListCollectionFieldsSchema,
  ListItemsSchema,
  GetItemSchema,
  CreateItemSchema,
  UpdateItemSchema,
  DeleteItemSchema,
  PublishItemsSchema,
} from "../schemas/index.js";

export function registerSiteTools(server: McpServer, client: WebflowClient): void {
  // ─── 1. webflow_list_sites ──────────────────────────────────────
  server.tool(
    "webflow_list_sites",
    "List all Webflow sites accessible with the current API token. Returns site IDs, names, preview URLs, and last published dates.",
    ListSitesSchema.shape,
    async () => {
      try {
        const result = await client.get<{ sites: WebflowSite[] }>("sites");
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_sites");
      }
    },
  );

  // ─── 2. webflow_get_site ────────────────────────────────────────
  server.tool(
    "webflow_get_site",
    "Get detailed information about a specific Webflow site by ID, including timezone, locales, and publish status.",
    GetSiteSchema.shape,
    async (params) => {
      try {
        const { siteId } = GetSiteSchema.parse(params);
        const result = await client.get<WebflowSite>(`sites/${siteId}`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_get_site");
      }
    },
  );

  // ─── 3. webflow_list_collections ────────────────────────────────
  server.tool(
    "webflow_list_collections",
    "List all CMS collections for a Webflow site. Returns collection IDs, names, slugs, and field schemas.",
    ListCollectionsSchema.shape,
    async (params) => {
      try {
        const { siteId } = ListCollectionsSchema.parse(params);
        const result = await client.get<{ collections: WebflowCollection[] }>(`sites/${siteId}/collections`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_collections");
      }
    },
  );

  // ─── 4. webflow_get_collection ──────────────────────────────────
  server.tool(
    "webflow_get_collection",
    "Get detailed information about a specific Webflow CMS collection, including its full field schema.",
    GetCollectionSchema.shape,
    async (params) => {
      try {
        const { collectionId } = GetCollectionSchema.parse(params);
        const result = await client.get<WebflowCollection>(`collections/${collectionId}`);
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_get_collection");
      }
    },
  );

  // ─── 4b. webflow_list_collection_fields ──────────────────────────
  server.tool(
    "webflow_list_collection_fields",
    "List all fields defined on a Webflow CMS collection. Returns field IDs, display names, slugs, types, and required/editable flags.",
    ListCollectionFieldsSchema.shape,
    async (params) => {
      try {
        const { collectionId } = ListCollectionFieldsSchema.parse(params);
        const result = await client.get<{ fields: WebflowCollectionField[] }>(
          `collections/${collectionId}/fields`,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_collection_fields");
      }
    },
  );

  // ─── 5. webflow_list_items ──────────────────────────────────────
  server.tool(
    "webflow_list_items",
    "List items in a Webflow CMS collection with pagination and optional sorting. Returns item field data, draft/archive status.",
    ListItemsSchema.shape,
    async (params) => {
      try {
        const { collectionId, ...queryParams } = ListItemsSchema.parse(params);
        const result = await client.list<{ items: WebflowItem[]; pagination: unknown }>(
          `collections/${collectionId}/items`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_list_items");
      }
    },
  );

  // ─── 6. webflow_get_item ────────────────────────────────────────
  server.tool(
    "webflow_get_item",
    "Get a single CMS collection item by ID. Returns all field data, draft/archive status, and timestamps.",
    GetItemSchema.shape,
    async (params) => {
      try {
        const { collectionId, itemId, ...queryParams } = GetItemSchema.parse(params);
        const result = await client.get<WebflowItem>(
          `collections/${collectionId}/items/${itemId}`,
          queryParams as Record<string, string | number | boolean | undefined>,
        );
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "webflow_get_item");
      }
    },
  );

  // ─── 7. webflow_create_item ─────────────────────────────────────
  server.tool(
    "webflow_create_item",
    "Create a new item in a Webflow CMS collection. Field data must match the collection schema — use webflow_get_collection first to see available fields.",
    CreateItemSchema.shape,
    async (params) => {
      try {
        const { collectionId, ...body } = CreateItemSchema.parse(params);
        const result = await client.post<WebflowItem>(`collections/${collectionId}/items`, body);
        return mcpSuccess({
          id: result.id,
          isDraft: result.isDraft,
          isArchived: result.isArchived,
          fieldData: result.fieldData,
          message: `Item created in collection ${collectionId}`,
        });
      } catch (error) {
        return mcpError(error, "webflow_create_item");
      }
    },
  );

  // ─── 8. webflow_update_item ─────────────────────────────────────
  server.tool(
    "webflow_update_item",
    "Update an existing CMS collection item. Only provided fields are updated — omitted fields remain unchanged.",
    UpdateItemSchema.shape,
    async (params) => {
      try {
        const { collectionId, itemId, ...body } = UpdateItemSchema.parse(params);
        const result = await client.patch<WebflowItem>(
          `collections/${collectionId}/items/${itemId}`,
          body,
        );
        return mcpSuccess({
          id: result.id,
          isDraft: result.isDraft,
          isArchived: result.isArchived,
          fieldData: result.fieldData,
          message: `Item ${itemId} updated`,
        });
      } catch (error) {
        return mcpError(error, "webflow_update_item");
      }
    },
  );

  // ─── 9. webflow_delete_item ─────────────────────────────────────
  server.tool(
    "webflow_delete_item",
    "Permanently delete a CMS collection item by ID.",
    DeleteItemSchema.shape,
    async (params) => {
      try {
        const { collectionId, itemId, cmsLocaleId } = DeleteItemSchema.parse(params);
        await client.del(
          `collections/${collectionId}/items/${itemId}`,
          cmsLocaleId ? { cmsLocaleId } : undefined,
        );
        return mcpSuccess({ message: `Item ${itemId} deleted from collection ${collectionId}` });
      } catch (error) {
        return mcpError(error, "webflow_delete_item");
      }
    },
  );

  // ─── 10. webflow_publish_items ──────────────────────────────────
  server.tool(
    "webflow_publish_items",
    "Publish one or more CMS collection items to make them live. Items must not be in draft state. Max 100 items per call.",
    PublishItemsSchema.shape,
    async (params) => {
      try {
        const { collectionId, itemIds } = PublishItemsSchema.parse(params);
        const result = await client.post<{ publishedItemIds?: string[] }>(
          `collections/${collectionId}/items/publish`,
          { itemIds },
        );
        return mcpSuccess({
          publishedCount: itemIds.length,
          publishedItemIds: result.publishedItemIds ?? itemIds,
          message: `${itemIds.length} item(s) published in collection ${collectionId}`,
        });
      } catch (error) {
        return mcpError(error, "webflow_publish_items");
      }
    },
  );
}
