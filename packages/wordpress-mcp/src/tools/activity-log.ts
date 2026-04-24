/**
 * Activity log tools — track and query changes made via the MCP server.
 * Uses the CMS MCP Hub plugin which logs all REST API mutations.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  ActivityListSchema,
  ActivityGetSchema,
  ActivityUndoSchema,
  ActivityStatsSchema,
  ActivityExportSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for activity logging. Install and activate it on the WordPress site.";

export function registerActivityLogTools(server: McpServer, _client: WpClient, pluginClient: PluginClient): void {

  // ── wp_activity_list ──────────────────────────────────────────────
  server.tool(
    "wp_activity_list",
    "List recent activity log entries. Filter by user, action type (create/update/delete), resource type (post/page/media/etc), and date range. Returns who did what, when, and on which resource.",
    ActivityListSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_activity_list");
        }
        const validated = ActivityListSchema.parse(params);
        const filters: Record<string, unknown> = {};
        if (validated.user) filters["user"] = validated.user;
        if (validated.action) filters["action"] = validated.action;
        if (validated.resource_type) filters["resource_type"] = validated.resource_type;
        if (validated.date_from) filters["date_from"] = validated.date_from;
        if (validated.date_to) filters["date_to"] = validated.date_to;
        if (validated.page) filters["page"] = validated.page;
        if (validated.per_page) filters["per_page"] = validated.per_page;

        const result = await pluginClient.listActivity(filters);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_activity_list");
      }
    },
  );

  // ── wp_activity_get ───────────────────────────────────────────────
  server.tool(
    "wp_activity_get",
    "Get detailed info about a specific activity log entry, including full before/after diff of what changed.",
    ActivityGetSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_activity_get");
        }
        const { activity_id } = ActivityGetSchema.parse(params);
        const result = await pluginClient.getActivity(activity_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_activity_get");
      }
    },
  );

  // ── wp_activity_undo ──────────────────────────────────────────────
  server.tool(
    "wp_activity_undo",
    "Undo a specific activity by restoring the previous state. Only works for update and delete actions — create actions cannot be undone this way.",
    ActivityUndoSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_activity_undo");
        }
        const { activity_id } = ActivityUndoSchema.parse(params);
        const result = await pluginClient.undoActivity(activity_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_activity_undo");
      }
    },
  );

  // ── wp_activity_stats ─────────────────────────────────────────────
  server.tool(
    "wp_activity_stats",
    "Get activity statistics — most active users, most-modified posts, actions per day/week, and busiest hours. Filter by date range.",
    ActivityStatsSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_activity_stats");
        }
        const validated = ActivityStatsSchema.parse(params);
        const filters: Record<string, unknown> = {};
        if (validated.date_from) filters["date_from"] = validated.date_from;
        if (validated.date_to) filters["date_to"] = validated.date_to;
        if (validated.group_by) filters["group_by"] = validated.group_by;

        const result = await pluginClient.getActivityStats(filters);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_activity_stats");
      }
    },
  );

  // ── wp_activity_export ────────────────────────────────────────────
  server.tool(
    "wp_activity_export",
    "Export the activity log as JSON for the given date range. Returns all log entries matching the filters for external analysis or archiving.",
    ActivityExportSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_activity_export");
        }
        const validated = ActivityExportSchema.parse(params);
        const filters: Record<string, unknown> = {};
        if (validated.date_from) filters["date_from"] = validated.date_from;
        if (validated.date_to) filters["date_to"] = validated.date_to;
        if (validated.action) filters["action"] = validated.action;
        if (validated.resource_type) filters["resource_type"] = validated.resource_type;
        if (validated.format) filters["format"] = validated.format;

        const result = await pluginClient.exportActivity(filters);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_activity_export");
      }
    },
  );
}
