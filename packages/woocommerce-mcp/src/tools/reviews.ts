/**
 * Product Review tools (5): list, get, create, update, delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { ListProductReviewsSchema, GetProductReviewSchema, CreateProductReviewSchema, UpdateProductReviewSchema, DeleteProductReviewSchema } from "../schemas/index.js";

export function registerReviewTools(server: McpServer, client: WooClient): void {
  server.tool("woo_list_product_reviews", "List product reviews with optional product and status filters.", ListProductReviewsSchema.shape, async (params) => {
    try {
      const { page, per_page, ...f } = ListProductReviewsSchema.parse(params);
      return mcpSuccess(await client.list<unknown>("products/reviews", f as Record<string, string | number | boolean | undefined>, page, per_page));
    } catch (error) { return mcpError(error, "woo_list_product_reviews"); }
  });

  server.tool("woo_get_product_review", "Get a single product review by ID.", GetProductReviewSchema.shape, async (params) => {
    try { return mcpSuccess(await client.get<unknown>(`products/reviews/${GetProductReviewSchema.parse(params).review_id}`)); }
    catch (error) { return mcpError(error, "woo_get_product_review"); }
  });

  server.tool("woo_create_product_review", "Create a product review with rating, reviewer name, and email.", CreateProductReviewSchema.shape, async (params) => {
    try {
      const v = CreateProductReviewSchema.parse(params);
      const r = await client.post<Record<string, unknown>>("products/reviews", v);
      return mcpSuccess({ id: r["id"], product_id: r["product_id"], rating: r["rating"], message: "Review created" });
    } catch (error) { return mcpError(error, "woo_create_product_review"); }
  });

  server.tool("woo_update_product_review", "Update a review's content, rating, or status (approve/hold/spam).", UpdateProductReviewSchema.shape, async (params) => {
    try {
      const { review_id, ...data } = UpdateProductReviewSchema.parse(params);
      const r = await client.put<Record<string, unknown>>(`products/reviews/${review_id}`, data);
      return mcpSuccess({ id: r["id"], status: r["status"], message: `Review ${review_id} updated` });
    } catch (error) { return mcpError(error, "woo_update_product_review"); }
  });

  server.tool("woo_delete_product_review", "Delete a product review.", DeleteProductReviewSchema.shape, async (params) => {
    try {
      const { review_id, force } = DeleteProductReviewSchema.parse(params);
      await client.delete(`products/reviews/${review_id}`, { force });
      return mcpSuccess({ message: `Review ${review_id} deleted` });
    } catch (error) { return mcpError(error, "woo_delete_product_review"); }
  });
}
