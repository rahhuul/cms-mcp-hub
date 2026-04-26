/**
 * Gutenberg Block Editor tools — build block content, create structured posts,
 * landing pages, pattern categories, URL details, site export, font collections.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  BuildBlockContentSchema, CreateBlockPostSchema, CreateLandingPageSchema,
  ListPatternCategoriesSchema, GetPatternCategorySchema, CreatePatternCategorySchema, UpdatePatternCategorySchema, DeletePatternCategorySchema,
  GetUrlDetailsSchema, GetNavigationFallbackSchema, ExportSiteSchema,
  ListFontCollectionsSchema, GetFontCollectionSchema, DetectPageBuilderSchema, RenderWidgetTypeSchema,
} from "../schemas/index.js";

// ─── Block markup generator ────────────────────────────────────────
interface BlockDef {
  type: string;
  content?: string;
  level?: number;
  url?: string;
  alt?: string;
  caption?: string;
  ordered?: boolean;
  items?: string[];
  language?: string;
  columns?: number;
  align?: string;
  className?: string;
}

function blockToMarkup(block: BlockDef): string {
  const align = block.align ? ` "align":"${block.align}"` : "";
  const cls = block.className ? ` "className":"${block.className}"` : "";
  const attrs = (align || cls) ? ` {${[align, cls].filter(Boolean).join(",")}}` : "";

  switch (block.type) {
    case "heading": {
      const lvl = block.level || 2;
      return `<!-- wp:heading {"level":${lvl}${align ? "," + align : ""}} -->\n<h${lvl} class="wp-block-heading">${block.content || ""}</h${lvl}>\n<!-- /wp:heading -->`;
    }
    case "paragraph":
      return `<!-- wp:paragraph${attrs} -->\n<p>${block.content || ""}</p>\n<!-- /wp:paragraph -->`;
    case "image":
      return `<!-- wp:image {"url":"${block.url || ""}","alt":"${block.alt || ""}"} -->\n<figure class="wp-block-image"><img src="${block.url || ""}" alt="${block.alt || ""}"/>${block.caption ? `<figcaption class="wp-element-caption">${block.caption}</figcaption>` : ""}</figure>\n<!-- /wp:image -->`;
    case "list": {
      const tag = block.ordered ? "ol" : "ul";
      const items = (block.items || []).map((i) => `<!-- wp:list-item -->\n<li>${i}</li>\n<!-- /wp:list-item -->`).join("\n");
      return `<!-- wp:list ${block.ordered ? '{"ordered":true}' : ""} -->\n<${tag}>${items}</${tag}>\n<!-- /wp:list -->`;
    }
    case "quote":
      return `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${block.content || ""}</p>${block.caption ? `<cite>${block.caption}</cite>` : ""}</blockquote>\n<!-- /wp:quote -->`;
    case "code":
      return `<!-- wp:code -->\n<pre class="wp-block-code"><code${block.language ? ` lang="${block.language}"` : ""}>${block.content || ""}</code></pre>\n<!-- /wp:code -->`;
    case "separator":
      return `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->`;
    case "spacer":
      return `<!-- wp:spacer -->\n<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->`;
    case "table":
      return `<!-- wp:table -->\n<figure class="wp-block-table"><table><tbody>${block.content || ""}</tbody></table></figure>\n<!-- /wp:table -->`;
    case "video":
      return `<!-- wp:video -->\n<figure class="wp-block-video"><video controls src="${block.url || ""}"></video>${block.caption ? `<figcaption class="wp-element-caption">${block.caption}</figcaption>` : ""}</figure>\n<!-- /wp:video -->`;
    case "audio":
      return `<!-- wp:audio -->\n<figure class="wp-block-audio"><audio controls src="${block.url || ""}"></audio></figure>\n<!-- /wp:audio -->`;
    case "cover":
      return `<!-- wp:cover {"url":"${block.url || ""}","dimRatio":50} -->\n<div class="wp-block-cover"><span class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background" src="${block.url || ""}" alt=""/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${block.content || ""}</p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover -->`;
    case "gallery": {
      const cols = block.columns || 3;
      return `<!-- wp:gallery {"columns":${cols},"linkTo":"none"} -->\n<figure class="wp-block-gallery has-nested-images columns-${cols}">${block.content || ""}</figure>\n<!-- /wp:gallery -->`;
    }
    case "pullquote":
      return `<!-- wp:pullquote -->\n<figure class="wp-block-pullquote"><blockquote><p>${block.content || ""}</p>${block.caption ? `<cite>${block.caption}</cite>` : ""}</blockquote></figure>\n<!-- /wp:pullquote -->`;
    case "preformatted":
      return `<!-- wp:preformatted -->\n<pre class="wp-block-preformatted">${block.content || ""}</pre>\n<!-- /wp:preformatted -->`;
    case "html":
      return `<!-- wp:html -->\n${block.content || ""}\n<!-- /wp:html -->`;
    case "buttons":
      return `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"${block.url ? ` href="${block.url}"` : ""}>${block.content || "Click here"}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
    case "columns": {
      const cols = block.columns || 2;
      const colBlocks = Array.from({ length: cols }, () => `<!-- wp:column -->\n<div class="wp-block-column"><!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column -->`).join("\n");
      return `<!-- wp:columns -->\n<div class="wp-block-columns">${colBlocks}</div>\n<!-- /wp:columns -->`;
    }
    case "group":
      return `<!-- wp:group -->\n<div class="wp-block-group">${block.content || ""}</div>\n<!-- /wp:group -->`;
    default:
      return `<!-- wp:paragraph -->\n<p>${block.content || ""}</p>\n<!-- /wp:paragraph -->`;
  }
}

function blocksToContent(blocks: BlockDef[]): string {
  return blocks.map(blockToMarkup).join("\n\n");
}

export function registerBlockEditorTools(server: McpServer, client: WpClient): void {

  // ─── Block Content Builder ───────────────────────────────────────
  server.tool("wp_build_block_content",
    "Convert a list of blocks into WordPress Gutenberg block markup. Supports heading, paragraph, image, list, quote, code, columns, separator, spacer, table, video, audio, cover, gallery, pullquote, buttons, group, and html blocks.",
    BuildBlockContentSchema.shape, async (params) => {
    try {
      const { blocks } = BuildBlockContentSchema.parse(params);
      const content = blocksToContent(blocks);
      return mcpSuccess({ content, block_count: blocks.length, message: "Block content generated. Use this as the 'content' field when creating posts/pages." });
    } catch (e) { return mcpError(e, "wp_build_block_content"); }
  });

  // ─── Create Block Post ───────────────────────────────────────────
  server.tool("wp_create_block_post",
    "Create a WordPress post with properly structured Gutenberg blocks. Define each block (heading, paragraph, image, list, quote, code, etc.) and the post is created with correct block markup.",
    CreateBlockPostSchema.shape, async (params) => {
    try {
      const { blocks, title, status, categories, tags, featured_media, excerpt } = CreateBlockPostSchema.parse(params);
      const content = blocksToContent(blocks);

      const postData: Record<string, unknown> = { title, content, status };
      if (categories) postData["categories"] = categories;
      if (tags) postData["tags"] = tags;
      if (featured_media) postData["featured_media"] = featured_media;
      if (excerpt) postData["excerpt"] = excerpt;

      const post = await client.post<Record<string, unknown>>("posts", postData);
      return mcpSuccess({
        id: post["id"], slug: post["slug"], status: post["status"], link: post["link"],
        block_count: blocks.length,
        message: `Post created with ${blocks.length} blocks (ID: ${post["id"]})`,
      });
    } catch (e) { return mcpError(e, "wp_create_block_post"); }
  });

  // ─── Create Landing Page ─────────────────────────────────────────
  server.tool("wp_create_landing_page",
    "Create a complete landing page with hero section, feature columns, testimonial, and closing CTA — all using proper Gutenberg blocks.",
    CreateLandingPageSchema.shape, async (params) => {
    try {
      const v = CreateLandingPageSchema.parse(params);
      const blocks: BlockDef[] = [];

      // Hero section
      if (v.hero_image_url) {
        blocks.push({ type: "cover", url: v.hero_image_url, content: v.hero_heading });
      } else {
        blocks.push({ type: "heading", content: v.hero_heading, level: 1, align: "center" });
      }
      blocks.push({ type: "paragraph", content: v.hero_text, align: "center" });

      if (v.hero_cta_text) {
        blocks.push({ type: "buttons", content: v.hero_cta_text, url: v.hero_cta_url || "#" });
      }

      blocks.push({ type: "separator" });

      // Features section
      if (v.features && v.features.length > 0) {
        blocks.push({ type: "heading", content: "Features", level: 2, align: "center" });
        for (const f of v.features) {
          blocks.push({ type: "heading", content: f.title, level: 3 });
          blocks.push({ type: "paragraph", content: f.description });
        }
        blocks.push({ type: "separator" });
      }

      // Testimonial
      if (v.testimonial_quote) {
        blocks.push({ type: "pullquote", content: v.testimonial_quote, caption: v.testimonial_author });
        blocks.push({ type: "separator" });
      }

      // Closing
      if (v.closing_heading) {
        blocks.push({ type: "heading", content: v.closing_heading, level: 2, align: "center" });
      }
      if (v.closing_text) {
        blocks.push({ type: "paragraph", content: v.closing_text, align: "center" });
      }

      const content = blocksToContent(blocks);
      const page = await client.post<Record<string, unknown>>("pages", {
        title: v.title, content, status: v.status,
      });

      return mcpSuccess({
        id: page["id"], slug: page["slug"], status: page["status"], link: page["link"],
        block_count: blocks.length,
        message: `Landing page created with ${blocks.length} blocks (ID: ${page["id"]})`,
      });
    } catch (e) { return mcpError(e, "wp_create_landing_page"); }
  });

  // ─── Pattern Categories ──────────────────────────────────────────
  server.tool("wp_list_pattern_categories", "List block pattern categories.", ListPatternCategoriesSchema.shape, async (p) => {
    try { const { page, per_page } = ListPatternCategoriesSchema.parse(p); return mcpSuccess(await client.list("wp_pattern_category", {}, page, per_page)); }
    catch (e) { return mcpError(e, "wp_list_pattern_categories"); }
  });
  server.tool("wp_get_pattern_category", "Get a pattern category.", GetPatternCategorySchema.shape, async (p) => {
    try { return mcpSuccess(await client.get(`wp_pattern_category/${GetPatternCategorySchema.parse(p).id}`)); }
    catch (e) { return mcpError(e, "wp_get_pattern_category"); }
  });
  server.tool("wp_create_pattern_category", "Create a block pattern category.", CreatePatternCategorySchema.shape, async (p) => {
    try { const v = CreatePatternCategorySchema.parse(p); const c = await client.post<Record<string, unknown>>("wp_pattern_category", v); return mcpSuccess({ id: c["id"], name: c["name"], message: "Pattern category created" }); }
    catch (e) { return mcpError(e, "wp_create_pattern_category"); }
  });
  server.tool("wp_update_pattern_category", "Update a pattern category.", UpdatePatternCategorySchema.shape, async (p) => {
    try { const { id, ...d } = UpdatePatternCategorySchema.parse(p); await client.put(`wp_pattern_category/${id}`, d); return mcpSuccess({ message: `Pattern category ${id} updated` }); }
    catch (e) { return mcpError(e, "wp_update_pattern_category"); }
  });
  server.tool("wp_delete_pattern_category", "Delete a pattern category.", DeletePatternCategorySchema.shape, async (p) => {
    try { const { id, force } = DeletePatternCategorySchema.parse(p); await client.del(`wp_pattern_category/${id}`, { force }); return mcpSuccess({ message: `Pattern category ${id} deleted` }); }
    catch (e) { return mcpError(e, "wp_delete_pattern_category"); }
  });

  // ─── Block Editor API endpoints ──────────────────────────────────
  server.tool("wp_get_url_details", "Fetch URL preview details (title, icon, description) — used for embedding URLs in the block editor.", GetUrlDetailsSchema.shape, async (p) => {
    try {
      const { url } = GetUrlDetailsSchema.parse(p);
      // Use the wp-block-editor namespace
      const baseUrl = (client as unknown as Record<string, unknown>)["baseUrl"] as string || "";
      const editorUrl = baseUrl.replace("/wp/v2", "/wp-block-editor/v1");
      return mcpSuccess(await client.get(`${editorUrl}/url-details`, { url }));
    } catch (e) { return mcpError(e, "wp_get_url_details"); }
  });

  server.tool("wp_get_navigation_fallback", "Get the default/fallback navigation menu for the site.", GetNavigationFallbackSchema.shape, async () => {
    try {
      const baseUrl = (client as unknown as Record<string, unknown>)["baseUrl"] as string || "";
      const editorUrl = baseUrl.replace("/wp/v2", "/wp-block-editor/v1");
      return mcpSuccess(await client.get(`${editorUrl}/navigation-fallback`));
    } catch (e) { return mcpError(e, "wp_get_navigation_fallback"); }
  });

  server.tool("wp_export_site", "Export the entire WordPress site as a downloadable archive.", ExportSiteSchema.shape, async () => {
    try {
      const baseUrl = (client as unknown as Record<string, unknown>)["baseUrl"] as string || "";
      const editorUrl = baseUrl.replace("/wp/v2", "/wp-block-editor/v1");
      return mcpSuccess(await client.get(`${editorUrl}/export`));
    } catch (e) { return mcpError(e, "wp_export_site"); }
  });

  // ─── Font Collections ────────────────────────────────────────────
  server.tool("wp_list_font_collections", "Browse available font collections (Google Fonts, etc.).", ListFontCollectionsSchema.shape, async () => {
    try { return mcpSuccess(await client.get("font-collections")); }
    catch (e) { return mcpError(e, "wp_list_font_collections"); }
  });
  server.tool("wp_get_font_collection", "Get fonts from a specific collection.", GetFontCollectionSchema.shape, async (p) => {
    try { return mcpSuccess(await client.get(`font-collections/${GetFontCollectionSchema.parse(p).slug}`)); }
    catch (e) { return mcpError(e, "wp_get_font_collection"); }
  });

  // ─── Page Builder Detection ──────────────────────────────────────
  server.tool("wp_detect_page_builder", "Detect which editor/page builder was used for a post (Gutenberg, Elementor, Divi, Classic). Reads post meta to identify the builder.", DetectPageBuilderSchema.shape, async (p) => {
    try {
      const { post_id, post_type } = DetectPageBuilderSchema.parse(p);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`, { context: "edit" });
      const content = ((post["content"] as Record<string, unknown>)?.["raw"] as string) || "";
      const meta = (post["meta"] as Record<string, unknown>) || {};

      let builder = "classic";
      if (content.includes("<!-- wp:")) builder = "gutenberg";
      if (meta["_elementor_data"] || meta["_elementor_edit_mode"]) builder = "elementor";
      if (content.includes("[et_pb_")) builder = "divi";
      if (content.includes("[vc_row") || content.includes("[vc_column")) builder = "wpbakery";
      if (content.includes("<!-- oxygen")) builder = "oxygen";
      if (meta["_bricks_page_content_2"]) builder = "bricks";
      if (content.includes("[fl_builder")) builder = "beaver-builder";

      const blockCount = builder === "gutenberg" ? (content.match(/<!-- wp:/g) || []).length : 0;

      return mcpSuccess({
        builder,
        block_count: blockCount,
        has_elementor_data: !!meta["_elementor_data"],
        content_length: content.length,
        message: `Post built with: ${builder}${blockCount ? ` (${blockCount} blocks)` : ""}`,
      });
    } catch (e) { return mcpError(e, "wp_detect_page_builder"); }
  });

  // ─── Widget Type Render ──────────────────────────────────────────
  server.tool("wp_render_widget_type", "Server-side render a widget type with given settings.", RenderWidgetTypeSchema.shape, async (p) => {
    try {
      const { id, instance } = RenderWidgetTypeSchema.parse(p);
      return mcpSuccess(await client.post(`widget-types/${id}/render`, { instance }));
    } catch (e) { return mcpError(e, "wp_render_widget_type"); }
  });
}
