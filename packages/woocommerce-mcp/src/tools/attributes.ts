/**
 * Product Attribute tools (5) + Attribute Term tools (5) = 10 tools
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import {
  ListProductAttributesSchema, GetProductAttributeSchema, CreateProductAttributeSchema,
  UpdateProductAttributeSchema, DeleteProductAttributeSchema,
  ListAttributeTermsSchema, GetAttributeTermSchema, CreateAttributeTermSchema,
  UpdateAttributeTermSchema, DeleteAttributeTermSchema,
} from "../schemas/index.js";

export function registerAttributeTools(server: McpServer, client: WooClient): void {
  // ── Attributes ───────────────────────────────────────────────────
  server.tool("woo_list_product_attributes", "List all product attributes (e.g., Color, Size).", ListProductAttributesSchema.shape, async () => {
    try { return mcpSuccess(await client.get<unknown[]>("products/attributes")); }
    catch (error) { return mcpError(error, "woo_list_product_attributes"); }
  });

  server.tool("woo_get_product_attribute", "Get a product attribute by ID.", GetProductAttributeSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown>(`products/attributes/${GetProductAttributeSchema.parse(params).attribute_id}`)); }
    catch (error) { return mcpError(error, "woo_get_product_attribute"); }
  });

  server.tool("woo_create_product_attribute", "Create a product attribute for variable products (e.g., Color, Size).", CreateProductAttributeSchema.shape, async (params) => {
    try {
      const v = CreateProductAttributeSchema.parse(params);
      const a = await client.post<Record<string, unknown>>("products/attributes", v);
      return mcpSuccess({ id: a["id"], name: a["name"], slug: a["slug"], message: `Attribute '${a["name"]}' created` });
    } catch (error) { return mcpError(error, "woo_create_product_attribute"); }
  });

  server.tool("woo_update_product_attribute", "Update a product attribute's name, slug, or sort order.", UpdateProductAttributeSchema.shape, async (params) => {
    try {
      const { attribute_id, ...data } = UpdateProductAttributeSchema.parse(params);
      const a = await client.put<Record<string, unknown>>(`products/attributes/${attribute_id}`, data);
      return mcpSuccess({ id: a["id"], name: a["name"], message: `Attribute ${attribute_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_product_attribute"); }
  });

  server.tool("woo_delete_product_attribute", "Delete a product attribute and all its terms.", DeleteProductAttributeSchema.shape, async (params) => {
    try {
      await client.delete(`products/attributes/${DeleteProductAttributeSchema.parse(params).attribute_id}`);
      return mcpSuccess({ message: `Attribute deleted` });
    } catch (error) { return mcpError(error, "woo_delete_product_attribute"); }
  });

  // ── Attribute Terms ──────────────────────────────────────────────
  server.tool("woo_list_attribute_terms", "List terms for a product attribute (e.g., Red, Blue, Green for Color).", ListAttributeTermsSchema.shape, async (params) => {
    try {
      const { attribute_id, page, per_page } = ListAttributeTermsSchema.parse(params);
      return mcpSuccess(await client.list<unknown>(`products/attributes/${attribute_id}/terms`, {}, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_attribute_terms"); }
  });

  server.tool("woo_get_attribute_term", "Get a specific attribute term.", GetAttributeTermSchema.shape, async (params) => {
    try {
      const { attribute_id, term_id } = GetAttributeTermSchema.parse(params);
      return mcpSuccess(await client.get<unknown>(`products/attributes/${attribute_id}/terms/${term_id}`));
    } catch (error) { return mcpError(error, "woo_get_attribute_term"); }
  });

  server.tool("woo_create_attribute_term", "Create an attribute term (e.g., add 'Red' to Color attribute).", CreateAttributeTermSchema.shape, async (params) => {
    try {
      const { attribute_id, ...data } = CreateAttributeTermSchema.parse(params);
      const t = await client.post<Record<string, unknown>>(`products/attributes/${attribute_id}/terms`, data);
      return mcpSuccess({ id: t["id"], name: t["name"], slug: t["slug"], message: `Term '${t["name"]}' created` });
    } catch (error) { return mcpError(error, "woo_create_attribute_term"); }
  });

  server.tool("woo_update_attribute_term", "Update an attribute term's name, slug, or order.", UpdateAttributeTermSchema.shape, async (params) => {
    try {
      const { attribute_id, term_id, ...data } = UpdateAttributeTermSchema.parse(params);
      const t = await client.put<Record<string, unknown>>(`products/attributes/${attribute_id}/terms/${term_id}`, data);
      return mcpSuccess({ id: t["id"], name: t["name"], message: `Term ${term_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_attribute_term"); }
  });

  server.tool("woo_delete_attribute_term", "Delete an attribute term.", DeleteAttributeTermSchema.shape, async (params) => {
    try {
      const { attribute_id, term_id } = DeleteAttributeTermSchema.parse(params);
      await client.delete(`products/attributes/${attribute_id}/terms/${term_id}`, { force: true });
      return mcpSuccess({ message: `Term ${term_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_attribute_term"); }
  });
}
