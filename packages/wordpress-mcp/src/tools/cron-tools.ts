/**
 * WordPress scheduled tasks (WP-Cron) management tools.
 * All tools require the CMS MCP Hub companion plugin.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  CronListEventsSchema,
  CronGetSchedulesSchema,
  CronRunEventSchema,
  CronDeleteEventSchema,
  CronCheckStatusSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for WP-Cron management. Install and activate it on the WordPress site.";

export function registerCronTools(server: McpServer, pluginClient: PluginClient): void {

  // ── wp_cron_list_events ─────────────────────────────────────────
  server.tool(
    "wp_cron_list_events",
    "List all scheduled WP-Cron events with next run time, recurrence schedule, hook name, and arguments. Requires the CMS MCP Hub plugin.",
    CronListEventsSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_cron_list_events");
        }
        const events = await pluginClient.listCronEvents();
        return mcpSuccess(events);
      } catch (e) {
        return mcpError(e, "wp_cron_list_events");
      }
    },
  );

  // ── wp_cron_get_schedules ───────────────────────────────────────
  server.tool(
    "wp_cron_get_schedules",
    "List all registered WP-Cron schedules (hourly, twicedaily, daily, weekly, etc.) including custom schedules added by plugins. Shows interval in seconds and display name. Requires the CMS MCP Hub plugin.",
    CronGetSchedulesSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_cron_get_schedules");
        }
        const schedules = await pluginClient.getCronSchedules();
        return mcpSuccess(schedules);
      } catch (e) {
        return mcpError(e, "wp_cron_get_schedules");
      }
    },
  );

  // ── wp_cron_run_event ───────────────────────────────────────────
  server.tool(
    "wp_cron_run_event",
    "Manually trigger a specific WP-Cron event by hook name. Optionally specify the exact scheduled timestamp if multiple instances of the same hook exist. Requires the CMS MCP Hub plugin.",
    CronRunEventSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_cron_run_event");
        }
        const validated = CronRunEventSchema.parse(params);
        const result = await pluginClient.runCronEvent(validated.hook, validated.timestamp);
        return mcpSuccess({
          message: `Cron event "${validated.hook}" triggered successfully.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_cron_run_event");
      }
    },
  );

  // ── wp_cron_delete_event ────────────────────────────────────────
  server.tool(
    "wp_cron_delete_event",
    "Remove a specific scheduled WP-Cron event by hook name and timestamp. Use wp_cron_list_events first to find the exact hook and timestamp. Requires the CMS MCP Hub plugin.",
    CronDeleteEventSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_cron_delete_event");
        }
        const validated = CronDeleteEventSchema.parse(params);
        const result = await pluginClient.deleteCronEvent(validated.hook, validated.timestamp);
        return mcpSuccess({
          message: `Cron event "${validated.hook}" at timestamp ${validated.timestamp} deleted.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_cron_delete_event");
      }
    },
  );

  // ── wp_cron_check_status ────────────────────────────────────────
  server.tool(
    "wp_cron_check_status",
    "Check if WP-Cron is working properly. Reports whether DISABLE_WP_CRON is set, if an alternative cron is configured, the last run timestamp, total scheduled events count, and any overdue events. Requires the CMS MCP Hub plugin.",
    CronCheckStatusSchema.shape,
    async (_params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_cron_check_status");
        }
        const status = await pluginClient.getCronStatus();
        return mcpSuccess(status);
      } catch (e) {
        return mcpError(e, "wp_cron_check_status");
      }
    },
  );
}
