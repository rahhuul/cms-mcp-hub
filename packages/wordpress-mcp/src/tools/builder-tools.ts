/**
 * Page builder MCP tools — powered by the CMS MCP Hub WordPress plugin.
 * These tools call /wp-json/cmsmcp/v1/ endpoints for builder-level operations.
 * All tools gracefully degrade when the plugin is not installed.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  DetectBuildersSchema,
  GetBuilderContentSchema,
  SetBuilderContentSchema,
  FindElementsSchema,
  UpdateElementSchema,
  MoveElementSchema,
  DuplicateElementSchema,
  RemoveElementSchema,
  GetPluginStatusSchema,
} from "../schemas/index.js";

const PLUGIN_NOT_INSTALLED_MSG =
  "CMS MCP Hub plugin is not installed on this WordPress site. " +
  "Install it from https://github.com/rahhuul/cms-mcp-hub/packages/wordpress-plugin " +
  "to enable page builder support, element manipulation, and server-side analysis.";

/**
 * Guard that checks plugin availability and returns an MCP error if not available.
 * Returns `true` if the plugin IS available (caller should proceed).
 */
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

export function registerBuilderTools(server: McpServer, pluginClient: PluginClient): void {
  /* ── wp_get_plugin_status ──────────────────────────────────────── */
  server.tool(
    "wp_get_plugin_status",
    "Check if the CMS MCP Hub companion plugin is installed on the WordPress site. Returns plugin version, WordPress version, active page builders, and snapshot count.",
    GetPluginStatusSchema.shape,
    async (_params) => {
      try {
        const status = await pluginClient.getStatus();
        return mcpSuccess(status);
      } catch (e) {
        return mcpError(
          new Error(
            `Plugin not responding. ${PLUGIN_NOT_INSTALLED_MSG}`,
          ),
          "wp_get_plugin_status",
        );
      }
    },
  );

  /* ── wp_detect_active_builders ─────────────────────────────────── */
  server.tool(
    "wp_detect_active_builders",
    "Detect all active page builders on the WordPress site (e.g., Elementor, Beaver Builder, Divi, WPBakery). Returns builder name, version, and support level.",
    DetectBuildersSchema.shape,
    async (_params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_detect_active_builders");
        if (guard) return guard;

        const builders = await pluginClient.detectBuilders();
        return mcpSuccess({
          builders,
          count: builders.length,
          message: builders.length > 0
            ? `Found ${builders.length} page builder(s): ${builders.map((b) => b.name).join(", ")}`
            : "No page builders detected. This site uses the default Gutenberg block editor.",
        });
      } catch (e) {
        return mcpError(e, "wp_detect_active_builders");
      }
    },
  );

  /* ── wp_get_builder_content ────────────────────────────────────── */
  server.tool(
    "wp_get_builder_content",
    "Extract structured builder content from a post or page. Returns the builder-native JSON representation (Elementor data, Beaver Builder nodes, etc.).",
    GetBuilderContentSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_get_builder_content");
        if (guard) return guard;

        const { post_id } = GetBuilderContentSchema.parse(params);
        const content = await pluginClient.extractBuilderContent(post_id);
        return mcpSuccess(content);
      } catch (e) {
        return mcpError(e, "wp_get_builder_content");
      }
    },
  );

  /* ── wp_set_builder_content ────────────────────────────────────── */
  server.tool(
    "wp_set_builder_content",
    "Inject builder-native JSON content into a post or page. Replaces the existing builder content entirely. Use wp_get_builder_content first to understand the structure.",
    SetBuilderContentSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_set_builder_content");
        if (guard) return guard;

        const { post_id, content } = SetBuilderContentSchema.parse(params);
        await pluginClient.injectBuilderContent(post_id, content);
        return mcpSuccess({ message: `Builder content injected into post ${post_id}` });
      } catch (e) {
        return mcpError(e, "wp_set_builder_content");
      }
    },
  );

  /* ── wp_find_elements ──────────────────────────────────────────── */
  server.tool(
    "wp_find_elements",
    "Find elements in a page by type (heading, image, button), CSS class, content text, or element ID. Returns matching elements with their IDs, settings, and hierarchy.",
    FindElementsSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_find_elements");
        if (guard) return guard;

        const { post_id, identifier_type, identifier_value } = FindElementsSchema.parse(params);
        const criteria = { [identifier_type]: identifier_value };
        const elements = await pluginClient.findElements(post_id, criteria);
        return mcpSuccess({
          elements,
          count: elements.length,
          message: elements.length > 0
            ? `Found ${elements.length} element(s) matching ${identifier_type}="${identifier_value}"`
            : `No elements found matching ${identifier_type}="${identifier_value}"`,
        });
      } catch (e) {
        return mcpError(e, "wp_find_elements");
      }
    },
  );

  /* ── wp_update_element ─────────────────────────────────────────── */
  server.tool(
    "wp_update_element",
    "Update a specific element's settings (text, styles, attributes). Use wp_find_elements first to get the element ID.",
    UpdateElementSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_update_element");
        if (guard) return guard;

        const { post_id, element_id, updates } = UpdateElementSchema.parse(params);
        await pluginClient.updateElement(post_id, element_id, updates);
        return mcpSuccess({ message: `Element "${element_id}" updated in post ${post_id}` });
      } catch (e) {
        return mcpError(e, "wp_update_element");
      }
    },
  );

  /* ── wp_move_element ───────────────────────────────────────────── */
  server.tool(
    "wp_move_element",
    "Move an element to a different position in the page. Specify a target element and whether to place before, after, or inside it.",
    MoveElementSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_move_element");
        if (guard) return guard;

        const { post_id, element_id, target_id, position } = MoveElementSchema.parse(params);
        await pluginClient.moveElement(post_id, element_id, target_id, position);
        return mcpSuccess({
          message: `Element "${element_id}" moved ${position} "${target_id}" in post ${post_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_move_element");
      }
    },
  );

  /* ── wp_duplicate_element ──────────────────────────────────────── */
  server.tool(
    "wp_duplicate_element",
    "Clone an element in a page. The duplicate is inserted immediately after the original.",
    DuplicateElementSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_duplicate_element");
        if (guard) return guard;

        const { post_id, element_id } = DuplicateElementSchema.parse(params);
        const duplicated = await pluginClient.duplicateElement(post_id, element_id);
        return mcpSuccess({
          element: duplicated,
          message: `Element "${element_id}" duplicated in post ${post_id}. New element ID: "${duplicated.id}"`,
        });
      } catch (e) {
        return mcpError(e, "wp_duplicate_element");
      }
    },
  );

  /* ── wp_remove_element ─────────────────────────────────────────── */
  server.tool(
    "wp_remove_element",
    "Remove an element from a page. The element and all its children are permanently removed from the builder content.",
    RemoveElementSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_remove_element");
        if (guard) return guard;

        const { post_id, element_id } = RemoveElementSchema.parse(params);
        await pluginClient.removeElement(post_id, element_id);
        return mcpSuccess({ message: `Element "${element_id}" removed from post ${post_id}` });
      } catch (e) {
        return mcpError(e, "wp_remove_element");
      }
    },
  );
}
