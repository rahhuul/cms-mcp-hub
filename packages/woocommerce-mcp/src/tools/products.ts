/**
 * Product tools (7): list, get, create, update, delete, list_variations, create_variation
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import type { WooProduct } from "../types/index.js";
import {
  ListProductsSchema,
  GetProductSchema,
  CreateProductSchema,
  UpdateProductSchema,
  DeleteProductSchema,
  ListProductVariationsSchema,
  GetProductVariationSchema,
  CreateProductVariationSchema,
  UpdateProductVariationSchema,
  DeleteProductVariationSchema,
} from "../schemas/index.js";

export function registerProductTools(server: McpServer, client: WooClient): void {
  // ─── 1. woo_list_products ────────────────────────────────────────
  server.tool(
    "woo_list_products",
    "List WooCommerce products with filtering and pagination. Supports search, status, category, tag, SKU filters, and sorting.",
    ListProductsSchema.shape,
    async (params) => {
      try {
        const { page, per_page, ...filters } = ListProductsSchema.parse(params);
        const products = await client.list<WooProduct>("products", filters as Record<string, string | number | boolean | undefined>, page, per_page);
        return mcpSuccess({
          products: products.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            type: p.type,
            status: p.status,
            sku: p.sku,
            price: p.price,
            regular_price: p.regular_price,
            sale_price: p.sale_price,
            stock_status: p.stock_status,
            stock_quantity: p.stock_quantity,
            categories: p.categories,
            tags: p.tags,
          })),
          page,
          per_page,
        });
      } catch (error) {
        return mcpError(error, "woo_list_products");
      }
    },
  );

  // ─── 2. woo_get_product ──────────────────────────────────────────
  server.tool(
    "woo_get_product",
    "Get detailed information about a single WooCommerce product by ID. Returns full product data including description, images, attributes, and stock info.",
    GetProductSchema.shape,
    async (params) => {
      try {
        const { product_id } = GetProductSchema.parse(params);
        const product = await client.get<WooProduct>(`products/${product_id}`);
        return mcpSuccess(product);
      } catch (error) {
        return mcpError(error, "woo_get_product");
      }
    },
  );

  // ─── 3. woo_create_product ───────────────────────────────────────
  server.tool(
    "woo_create_product",
    "Create a new WooCommerce product. Supports simple, grouped, external, and variable product types. Set status to 'draft' to review before publishing.",
    CreateProductSchema.shape,
    async (params) => {
      try {
        const validated = CreateProductSchema.parse(params);
        const product = await client.post<WooProduct>("products", validated);
        return mcpSuccess({
          id: product.id,
          name: product.name,
          slug: product.slug,
          status: product.status,
          type: product.type,
          permalink: (product as Record<string, unknown>)["permalink"],
          message: `Product '${product.name}' created (ID: ${product.id})`,
        });
      } catch (error) {
        return mcpError(error, "woo_create_product");
      }
    },
  );

  // ─── 4. woo_update_product ───────────────────────────────────────
  server.tool(
    "woo_update_product",
    "Update an existing WooCommerce product. Only provided fields are changed — omit fields you don't want to modify.",
    UpdateProductSchema.shape,
    async (params) => {
      try {
        const { product_id, ...updates } = UpdateProductSchema.parse(params);
        const product = await client.put<WooProduct>(`products/${product_id}`, updates);
        return mcpSuccess({
          id: product.id,
          name: product.name,
          status: product.status,
          price: product.price,
          message: `Product '${product.name}' updated`,
        });
      } catch (error) {
        return mcpError(error, "woo_update_product");
      }
    },
  );

  // ─── 5. woo_delete_product ───────────────────────────────────────
  server.tool(
    "woo_delete_product",
    "Delete a WooCommerce product. By default moves to trash. Set force=true to permanently delete.",
    DeleteProductSchema.shape,
    async (params) => {
      try {
        const { product_id, force } = DeleteProductSchema.parse(params);
        await client.delete(`products/${product_id}`, { force });
        return mcpSuccess({
          id: product_id,
          message: force ? `Product ${product_id} permanently deleted` : `Product ${product_id} moved to trash`,
        });
      } catch (error) {
        return mcpError(error, "woo_delete_product");
      }
    },
  );

  // ─── 6. woo_list_product_variations ──────────────────────────────
  server.tool(
    "woo_list_product_variations",
    "List all variations of a variable product. Returns each variation's price, SKU, stock, and attribute options.",
    ListProductVariationsSchema.shape,
    async (params) => {
      try {
        const { product_id, page, per_page } = ListProductVariationsSchema.parse(params);
        const variations = await client.list<Record<string, unknown>>(
          `products/${product_id}/variations`,
          {},
          page,
          per_page,
        );
        return mcpSuccess({ product_id, variations, page, per_page });
      } catch (error) {
        return mcpError(error, "woo_list_product_variations");
      }
    },
  );

  // ─── 7. woo_create_product_variation ─────────────────────────────
  server.tool(
    "woo_create_product_variation",
    "Create a variation for a variable product. Each variation requires specific attribute options (e.g., Size: Large, Color: Blue).",
    CreateProductVariationSchema.shape,
    async (params) => {
      try {
        const { product_id, ...variationData } = CreateProductVariationSchema.parse(params);
        const variation = await client.post<Record<string, unknown>>(
          `products/${product_id}/variations`,
          variationData,
        );
        return mcpSuccess({
          id: variation["id"],
          product_id,
          attributes: variation["attributes"],
          price: variation["price"],
          message: `Variation created for product ${product_id}`,
        });
      } catch (error) {
        return mcpError(error, "woo_create_product_variation");
      }
    },
  );

  // ─── woo_get_product_variation ───────────────────────────────────
  server.tool(
    "woo_get_product_variation",
    "Get detailed information about a specific product variation.",
    GetProductVariationSchema.shape,
    async (params) => {
      try {
        const { product_id, variation_id } = GetProductVariationSchema.parse(params);
        const variation = await client.get<Record<string, unknown>>(`products/${product_id}/variations/${variation_id}`);
        return mcpSuccess(variation);
      } catch (error) {
        return mcpError(error, "woo_get_product_variation");
      }
    },
  );

  // ─── woo_update_product_variation ────────────────────────────────
  server.tool(
    "woo_update_product_variation",
    "Update a product variation's price, SKU, stock, or attributes.",
    UpdateProductVariationSchema.shape,
    async (params) => {
      try {
        const { product_id, variation_id, ...data } = UpdateProductVariationSchema.parse(params);
        const variation = await client.put<Record<string, unknown>>(`products/${product_id}/variations/${variation_id}`, data);
        return mcpSuccess({ id: variation["id"], message: `Variation ${variation_id} updated` });
      } catch (error) {
        return mcpError(error, "woo_update_product_variation");
      }
    },
  );

  // ─── woo_delete_product_variation ────────────────────────────────
  server.tool(
    "woo_delete_product_variation",
    "Delete a product variation.",
    DeleteProductVariationSchema.shape,
    async (params) => {
      try {
        const { product_id, variation_id, force } = DeleteProductVariationSchema.parse(params);
        await client.delete(`products/${product_id}/variations/${variation_id}`, { force });
        return mcpSuccess({ message: `Variation ${variation_id} deleted` });
      } catch (error) {
        return mcpError(error, "woo_delete_product_variation");
      }
    },
  );
}
