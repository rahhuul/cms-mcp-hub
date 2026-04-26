/**
 * Bricks Builder deep intelligence MCP tools.
 * Provides global classes, theme styles, color palette, typography,
 * components, and cross-page analysis — all powered by the CMS MCP Hub plugin.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient, PluginStatus } from "../api/plugin-client.js";
import {
  BricksListGlobalClassesSchema,
  BricksCreateGlobalClassSchema,
  BricksUpdateGlobalClassSchema,
  BricksDeleteGlobalClassSchema,
  BricksGetThemeStylesSchema,
  BricksUpdateThemeStylesSchema,
  BricksGetColorPaletteSchema,
  BricksUpdateColorPaletteSchema,
  BricksGetTypographySchema,
  BricksUpdateTypographySchema,
  BricksListComponentsSchema,
  BricksGetComponentSchema,
  BricksApplyComponentSchema,
  BricksSearchElementsSchema,
  BricksHealthCheckSchema,
  BricksStyleProfileSchema,
  BricksDesignSystemSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Guards                                                             */
/* ------------------------------------------------------------------ */

const PLUGIN_REQUIRED_MSG =
  "CMS MCP Hub plugin is required for Bricks tools. " +
  "Install it from https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin";

const BRICKS_NOT_ACTIVE_MSG =
  "Bricks Builder is not active on this WordPress site.";

/**
 * Checks plugin availability AND Bricks builder presence.
 * Returns an MCP error response if either check fails, otherwise null.
 */
async function requireBricks(
  pluginClient: PluginClient,
  _toolName: string,
): Promise<ReturnType<typeof mcpSuccess> | null> {
  const available = await pluginClient.isAvailable();
  if (!available) {
    return mcpSuccess({
      error: PLUGIN_REQUIRED_MSG,
      plugin_url: "https://github.com/rahhuul/cms-mcp-hub/tree/master/packages/wordpress-plugin",
    });
  }

  try {
    const status: PluginStatus = await pluginClient.getStatus();
    const builders = status.active_builders ?? [];
    // active_builders can be string[] or {slug:string}[] depending on plugin version
    const hasBricks = Array.isArray(builders) && builders.some((b: unknown) => {
      if (typeof b === "string") return b === "bricks";
      if (typeof b === "object" && b !== null && "slug" in b) return (b as { slug: string }).slug === "bricks";
      return false;
    });

    if (!hasBricks) {
      return mcpSuccess({
        error: BRICKS_NOT_ACTIVE_MSG,
        active_builders: builders,
      });
    }
  } catch {
    // If status check fails, proceed anyway — the actual API call will surface the error
  }

  return null;
}

/* ------------------------------------------------------------------ */
/*  Registration                                                       */
/* ------------------------------------------------------------------ */

