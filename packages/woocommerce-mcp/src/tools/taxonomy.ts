/**
 * Category & Tag tools (10): full CRUD for categories and tags
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooCategory, WooTag } from "../types/index.js";
import {
  ListCategoriesSchema, GetCategorySchema, CreateCategorySchema, UpdateCategorySchema, DeleteCategorySchema,
  ListTagsSchema, GetTagSchema, CreateTagSchema, UpdateTagSchema, DeleteTagSchema,
} from "../schemas/index.js";

export function registerTaxonomyTools(server: McpServer, client: WooClient): void {
  // ── Categories ───────────────────────────────────────────────────
  server.tool("woo_list_categories", "List product categories with search, parent filter, sorting.", ListCategoriesSchema.shape, async (params) => {
    try {
      const { page, per_page, ...f } = ListCategoriesSchema.parse(params);
      const cats = await client.list<WooCategory>("products/categories", f as Record<string, string | number | boolean | undefined>, page, per_page);
      return mcpSuccess({ categories: cats.map((c) => ({ id: c.id, name: c.name, slug: c.slug, parent: c.parent, count: c.count })), page, per_page });
    } catch (error) { return mcpError(error, "woo_list_categories"); }
  });

  server.tool("woo_get_category", "Get a product category by ID.", GetCategorySchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<WooCategory>(`products/categories/${GetCategorySchema.parse(params).category_id}`)); }
    catch (error) { return mcpError(error, "woo_get_category"); }
  });

  server.tool("woo_create_category", "Create a new product category. Supports nesting via parent.", CreateCategorySchema.shape, async (params) => {
    try {
      const v = CreateCategorySchema.parse(params);
      const c = await client.post<WooCategory>("products/categories", v);
      return mcpSuccess({ id: c.id, name: c.name, slug: c.slug, message: `Category '${c.name}' created` });
    } catch (error) { return mcpError(error, "woo_create_category"); }
  });

  server.tool("woo_update_category", "Update a product category's name, slug, parent, or image.", UpdateCategorySchema.shape, async (params) => {
    try {
      const { category_id, ...data } = UpdateCategorySchema.parse(params);
      const c = await client.put<WooCategory>(`products/categories/${category_id}`, data);
      return mcpSuccess({ id: c.id, name: c.name, message: `Category ${category_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_category"); }
  });

  server.tool("woo_delete_category", "Delete a product category.", DeleteCategorySchema.shape, async (params) => {
    try {
      const { category_id, force } = DeleteCategorySchema.parse(params);
      await client.delete(`products/categories/${category_id}`, { force });
      return mcpSuccess({ message: `Category ${category_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_category"); }
  });

  // ── Tags ─────────────────────────────────────────────────────────
  server.tool("woo_list_tags", "List product tags with optional search and sorting.", ListTagsSchema.shape, async (params) => {
    try {
      const { page, per_page, ...f } = ListTagsSchema.parse(params);
      const tags = await client.list<WooTag>("products/tags", f as Record<string, string | number | boolean | undefined>, page, per_page);
      return mcpSuccess({ tags: tags.map((t) => ({ id: t.id, name: t.name, slug: t.slug, count: t.count })), page, per_page });
    } catch (error) { return mcpError(error, "woo_list_tags"); }
  });

  server.tool("woo_get_tag", "Get a product tag by ID.", GetTagSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<WooTag>(`products/tags/${GetTagSchema.parse(params).tag_id}`)); }
    catch (error) { return mcpError(error, "woo_get_tag"); }
  });

  server.tool("woo_create_tag", "Create a new product tag.", CreateTagSchema.shape, async (params) => {
    try {
      const v = CreateTagSchema.parse(params);
      const t = await client.post<WooTag>("products/tags", v);
      return mcpSuccess({ id: t.id, name: t.name, slug: t.slug, message: `Tag '${t.name}' created` });
    } catch (error) { return mcpError(error, "woo_create_tag"); }
  });

  server.tool("woo_update_tag", "Update a product tag's name, slug, or description.", UpdateTagSchema.shape, async (params) => {
    try {
      const { tag_id, ...data } = UpdateTagSchema.parse(params);
      const t = await client.put<WooTag>(`products/tags/${tag_id}`, data);
      return mcpSuccess({ id: t.id, name: t.name, message: `Tag ${tag_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_tag"); }
  });

  server.tool("woo_delete_tag", "Delete a product tag.", DeleteTagSchema.shape, async (params) => {
    try {
      const { tag_id, force } = DeleteTagSchema.parse(params);
      await client.delete(`products/tags/${tag_id}`, { force });
      return mcpSuccess({ message: `Tag ${tag_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_tag"); }
  });
}
