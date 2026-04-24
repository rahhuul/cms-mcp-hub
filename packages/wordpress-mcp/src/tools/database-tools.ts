/**
 * Database management tools — table sizes, optimization, cleanup.
 * All tools require the CMS MCP Hub companion plugin.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  DbGetSizesSchema,
  DbOptimizeTablesSchema,
  DbCleanupRevisionsSchema,
  DbCleanupTransientsSchema,
  DbGetInfoSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub companion plugin is required for database tools. Install and activate it on your WordPress site.";

export function registerDatabaseTools(server: McpServer, pluginClient: PluginClient): void {

  // ── wp_db_get_sizes ─────────────────────────────────────────────────
  server.tool(
    "wp_db_get_sizes",
    "Get database table sizes and total DB size. Returns table name, row count, data size, and index size for every WordPress table. Useful for identifying bloated tables.",
    DbGetSizesSchema.shape,
    async () => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_db_get_sizes");
        }
        const sizes = await pluginClient.getDbSizes();
        return mcpSuccess(sizes);
      } catch (e) {
        return mcpError(e, "wp_db_get_sizes");
      }
    },
  );

  // ── wp_db_optimize_tables ───────────────────────────────────────────
  server.tool(
    "wp_db_optimize_tables",
    "Run OPTIMIZE TABLE on WordPress database tables to reclaim unused space and improve query performance. Optionally specify specific tables, or omit to optimize all.",
    DbOptimizeTablesSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_db_optimize_tables");
        }
        const v = DbOptimizeTablesSchema.parse(params);
        const result = await pluginClient.optimizeDbTables(v.tables);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_db_optimize_tables");
      }
    },
  );

  // ── wp_db_cleanup_revisions ─────────────────────────────────────────
  server.tool(
    "wp_db_cleanup_revisions",
    "Delete excess post revisions, keeping only a specified number per post (default: 5). Returns count of revisions deleted. Helps reduce database bloat significantly on content-heavy sites.",
    DbCleanupRevisionsSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_db_cleanup_revisions");
        }
        const v = DbCleanupRevisionsSchema.parse(params);
        const result = await pluginClient.cleanupRevisions(v.keep);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_db_cleanup_revisions");
      }
    },
  );

  // ── wp_db_cleanup_transients ────────────────────────────────────────
  server.tool(
    "wp_db_cleanup_transients",
    "Delete all expired transients from the WordPress database. Transients are temporary cached data that can accumulate over time. Safe to run — only removes already-expired entries.",
    DbCleanupTransientsSchema.shape,
    async () => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_db_cleanup_transients");
        }
        const result = await pluginClient.cleanupExpiredTransients();
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_db_cleanup_transients");
      }
    },
  );

  // ── wp_db_get_info ──────────────────────────────────────────────────
  server.tool(
    "wp_db_get_info",
    "Get database server information including MySQL/MariaDB version, charset, collation, table prefix, and connection details. Useful for diagnostics and compatibility checks.",
    DbGetInfoSchema.shape,
    async () => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_db_get_info");
        }
        const info = await pluginClient.getDbInfo();
        return mcpSuccess(info);
      } catch (e) {
        return mcpError(e, "wp_db_get_info");
      }
    },
  );
}