export function registerBricksTools(server: McpServer, pluginClient: PluginClient): void {

  /* ── Global Classes ─────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_list_global_classes",
    "List all Bricks global CSS classes with their settings and descriptions. Global classes are reusable style presets applied across elements site-wide.",
    BricksListGlobalClassesSchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_list_global_classes");
        if (guard) return guard;

        const classes = await pluginClient.getBricksGlobalClasses();
        return mcpSuccess(classes);
      } catch (e) {
        return mcpError(e, "wp_bricks_list_global_classes");
      }
    },
  );

  server.tool(
    "wp_bricks_create_global_class",
    "Create a new Bricks global CSS class with name, CSS properties, and optional description. The class becomes available for all elements site-wide.",
    BricksCreateGlobalClassSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_create_global_class");
        if (guard) return guard;

        const validated = BricksCreateGlobalClassSchema.parse(params);
        const result = await pluginClient.createBricksGlobalClass(validated);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_create_global_class");
      }
    },
  );

  server.tool(
    "wp_bricks_update_global_class",
    "Update an existing Bricks global CSS class. Modify name, CSS properties, or description. Use wp_bricks_list_global_classes first to get class IDs.",
    BricksUpdateGlobalClassSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_update_global_class");
        if (guard) return guard;

        const { class_id, ...data } = BricksUpdateGlobalClassSchema.parse(params);
        const result = await pluginClient.updateBricksGlobalClass(class_id, data);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_update_global_class");
      }
    },
  );

  server.tool(
    "wp_bricks_delete_global_class",
    "Delete a Bricks global CSS class by ID. Elements using this class will lose the associated styles.",
    BricksDeleteGlobalClassSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_delete_global_class");
        if (guard) return guard;

        const { class_id } = BricksDeleteGlobalClassSchema.parse(params);
        const result = await pluginClient.deleteBricksGlobalClass(class_id);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_delete_global_class");
      }
    },
  );

  /* ── Theme Styles ───────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_get_theme_styles",
    "Get the site-wide Bricks theme style configuration. Returns default styles for headings, body text, links, buttons, and other element types.",
    BricksGetThemeStylesSchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_get_theme_styles");
        if (guard) return guard;

        const styles = await pluginClient.getBricksThemeStyles();
        return mcpSuccess(styles);
      } catch (e) {
        return mcpError(e, "wp_bricks_get_theme_styles");
      }
    },
  );

  server.tool(
    "wp_bricks_update_theme_styles",
    "Update Bricks site-wide theme styles. Set default typography, colors, spacing for headings, body, links, buttons, and other element categories.",
    BricksUpdateThemeStylesSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_update_theme_styles");
        if (guard) return guard;

        const { styles } = BricksUpdateThemeStylesSchema.parse(params);
        const result = await pluginClient.updateBricksThemeStyles({ styles });
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_update_theme_styles");
      }
    },
  );

  /* ── Color Palette ──────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_get_color_palette",
    "Get the Bricks color palette groups. Returns all named colors organized by group, used in the Bricks color picker across the site.",
    BricksGetColorPaletteSchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_get_color_palette");
        if (guard) return guard;

        const palette = await pluginClient.getBricksColorPalette();
        return mcpSuccess(palette);
      } catch (e) {
        return mcpError(e, "wp_bricks_get_color_palette");
      }
    },
  );

  server.tool(
    "wp_bricks_update_color_palette",
    "Update the Bricks color palette. Set named colors with hex/rgb/hsl values organized by groups. Colors appear in the Bricks color picker site-wide.",
    BricksUpdateColorPaletteSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_update_color_palette");
        if (guard) return guard;

        const { colors } = BricksUpdateColorPaletteSchema.parse(params);
        const result = await pluginClient.updateBricksColorPalette({ colors });
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_update_color_palette");
      }
    },
  );

  /* ── Typography ─────────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_get_typography",
    "Get Bricks global CSS variables and typography scale settings. Returns font families, sizes, weights, line heights, and custom CSS variables.",
    BricksGetTypographySchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_get_typography");
        if (guard) return guard;

        const typography = await pluginClient.getBricksTypography();
        return mcpSuccess(typography);
      } catch (e) {
        return mcpError(e, "wp_bricks_get_typography");
      }
    },
  );

  server.tool(
    "wp_bricks_update_typography",
    "Update Bricks global CSS variables and typography scale. Set font families, sizes, weights, line heights, and custom CSS variables used site-wide.",
    BricksUpdateTypographySchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_update_typography");
        if (guard) return guard;

        const { variables } = BricksUpdateTypographySchema.parse(params);
        const result = await pluginClient.updateBricksTypography({ variables });
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_update_typography");
      }
    },
  );

  /* ── Components ─────────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_list_components",
    "List all Bricks templates and components (saved sections, headers, footers, content blocks). Returns template type, title, and metadata.",
    BricksListComponentsSchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_list_components");
        if (guard) return guard;

        const components = await pluginClient.listBricksComponents();
        return mcpSuccess(components);
      } catch (e) {
        return mcpError(e, "wp_bricks_list_components");
      }
    },
  );

  server.tool(
    "wp_bricks_get_component",
    "Get a Bricks template/component with its full element structure. Returns all elements, their hierarchy, settings, and classes.",
    BricksGetComponentSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_get_component");
        if (guard) return guard;

        const { component_id } = BricksGetComponentSchema.parse(params);
        const component = await pluginClient.getBricksComponent(component_id);
        return mcpSuccess(component);
      } catch (e) {
        return mcpError(e, "wp_bricks_get_component");
      }
    },
  );

  server.tool(
    "wp_bricks_apply_component",
    "Insert a Bricks template/component into a page. Appends, prepends, or replaces the page content with the component's elements.",
    BricksApplyComponentSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_apply_component");
        if (guard) return guard;

        const { post_id, component_id, position } = BricksApplyComponentSchema.parse(params);
        const result = await pluginClient.applyBricksComponent(post_id, component_id, position);
        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_bricks_apply_component");
      }
    },
  );

  /* ── Analysis ───────────────────────────────────────────────────── */

  server.tool(
    "wp_bricks_search_elements",
    "Search across ALL Bricks pages for elements by type, CSS class, or setting value. Find every instance of a button, heading, or class usage site-wide.",
    BricksSearchElementsSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_search_elements");
        if (guard) return guard;

        const validated = BricksSearchElementsSchema.parse(params);
        const results = await pluginClient.searchBricksElements(validated);
        return mcpSuccess(results);
      } catch (e) {
        return mcpError(e, "wp_bricks_search_elements");
      }
    },
  );

  server.tool(
    "wp_bricks_health_check",
    "Run diagnostics on a Bricks page: detect orphaned elements, duplicate IDs, broken parent references, empty containers, and unused classes.",
    BricksHealthCheckSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_health_check");
        if (guard) return guard;

        const { post_id } = BricksHealthCheckSchema.parse(params);
        const report = await pluginClient.bricksHealthCheck(post_id);
        return mcpSuccess(report);
      } catch (e) {
        return mcpError(e, "wp_bricks_health_check");
      }
    },
  );

  server.tool(
    "wp_bricks_style_profile",
    "Analyze a Bricks page's design patterns: extract color usage, spacing patterns, typography choices, and layout structure for design consistency auditing.",
    BricksStyleProfileSchema.shape,
    async (params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_style_profile");
        if (guard) return guard;

        const { post_id } = BricksStyleProfileSchema.parse(params);
        const profile = await pluginClient.bricksStyleProfile(post_id);
        return mcpSuccess(profile);
      } catch (e) {
        return mcpError(e, "wp_bricks_style_profile");
      }
    },
  );

  server.tool(
    "wp_bricks_design_system",
    "Export the complete Bricks design system in a single call: global classes, theme styles, color palette, typography, and components. Use this to understand the full design context before making changes.",
    BricksDesignSystemSchema.shape,
    async (_params) => {
      try {
        const guard = await requireBricks(pluginClient, "wp_bricks_design_system");
        if (guard) return guard;

        const system = await pluginClient.bricksDesignSystem();
        return mcpSuccess(system);
      } catch (e) {
        return mcpError(e, "wp_bricks_design_system");
      }
    },
  );
}
