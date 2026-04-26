/**
 * Project tools: get_project_info, get_project_settings, update_project_settings
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { FramerClient } from "../api/client.js";
import {
  GetProjectInfoSchema,
  GetProjectSettingsSchema,
  UpdateProjectSettingsSchema,
} from "../schemas/index.js";

export function registerProjectTools(server: McpServer, client: FramerClient): void {
  // ─── 1. framer_get_project_info ──────────────────────────────────
  server.tool(
    "framer_get_project_info",
    "Get the Framer project name, ID, and URL. Use this to verify the connection and get project metadata.",
    GetProjectInfoSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const info = await framer.getProjectInfo();
        return mcpSuccess(info);
      } catch (error) {
        return mcpError(error, "framer_get_project_info");
      }
    },
  );

  // ─── 19. framer_get_project_settings ─────────────────────────────
  server.tool(
    "framer_get_project_settings",
    "Get the Framer project configuration including publish info (production/staging URLs, deployment status) and custom code settings.",
    GetProjectSettingsSchema.shape,
    async () => {
      try {
        const framer = await client.getConnection();
        const [publishInfo, customCode] = await Promise.all([
          framer.getPublishInfo(),
          framer.getCustomCode(),
        ]);
        return mcpSuccess({ publishInfo, customCode });
      } catch (error) {
        return mcpError(error, "framer_get_project_settings");
      }
    },
  );

  // ─── 20. framer_update_project_settings ──────────────────────────
  server.tool(
    "framer_update_project_settings",
    "Update project configuration such as custom code injection (analytics, tracking scripts, etc.).",
    UpdateProjectSettingsSchema.shape,
    async (params) => {
      try {
        const validated = UpdateProjectSettingsSchema.parse(params);
        const framer = await client.getConnection();

        if (validated.customCode) {
          await framer.setCustomCode({
            location: validated.customCode.location,
            html: validated.customCode.html,
          });
        }

        const updated = await framer.getCustomCode();
        return mcpSuccess({ customCode: updated, message: "Project settings updated" });
      } catch (error) {
        return mcpError(error, "framer_update_project_settings");
      }
    },
  );
}
