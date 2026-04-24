/**
 * WP-CLI bridge tools — execute WP-CLI commands server-side via the
 * CMS MCP Hub WordPress plugin REST API.
 *
 * Requires the companion plugin to be installed and active.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  WpCliRunSchema,
  WpCliExportSchema,
  WpCliImportSchema,
  WpCliSearchReplaceSchema,
  WpCliMaintenanceModeSchema,
  WpCliCacheFlushSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const PLUGIN_NOT_INSTALLED_MSG =
  "CMS MCP Hub plugin is not installed on this WordPress site. " +
  "Install it from https://github.com/rahhuul/cms-mcp-hub/packages/wordpress-plugin " +
  "to enable WP-CLI bridge, staging workflows, and server-side analysis.";

/**
 * Commands that are too destructive to allow via an AI agent.
 * Matched against the first word(s) of the command string.
 */
const BLOCKED_COMMANDS: string[] = [
  "db drop",
  "db reset",
  "db export",
  "db import",
  "db query",
  "db create",
  "db clean",
  "core download",
  "core update",
  "core install",
  "plugin delete",
  "plugin deactivate",
  "plugin install",
  "plugin update",
  "theme delete",
  "theme install",
  "theme update",
  "config set",
  "config delete",
  "config create",
  "site delete",
  "site empty",
  "user delete",
  "eval",
  "eval-file",
  "shell",
  "server",
  "package",
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

async function requirePlugin(
  pluginClient: PluginClient,
  toolName: string,
): Promise<ReturnType<typeof mcpError> | null> {
  const available = await pluginClient.isAvailable();
  if (!available) {
    return mcpError(new Error(PLUGIN_NOT_INSTALLED_MSG), toolName);
  }
  return null;
}

function isBlockedCommand(command: string): boolean {
  const normalised = command.trim().toLowerCase();
  return BLOCKED_COMMANDS.some((blocked) => normalised.startsWith(blocked));
}

/* ------------------------------------------------------------------ */
/*  Register WP-CLI tools                                              */
/* ------------------------------------------------------------------ */

export function registerWpCliTools(server: McpServer, pluginClient: PluginClient): void {
  /* ── wp_cli_run ──────────────────────────────────────────────────── */
  server.tool(
    "wp_cli_run",
    "Execute a WP-CLI command on the WordPress server via the CMS MCP Hub plugin. " +
      "Accepts any safe read/modify command (e.g., 'cache flush', 'option get blogname', 'user list --format=json'). " +
      "Destructive commands like 'db drop', 'plugin delete', and 'eval' are blocked for safety.",
    WpCliRunSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_run");
        if (guard) return guard;

        const { command, args } = WpCliRunSchema.parse(params);

        if (isBlockedCommand(command)) {
          return mcpError(
            new Error(
              `Command "${command}" is blocked for safety. Blocked command prefixes: ${BLOCKED_COMMANDS.join(", ")}. ` +
                "Use the WordPress admin dashboard for destructive operations.",
            ),
            "wp_cli_run",
          );
        }

        const result = await pluginClient.runWpCli(command, args);
        return mcpSuccess({ command, result });
      } catch (e) {
        return mcpError(e, "wp_cli_run");
      }
    },
  );

  /* ── wp_cli_export ───────────────────────────────────────────────── */
  server.tool(
    "wp_cli_export",
    "Export WordPress content via WP-CLI (wp export). Returns WXR XML data or a download URL. " +
      "Supports filtering by post type, status, date range, and author.",
    WpCliExportSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_export");
        if (guard) return guard;

        const options = WpCliExportSchema.parse(params);
        const filteredOptions: Record<string, unknown> = {};
        if (options.post_type) filteredOptions["post_type"] = options.post_type;
        if (options.status) filteredOptions["status"] = options.status;
        if (options.start_date) filteredOptions["start_date"] = options.start_date;
        if (options.end_date) filteredOptions["end_date"] = options.end_date;
        if (options.author) filteredOptions["author"] = options.author;

        const result = await pluginClient.wpCliExport(filteredOptions);
        return mcpSuccess({ export: result });
      } catch (e) {
        return mcpError(e, "wp_cli_export");
      }
    },
  );

  /* ── wp_cli_import ───────────────────────────────────────────────── */
  server.tool(
    "wp_cli_import",
    "Import WXR/XML content into WordPress via WP-CLI (wp import). " +
      "Provide a URL to a WXR file or inline XML content. Handles author mapping and thumbnail imports.",
    WpCliImportSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_import");
        if (guard) return guard;

        const { source, authors, skip_thumbnails } = WpCliImportSchema.parse(params);
        const result = await pluginClient.wpCliImport(source, {
          authors,
          skip_thumbnails,
        });
        return mcpSuccess({ import: result });
      } catch (e) {
        return mcpError(e, "wp_cli_import");
      }
    },
  );

  /* ── wp_cli_search_replace ───────────────────────────────────────── */
  server.tool(
    "wp_cli_search_replace",
    "Run search-replace across the WordPress database via WP-CLI. Essential for domain migrations " +
      "(e.g., replacing 'http://staging.example.com' with 'https://example.com'). " +
      "Runs in dry-run mode by default — set dry_run=false to apply changes.",
    WpCliSearchReplaceSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_search_replace");
        if (guard) return guard;

        const { search, replace, tables, dry_run, precise, skip_columns } =
          WpCliSearchReplaceSchema.parse(params);

        const options: Record<string, unknown> = { dry_run, precise };
        if (tables) options["tables"] = tables;
        if (skip_columns) options["skip_columns"] = skip_columns;

        const result = await pluginClient.wpCliSearchReplace(search, replace, options);
        return mcpSuccess({
          search,
          replace,
          dry_run,
          result,
          warning: dry_run
            ? "This was a DRY RUN — no changes were made. Set dry_run=false to apply."
            : "Changes have been applied to the database.",
        });
      } catch (e) {
        return mcpError(e, "wp_cli_search_replace");
      }
    },
  );

  /* ── wp_cli_maintenance_mode ─────────────────────────────────────── */
  server.tool(
    "wp_cli_maintenance_mode",
    "Toggle WordPress maintenance mode on or off. When enabled, visitors see a 'briefly unavailable' message. " +
      "Useful before running migrations, search-replace, or bulk updates.",
    WpCliMaintenanceModeSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_maintenance_mode");
        if (guard) return guard;

        const { enable } = WpCliMaintenanceModeSchema.parse(params);
        const command = enable ? "maintenance-mode activate" : "maintenance-mode deactivate";
        const result = await pluginClient.runWpCli(command);
        return mcpSuccess({
          maintenance_mode: enable ? "enabled" : "disabled",
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_cli_maintenance_mode");
      }
    },
  );

  /* ── wp_cli_cache_flush ──────────────────────────────────────────── */
  server.tool(
    "wp_cli_cache_flush",
    "Flush WordPress caches. Supports flushing all caches at once, or targeting specific cache types: " +
      "object cache, transients, or rewrite rules. Useful after content changes or migrations.",
    WpCliCacheFlushSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_cli_cache_flush");
        if (guard) return guard;

        const { type } = WpCliCacheFlushSchema.parse(params);

        const commands: Record<string, string[]> = {
          all: ["cache flush", "transient delete --all", "rewrite flush"],
          object: ["cache flush"],
          transients: ["transient delete --all"],
          rewrite: ["rewrite flush"],
        };

        const results: Record<string, unknown> = {};
        for (const cmd of commands[type]) {
          results[cmd] = await pluginClient.runWpCli(cmd);
        }

        return mcpSuccess({
          cache_type: type,
          flushed: Object.keys(results),
          results,
        });
      } catch (e) {
        return mcpError(e, "wp_cli_cache_flush");
      }
    },
  );
}
