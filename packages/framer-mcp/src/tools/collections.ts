/**
 * CMS Collection tools: list_collections, get_collection, create_collection,
 * create_collection_field, create_collection_item, update_collection_item, delete_collection_item
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { FramerClient } from "../api/client.js";
import type { SerializedCollection, SerializedField, SerializedCollectionItem } from "../types/index.js";
import {
  ListCollectionsSchema,
  GetCollectionSchema,
  CreateCollectionSchema,
  CreateCollectionFieldSchema,
  CreateCollectionItemSchema,
  UpdateCollectionItemSchema,
  DeleteCollectionItemSchema,
} from "../schemas/index.js";

export function registerCollectionTools(server: McpServer, client: FramerClient): void {
  // ─── 2. framer_list_collections ──────────────────────────────────
  server.tool(
    "framer_list_collections",
    "List all CMS collections in the Framer project. Returns collection IDs, names, slug field info, and management status.",
    ListCollectionsSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const collections = await framer.getCollections();
        const result: SerializedCollection[] = collections.map((c) => ({
          id: c.id,
          name: c.name,
          slugFieldName: c.slugFieldName ?? null,
          managedBy: c.managedBy,
        }));
        return mcpSuccess(result);
      } catch (error) {
        return mcpError(error, "framer_list_collections");
      }
    },
  );

  // ─── 3. framer_get_collection ────────────────────────────────────
  server.tool(
    "framer_get_collection",
    "Get a specific CMS collection with its fields and items. Returns the full collection schema (field definitions) and all items with their data.",
    GetCollectionSchema.shape,
    async (params) => {
      try {
        const { collectionId } = GetCollectionSchema.parse(params);
        const framer = await client.getConnection();

        const collectionData = await framer.getCollection(collectionId);
        if (!collectionData) {
          return mcpError(
            new Error(`Collection '${collectionId}' not found`),
            "framer_get_collection",
          );
        }

        const [fields, items] = await Promise.all([
          collectionData.getFields(),
          collectionData.getItems(),
        ]);

        const serializedFields: SerializedField[] = fields.map((f) => ({
          id: f.id,
          name: f.name,
          type: f.type,
        }));

        const serializedItems: SerializedCollectionItem[] = items.map((item) => ({
          id: item.id,
          slug: item.slug,
          draft: item.draft,
          fieldData: item.fieldData as Record<string, unknown>,
        }));

        return mcpSuccess({
          collection: {
            id: collectionData.id,
            name: collectionData.name,
            slugFieldName: collectionData.slugFieldName ?? null,
            managedBy: collectionData.managedBy,
          },
          fields: serializedFields,
          items: serializedItems,
          itemCount: serializedItems.length,
        });
      } catch (error) {
        return mcpError(error, "framer_get_collection");
      }
    },
  );

  // ─── 4. framer_create_collection ─────────────────────────────────
  server.tool(
    "framer_create_collection",
    "Create a new CMS collection in the Framer project. Returns the new collection ID and details.",
    CreateCollectionSchema.shape,
    async (params) => {
      try {
        const { name } = CreateCollectionSchema.parse(params);
        const framer = await client.getConnection();
        const collection = await framer.createCollection(name);
        return mcpSuccess({
          id: collection.id,
          name: collection.name,
          message: `Collection '${name}' created successfully`,
        });
      } catch (error) {
        return mcpError(error, "framer_create_collection");
      }
    },
  );

  // ─── 8. framer_create_collection_field ───────────────────────────
  server.tool(
    "framer_create_collection_field",
    "Add a new field to a CMS collection's schema. Supports types: boolean, color, number, string, formattedText, image, link, date, file, enum. For enum fields, provide enumCases array.",
    CreateCollectionFieldSchema.shape,
    async (params) => {
      try {
        const validated = CreateCollectionFieldSchema.parse(params);
        const framer = await client.getConnection();

        const fieldInput: Record<string, unknown> = {
          type: validated.type,
          name: validated.name,
        };

        if (validated.type === "enum" && validated.enumCases) {
          fieldInput["cases"] = validated.enumCases;
        }

        const collection = await framer.getCollection(validated.collectionId);
        if (!collection) {
          return mcpError(new Error(`Collection '${validated.collectionId}' not found`), "framer_create_collection_field");
        }
        const createdFields = await collection.addFields([fieldInput as never]);
        const created = createdFields[0];
        return mcpSuccess({
          field: created ? { id: created.id, name: created.name, type: created.type } : null,
          message: `Field '${validated.name}' added to collection`,
        });
      } catch (error) {
        return mcpError(error, "framer_create_collection_field");
      }
    },
  );

  // ─── 5. framer_create_collection_item ────────────────────────────
  server.tool(
    "framer_create_collection_item",
    "Add a new item to a CMS collection. Provide field data as an object keyed by field ID, where each value is { type: '<fieldType>', value: <value> }. Use framer_get_collection first to get field IDs.",
    CreateCollectionItemSchema.shape,
    async (params) => {
      try {
        const validated = CreateCollectionItemSchema.parse(params);
        const framer = await client.getConnection();

        const collection = await framer.getCollection(validated.collectionId);
        if (!collection) {
          return mcpError(new Error(`Collection '${validated.collectionId}' not found`), "framer_create_collection_item");
        }
        await collection.addItems([{
          slug: validated.slug,
          draft: validated.draft,
          fieldData: validated.fieldData,
        } as never]);
        const allItems = await collection.getItems();
        const created = allItems.find(i => i.slug === validated.slug);
        return mcpSuccess({
          item: created
            ? {
                id: created.id,
                slug: created.slug,
                draft: created.draft,
              }
            : null,
          message: `Item '${validated.slug}' added to collection`,
        });
      } catch (error) {
        return mcpError(error, "framer_create_collection_item");
      }
    },
  );

  // ─── 6. framer_update_collection_item ────────────────────────────
  server.tool(
    "framer_update_collection_item",
    "Update an existing CMS collection item. Can update slug, draft status, and field data. Use framer_get_collection to get the current item and field IDs.",
    UpdateCollectionItemSchema.shape,
    async (params) => {
      try {
        const validated = UpdateCollectionItemSchema.parse(params);
        const framer = await client.getConnection();

        const attributes: Record<string, unknown> = {};
        if (validated.slug !== undefined) attributes["slug"] = validated.slug;
        if (validated.draft !== undefined) attributes["draft"] = validated.draft;
        if (validated.fieldData !== undefined) attributes["fieldData"] = validated.fieldData;

        const collection = await framer.getCollection(validated.collectionId);
        if (!collection) {
          return mcpError(new Error(`Collection '${validated.collectionId}' not found`), "framer_update_collection_item");
        }
        const allItems = await collection.getItems();
        const targetItem = allItems.find(i => i.id === validated.itemId);
        if (!targetItem) {
          return mcpError(new Error(`Item '${validated.itemId}' not found`), "framer_update_collection_item");
        }
        const updated = await targetItem.setAttributes(attributes as never);

        return mcpSuccess({
          item: updated
            ? {
                id: updated.id,
                slug: updated.slug,
                draft: updated.draft,
              }
            : null,
          message: updated ? "Item updated successfully" : "Item not found or was deleted",
        });
      } catch (error) {
        return mcpError(error, "framer_update_collection_item");
      }
    },
  );

  // ─── 7. framer_delete_collection_item ────────────────────────────
  server.tool(
    "framer_delete_collection_item",
    "Remove one or more items from a CMS collection by their IDs.",
    DeleteCollectionItemSchema.shape,
    async (params) => {
      try {
        const { itemIds } = DeleteCollectionItemSchema.parse(params);
        const framer = await client.getConnection();
        const api = framer as unknown as { removeCollectionItems(ids: string[]): Promise<void> };
        await api.removeCollectionItems(itemIds);
        return mcpSuccess({
          deleted: itemIds,
          message: `Deleted ${itemIds.length} item(s)`,
        });
      } catch (error) {
        return mcpError(error, "framer_delete_collection_item");
      }
    },
  );
}
