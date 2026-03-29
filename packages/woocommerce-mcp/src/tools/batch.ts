/**
 * Batch operations tool (1): batch create/update/delete
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WooClient } from "../api/client.js";
import { BatchUpdateSchema } from "../schemas/index.js";

const MAX_BATCH_OPERATIONS = 100;

export function registerBatchTools(server: McpServer, client: WooClient): void {
  // ─── 24. woo_batch_update ────────────────────────────────────────
  server.tool(
    "woo_batch_update",
    "Batch create, update, and/or delete WooCommerce resources in a single request. Supports products, orders, coupons, customers, categories, and tags. Maximum 100 total operations per batch.",
    BatchUpdateSchema.shape,
    async (params) => {
      try {
        const { resource, create, update, delete: deleteIds } = BatchUpdateSchema.parse(params);

        const totalOps = (create?.length ?? 0) + (update?.length ?? 0) + (deleteIds?.length ?? 0);
        if (totalOps === 0) {
          return mcpError(
            new Error("At least one operation (create, update, or delete) is required"),
            "woo_batch_update",
          );
        }
        if (totalOps > MAX_BATCH_OPERATIONS) {
          return mcpError(
            new Error(`Batch operations limited to ${MAX_BATCH_OPERATIONS} total. Got ${totalOps}.`),
            "woo_batch_update",
          );
        }

        const result = await client.batch(resource, {
          create,
          update,
          delete: deleteIds,
        });

        return mcpSuccess({
          resource,
          created: result.create?.length ?? 0,
          updated: result.update?.length ?? 0,
          deleted: result.delete?.length ?? 0,
          result,
        });
      } catch (error) {
        return mcpError(error, "woo_batch_update");
      }
    },
  );
}
