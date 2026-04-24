/**
 * Plugin-powered snapshot tools — server-side snapshot management via the
 * CMS MCP Hub WordPress plugin's custom table storage.
 *
 * Unlike the revision-based snapshots (snapshots.ts), these capture builder
 * meta data (Elementor, Divi, Gutenberg FSE, etc.) alongside post content,
 * providing a more complete restore capability.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  PluginCreateSnapshotSchema,
  PluginListSnapshotsSchema,
  PluginRestoreSnapshotSchema,
  PluginDiffSnapshotsSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Register plugin snapshot tools                                     */
/* ------------------------------------------------------------------ */

export function registerPluginSnapshotTools(server: McpServer, pluginClient: PluginClient): void {

  // ── wp_plugin_create_snapshot ─────────────────────────────────────────
  server.tool(
    "wp_plugin_create_snapshot",
    "Create a server-side snapshot via the CMS MCP Hub plugin. Captures post content AND page builder meta data (Elementor, Divi, etc.) for a complete backup. Returns the snapshot ID and timestamp. Requires the CMS MCP Hub WordPress plugin.",
    PluginCreateSnapshotSchema.shape,
    async (p) => {
      try {
        const validated = PluginCreateSnapshotSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for enhanced snapshots with builder data. Alternatively, use wp_create_backup for revision-based backups.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const result = await pluginClient.createSnapshot(validated.post_id, validated.reason);
        return mcpSuccess({
          snapshot_id: result.id,
          post_id: validated.post_id,
          reason: validated.reason,
          message: `Snapshot ${result.id} created for post ${validated.post_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_plugin_create_snapshot");
      }
    },
  );

  // ── wp_plugin_list_snapshots ─────────────────────────────────────────
  server.tool(
    "wp_plugin_list_snapshots",
    "List plugin-stored snapshots for a post. Returns snapshot IDs, dates, reasons, and content previews. These snapshots include builder meta data not captured by WordPress revisions. Requires the CMS MCP Hub WordPress plugin.",
    PluginListSnapshotsSchema.shape,
    async (p) => {
      try {
        const validated = PluginListSnapshotsSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for enhanced snapshots. Alternatively, use wp_list_snapshots for revision-based history.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const snapshots = await pluginClient.listSnapshots(validated.post_id);
        return mcpSuccess({
          post_id: validated.post_id,
          total: snapshots.length,
          snapshots,
        });
      } catch (e) {
        return mcpError(e, "wp_plugin_list_snapshots");
      }
    },
  );

  // ── wp_plugin_restore_snapshot ────────────────────────────────────────
  server.tool(
    "wp_plugin_restore_snapshot",
    "Restore a post from a plugin snapshot, including builder meta data. This overwrites the current post content and builder data with the snapshot's stored state. Requires the CMS MCP Hub WordPress plugin.",
    PluginRestoreSnapshotSchema.shape,
    async (p) => {
      try {
        const validated = PluginRestoreSnapshotSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for enhanced restore. Alternatively, use wp_restore_snapshot for revision-based restore.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        await pluginClient.restoreSnapshot(validated.post_id, validated.snapshot_id);
        return mcpSuccess({
          restored: true,
          post_id: validated.post_id,
          snapshot_id: validated.snapshot_id,
          message: `Post ${validated.post_id} restored from plugin snapshot ${validated.snapshot_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_plugin_restore_snapshot");
      }
    },
  );

  // ── wp_plugin_diff_snapshots ─────────────────────────────────────────
  server.tool(
    "wp_plugin_diff_snapshots",
    "Compare two plugin snapshots side by side. Shows differences in content, title, excerpt, and builder meta data between the two snapshots. Requires the CMS MCP Hub WordPress plugin.",
    PluginDiffSnapshotsSchema.shape,
    async (p) => {
      try {
        const validated = PluginDiffSnapshotsSchema.parse(p);
        const available = await pluginClient.isAvailable();
        if (!available) {
          return mcpSuccess({
            error: "CMS MCP Hub plugin is not installed on this WordPress site.",
            suggestion: "Install the plugin for snapshot diffing. Alternatively, use wp_diff_content for revision-based comparison.",
            plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
          });
        }
        const diff = await pluginClient.diffSnapshots(
          validated.post_id,
          validated.snapshot_a,
          validated.snapshot_b,
        );
        return mcpSuccess({
          post_id: validated.post_id,
          snapshot_a: validated.snapshot_a,
          snapshot_b: validated.snapshot_b,
          diff,
        });
      } catch (e) {
        return mcpError(e, "wp_plugin_diff_snapshots");
      }
    },
  );
}
