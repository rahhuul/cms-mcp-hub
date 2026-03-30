/**
 * Publishing tools: get_changes, publish_preview, promote_to_production
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { FramerClient } from "../api/client.js";
import {
  GetChangesSchema,
  PublishPreviewSchema,
  PromoteToProductionSchema,
} from "../schemas/index.js";

export function registerPublishingTools(server: McpServer, client: FramerClient): void {
  // ─── 16. framer_get_changes ──────────────────────────────────────
  server.tool(
    "framer_get_changes",
    "Get the diff of changes since the last publish. Shows which paths were added, removed, or modified. Use before publishing to review what will go live.",
    GetChangesSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const changes = await framer.getChangedPaths();
        return mcpSuccess({
          ...changes,
          totalChanges: changes.added.length + changes.removed.length + changes.modified.length,
        });
      } catch (error) {
        return mcpError(error, "framer_get_changes");
      }
    },
  );

  // ─── 17. framer_publish_preview ──────────────────────────────────
  server.tool(
    "framer_publish_preview",
    "Publish the current project state to preview/staging. Returns a deployment ID and hostnames. Use framer_get_changes first to see what will be published.",
    PublishPreviewSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const result = await framer.publish();
        return mcpSuccess({
          deployment: result.deployment,
          hostnames: result.hostnames,
          message: "Preview published successfully. Use the deployment ID with framer_promote_to_production to go live.",
        });
      } catch (error) {
        return mcpError(error, "framer_publish_preview");
      }
    },
  );

  // ─── 18. framer_promote_to_production ────────────────────────────
  server.tool(
    "framer_promote_to_production",
    "Promote a preview deployment to production. Requires a deployment ID from a previous framer_publish_preview call. Optionally specify which domains to deploy to.",
    PromoteToProductionSchema.shape,
    async (params) => {
      try {
        const validated = PromoteToProductionSchema.parse(params);
        const framer = await client.getConnection();
        const hostnames = await framer.deploy(validated.deploymentId, validated.domains);
        return mcpSuccess({
          hostnames,
          message: "Successfully promoted to production",
        });
      } catch (error) {
        return mcpError(error, "framer_promote_to_production");
      }
    },
  );
}
