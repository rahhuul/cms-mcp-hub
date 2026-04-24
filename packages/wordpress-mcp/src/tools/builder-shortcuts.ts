/**
 * Builder-aware Widget Shortcuts — 12 tools that add widgets via the active
 * page builder (Elementor, Divi, Bricks, Beaver Builder, etc.).
 *
 * Unlike the Gutenberg widget shortcuts (which emit block HTML), these tools
 * call the CMS MCP Hub WordPress plugin REST API, which converts the widget
 * request into the builder's native format.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { PluginClient } from "../api/plugin-client.js";
import {
  BuilderAddHeadingSchema,
  BuilderAddTextSchema,
  BuilderAddImageSchema,
  BuilderAddButtonSchema,
  BuilderAddVideoSchema,
  BuilderAddSectionSchema,
  BuilderAddDividerSchema,
  BuilderAddSpacerSchema,
  BuilderAddIconSchema,
  BuilderAddFormSchema,
  BuilderAddGallerySchema,
  BuilderAddSliderSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "CMS MCP Hub plugin is not installed on this WordPress site. " +
  "Install it from https://github.com/rahhuul/cms-mcp-hub/packages/wordpress-plugin " +
  "to enable builder-aware widget shortcuts.";

async function requirePlugin(
  pluginClient: PluginClient,
  toolName: string,
): Promise<ReturnType<typeof mcpError> | null> {
  const available = await pluginClient.isAvailable();
  if (!available) {
    return mcpError(new Error(PLUGIN_REQUIRED_MSG), toolName);
  }
  return null;
}

export function registerBuilderShortcutTools(
  server: McpServer,
  pluginClient: PluginClient,
): void {

  // 1. Heading
  server.tool(
    "wp_builder_add_heading",
    "Add a heading via the active page builder (Elementor, Divi, Bricks, etc.). The plugin converts the request into the builder's native widget/module format.",
    BuilderAddHeadingSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_heading");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddHeadingSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "heading", settings, position);
        return mcpSuccess({ post_id, widget_type: "heading", message: `Heading added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_heading");
      }
    },
  );

  // 2. Text / Paragraph
  server.tool(
    "wp_builder_add_text",
    "Add a text/paragraph widget via the active page builder. Works with Elementor Text Editor, Divi Text Module, Bricks Rich Text, etc.",
    BuilderAddTextSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_text");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddTextSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "text", settings, position);
        return mcpSuccess({ post_id, widget_type: "text", message: `Text added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_text");
      }
    },
  );

  // 3. Image
  server.tool(
    "wp_builder_add_image",
    "Add an image widget via the active page builder. Converts to Elementor Image widget, Divi Image Module, Bricks Image element, etc.",
    BuilderAddImageSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_image");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddImageSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "image", settings, position);
        return mcpSuccess({ post_id, widget_type: "image", message: `Image added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_image");
      }
    },
  );

  // 4. Button
  server.tool(
    "wp_builder_add_button",
    "Add a button widget via the active page builder. Converts to Elementor Button, Divi Button Module, Bricks Button element, etc.",
    BuilderAddButtonSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_button");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddButtonSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "button", settings, position);
        return mcpSuccess({ post_id, widget_type: "button", message: `Button added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_button");
      }
    },
  );

  // 5. Video
  server.tool(
    "wp_builder_add_video",
    "Add a video embed widget via the active page builder. Supports YouTube, Vimeo, and self-hosted videos.",
    BuilderAddVideoSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_video");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddVideoSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "video", settings, position);
        return mcpSuccess({ post_id, widget_type: "video", message: `Video added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_video");
      }
    },
  );

  // 6. Section / Container
  server.tool(
    "wp_builder_add_section",
    "Add a new section or container via the active page builder. Creates an Elementor Section, Divi Section/Row, Bricks Container, etc.",
    BuilderAddSectionSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_section");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddSectionSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "section", settings, position);
        return mcpSuccess({ post_id, widget_type: "section", message: `Section added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_section");
      }
    },
  );

  // 7. Divider / Separator
  server.tool(
    "wp_builder_add_divider",
    "Add a divider/separator widget via the active page builder.",
    BuilderAddDividerSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_divider");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddDividerSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "divider", settings, position);
        return mcpSuccess({ post_id, widget_type: "divider", message: `Divider added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_divider");
      }
    },
  );

  // 8. Spacer
  server.tool(
    "wp_builder_add_spacer",
    "Add vertical space via the active page builder.",
    BuilderAddSpacerSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_spacer");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddSpacerSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "spacer", settings, position);
        return mcpSuccess({ post_id, widget_type: "spacer", message: `Spacer (${settings.height}px) added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_spacer");
      }
    },
  );

  // 9. Icon
  server.tool(
    "wp_builder_add_icon",
    "Add an icon widget via the active page builder. Supports Font Awesome, Dashicons, or SVG markup depending on the builder.",
    BuilderAddIconSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_icon");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddIconSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "icon", settings, position);
        return mcpSuccess({ post_id, widget_type: "icon", message: `Icon added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_icon");
      }
    },
  );

  // 10. Form
  server.tool(
    "wp_builder_add_form",
    "Add a contact form widget via the active page builder. Generates a form using the builder's native form widget.",
    BuilderAddFormSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_form");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddFormSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "form", settings, position);
        return mcpSuccess({ post_id, widget_type: "form", message: `Form added to post ${post_id}`, result });
      } catch (e) {
        return mcpError(e, "wp_builder_add_form");
      }
    },
  );

  // 11. Gallery
  server.tool(
    "wp_builder_add_gallery",
    "Add an image gallery widget via the active page builder.",
    BuilderAddGallerySchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_gallery");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddGallerySchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "gallery", settings, position);
        return mcpSuccess({
          post_id,
          widget_type: "gallery",
          image_count: settings.image_urls.length,
          message: `Gallery (${settings.image_urls.length} images) added to post ${post_id}`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_builder_add_gallery");
      }
    },
  );

  // 12. Slider / Carousel
  server.tool(
    "wp_builder_add_slider",
    "Add a slider/carousel widget via the active page builder. Creates an image or content slider with autoplay, arrows, and dots.",
    BuilderAddSliderSchema.shape,
    async (params) => {
      try {
        const guard = await requirePlugin(pluginClient, "wp_builder_add_slider");
        if (guard) return guard;

        const { post_id, position, ...settings } = BuilderAddSliderSchema.parse(params);
        const result = await pluginClient.addBuilderWidget(post_id, "slider", settings, position);
        return mcpSuccess({
          post_id,
          widget_type: "slider",
          slide_count: settings.slides.length,
          message: `Slider (${settings.slides.length} slides) added to post ${post_id}`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_builder_add_slider");
      }
    },
  );
}
