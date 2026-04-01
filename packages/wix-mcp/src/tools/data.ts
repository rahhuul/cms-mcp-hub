import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WixClient } from "../api/client.js";
import {
  ListDataCollectionsSchema,
  GetDataCollectionSchema,
  QueryDataItemsSchema,
  GetDataItemSchema,
  InsertDataItemSchema,
  UpdateDataItemSchema,
  RemoveDataItemSchema,
  BulkInsertDataItemsSchema,
} from "../schemas/index.js";

export function registerDataTools(server: McpServer, client: WixClient): void {
  // ═══ Data Collections ═══════════════════════════════════════════════

  server.tool(
    "wix_list_data_collections",
    "List all Wix data collections (databases). Returns collection IDs, display names, field schemas, and item counts.",
    ListDataCollectionsSchema.shape,
    async (p) => {
      try {
        const v = ListDataCollectionsSchema.parse(p);
        return mcpSuccess(
          await client.post("/wix-data/v2/collections/query", {
            query: { paging: { limit: v.limit, offset: v.offset } },
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_list_data_collections");
      }
    },
  );

  server.tool(
    "wix_get_data_collection",
    "Get a specific Wix data collection by ID. Returns field definitions, permissions, and configuration.",
    GetDataCollectionSchema.shape,
    async (p) => {
      try {
        const v = GetDataCollectionSchema.parse(p);
        return mcpSuccess(
          await client.get(`/wix-data/v2/collections/${v.collectionId}`),
        );
      } catch (e) {
        return mcpError(e, "wix_get_data_collection");
      }
    },
  );

  // ═══ Data Items ═════════════════════════════════════════════════════

  server.tool(
    "wix_query_data_items",
    "Query data items from a Wix collection using WQL (Wix Query Language). Supports filtering with operators like $eq, $ne, $gt, $lt, $contains, sorting, and pagination.",
    QueryDataItemsSchema.shape,
    async (p) => {
      try {
        const v = QueryDataItemsSchema.parse(p);
        const query: Record<string, unknown> = {
          paging: { limit: v.limit, offset: v.offset },
        };
        if (v.filter) query.filter = v.filter;
        if (v.sort) query.sort = v.sort;
        if (v.fields) query.fields = v.fields;

        return mcpSuccess(
          await client.post("/wix-data/v2/items/query", {
            dataCollectionId: v.collectionId,
            query,
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_query_data_items");
      }
    },
  );

  server.tool(
    "wix_get_data_item",
    "Get a single data item by ID from a Wix collection.",
    GetDataItemSchema.shape,
    async (p) => {
      try {
        const v = GetDataItemSchema.parse(p);
        return mcpSuccess(
          await client.get(
            `/wix-data/v2/collections/${v.collectionId}/items/${v.itemId}`,
          ),
        );
      } catch (e) {
        return mcpError(e, "wix_get_data_item");
      }
    },
  );

  server.tool(
    "wix_insert_data_item",
    "Insert a new data item into a Wix collection. Provide field values as key-value pairs.",
    InsertDataItemSchema.shape,
    async (p) => {
      try {
        const v = InsertDataItemSchema.parse(p);
        return mcpSuccess(
          await client.post("/wix-data/v2/items", {
            dataCollectionId: v.collectionId,
            dataItem: { data: v.item },
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_insert_data_item");
      }
    },
  );

  server.tool(
    "wix_update_data_item",
    "Update an existing data item in a Wix collection. Provide updated field values.",
    UpdateDataItemSchema.shape,
    async (p) => {
      try {
        const v = UpdateDataItemSchema.parse(p);
        return mcpSuccess(
          await client.patch(
            `/wix-data/v2/collections/${v.collectionId}/items/${v.itemId}`,
            { dataItem: { data: v.item } },
          ),
        );
      } catch (e) {
        return mcpError(e, "wix_update_data_item");
      }
    },
  );

  server.tool(
    "wix_remove_data_item",
    "Remove a data item from a Wix collection by ID.",
    RemoveDataItemSchema.shape,
    async (p) => {
      try {
        const v = RemoveDataItemSchema.parse(p);
        await client.del(
          `/wix-data/v2/collections/${v.collectionId}/items/${v.itemId}`,
        );
        return mcpSuccess({ message: "Data item removed" });
      } catch (e) {
        return mcpError(e, "wix_remove_data_item");
      }
    },
  );

  server.tool(
    "wix_bulk_insert_data_items",
    "Insert multiple data items into a Wix collection at once (max 50 items per request).",
    BulkInsertDataItemsSchema.shape,
    async (p) => {
      try {
        const v = BulkInsertDataItemsSchema.parse(p);
        return mcpSuccess(
          await client.post("/wix-data/v2/bulk/items/insert", {
            dataCollectionId: v.collectionId,
            dataItems: v.items.map((item) => ({ data: item })),
          }),
        );
      } catch (e) {
        return mcpError(e, "wix_bulk_insert_data_items");
      }
    },
  );
}
