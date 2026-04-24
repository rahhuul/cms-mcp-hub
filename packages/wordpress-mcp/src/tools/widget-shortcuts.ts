/**
 * Widget Shortcuts — 15 one-liner tools that append a single Gutenberg block
 * to an existing post or page.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  AddHeadingSchema, AddParagraphSchema, AddImageSchema, AddButtonSchema,
  AddListSchema, AddQuoteSchema, AddCodeSchema, AddTableSchema,
  AddSeparatorSchema, AddSpacerSchema, AddColumnsSchema, AddGallerySchema,
  AddVideoSchema, AddEmbedSchema, AddHtmlSchema,
} from "../schemas/index.js";

// ─── HTML escaping ────────────────────────────────────────────────────

const ESC_MAP: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function esc(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESC_MAP[ch] ?? ch);
}

// ─── Shared helper: fetch post, append block, save ────────────────────

interface PostContent {
  content: { rendered: string; raw?: string };
}

async function appendBlockToPost(
  client: WpClient,
  postId: number,
  postType: string,
  blockHtml: string,
): Promise<unknown> {
  const post = await client.get<PostContent>(`${postType}/${postId}`, { context: "edit" });
  const currentContent = post.content.raw ?? post.content.rendered ?? "";
  const newContent = currentContent + "\n\n" + blockHtml;
  return client.put(`${postType}/${postId}`, { content: newContent });
}

// ─── Registration ─────────────────────────────────────────────────────

export function registerWidgetShortcutTools(server: McpServer, client: WpClient): void {

  // 1. Heading
  server.tool("wp_add_heading",
    "Append a heading block (h1-h6) to an existing post or page.",
    AddHeadingSchema.shape, async (params) => {
    try {
      const { post_id, post_type, text, level } = AddHeadingSchema.parse(params);
      const safe = esc(text);
      const block = `<!-- wp:heading {"level":${level}} -->\n<h${level} class="wp-block-heading">${safe}</h${level}>\n<!-- /wp:heading -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "heading", level, message: `Heading (h${level}) appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_heading"); }
  });

  // 2. Paragraph
  server.tool("wp_add_paragraph",
    "Append a paragraph block to an existing post or page.",
    AddParagraphSchema.shape, async (params) => {
    try {
      const { post_id, post_type, text } = AddParagraphSchema.parse(params);
      const safe = esc(text);
      const block = `<!-- wp:paragraph -->\n<p>${safe}</p>\n<!-- /wp:paragraph -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "paragraph", message: `Paragraph appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_paragraph"); }
  });

  // 3. Image
  server.tool("wp_add_image",
    "Append an image block to an existing post or page.",
    AddImageSchema.shape, async (params) => {
    try {
      const { post_id, post_type, url, alt, caption } = AddImageSchema.parse(params);
      const safeAlt = esc(alt);
      const captionHtml = caption ? `<figcaption class="wp-element-caption">${esc(caption)}</figcaption>` : "";
      const block = `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${esc(url)}" alt="${safeAlt}"/>${captionHtml}</figure>\n<!-- /wp:image -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "image", message: `Image appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_image"); }
  });

  // 4. Button
  server.tool("wp_add_button",
    "Append a button block to an existing post or page.",
    AddButtonSchema.shape, async (params) => {
    try {
      const { post_id, post_type, text, url } = AddButtonSchema.parse(params);
      const block = `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${esc(url)}">${esc(text)}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "button", message: `Button appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_button"); }
  });

  // 5. List
  server.tool("wp_add_list",
    "Append an ordered or unordered list block to an existing post or page.",
    AddListSchema.shape, async (params) => {
    try {
      const { post_id, post_type, items, ordered } = AddListSchema.parse(params);
      const tag = ordered ? "ol" : "ul";
      const listItems = items.map((i) => `<!-- wp:list-item -->\n<li>${esc(i)}</li>\n<!-- /wp:list-item -->`).join("\n");
      const attrs = ordered ? ' {"ordered":true}' : "";
      const block = `<!-- wp:list${attrs} -->\n<${tag}>${listItems}</${tag}>\n<!-- /wp:list -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "list", item_count: items.length, message: `List (${items.length} items) appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_list"); }
  });

  // 6. Quote
  server.tool("wp_add_quote",
    "Append a blockquote to an existing post or page.",
    AddQuoteSchema.shape, async (params) => {
    try {
      const { post_id, post_type, text, citation } = AddQuoteSchema.parse(params);
      const citeHtml = citation ? `<cite>${esc(citation)}</cite>` : "";
      const block = `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${esc(text)}</p>${citeHtml}</blockquote>\n<!-- /wp:quote -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "quote", message: `Quote appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_quote"); }
  });

  // 7. Code
  server.tool("wp_add_code",
    "Append a code block to an existing post or page.",
    AddCodeSchema.shape, async (params) => {
    try {
      const { post_id, post_type, code, language } = AddCodeSchema.parse(params);
      const langAttr = language ? ` lang="${esc(language)}"` : "";
      const block = `<!-- wp:code -->\n<pre class="wp-block-code"><code${langAttr}>${esc(code)}</code></pre>\n<!-- /wp:code -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "code", message: `Code block appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_code"); }
  });

  // 8. Table
  server.tool("wp_add_table",
    "Append a table block to an existing post or page.",
    AddTableSchema.shape, async (params) => {
    try {
      const { post_id, post_type, headers, rows } = AddTableSchema.parse(params);
      const thead = `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      const block = `<!-- wp:table -->\n<figure class="wp-block-table"><table>${thead}${tbody}</table></figure>\n<!-- /wp:table -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "table", rows: rows.length, columns: headers.length, message: `Table (${headers.length}x${rows.length}) appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_table"); }
  });

  // 9. Separator
  server.tool("wp_add_separator",
    "Append a horizontal rule / divider to an existing post or page.",
    AddSeparatorSchema.shape, async (params) => {
    try {
      const { post_id, post_type, style } = AddSeparatorSchema.parse(params);
      const classMap: Record<string, string> = {
        default: "wp-block-separator has-alpha-channel-opacity",
        wide: "wp-block-separator has-alpha-channel-opacity is-style-wide",
        dots: "wp-block-separator has-alpha-channel-opacity is-style-dots",
      };
      const cls = classMap[style] ?? classMap["default"];
      const block = `<!-- wp:separator -->\n<hr class="${cls}"/>\n<!-- /wp:separator -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "separator", style, message: `Separator appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_separator"); }
  });

  // 10. Spacer
  server.tool("wp_add_spacer",
    "Append vertical space to an existing post or page.",
    AddSpacerSchema.shape, async (params) => {
    try {
      const { post_id, post_type, height } = AddSpacerSchema.parse(params);
      const block = `<!-- wp:spacer {"height":"${height}px"} -->\n<div style="height:${height}px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "spacer", height, message: `Spacer (${height}px) appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_spacer"); }
  });

  // 11. Columns
  server.tool("wp_add_columns",
    "Append a multi-column layout to an existing post or page.",
    AddColumnsSchema.shape, async (params) => {
    try {
      const { post_id, post_type, count, content } = AddColumnsSchema.parse(params);
      const colBlocks = Array.from({ length: count }, (_, i) => {
        const text = content[i] ? esc(content[i]) : "";
        return `<!-- wp:column -->\n<div class="wp-block-column"><!-- wp:paragraph -->\n<p>${text}</p>\n<!-- /wp:paragraph --></div>\n<!-- /wp:column -->`;
      }).join("\n");
      const block = `<!-- wp:columns -->\n<div class="wp-block-columns">${colBlocks}</div>\n<!-- /wp:columns -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "columns", count, message: `${count}-column layout appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_columns"); }
  });

  // 12. Gallery
  server.tool("wp_add_gallery",
    "Append an image gallery to an existing post or page.",
    AddGallerySchema.shape, async (params) => {
    try {
      const { post_id, post_type, image_urls, columns } = AddGallerySchema.parse(params);
      const images = image_urls.map((u) =>
        `<!-- wp:image -->\n<figure class="wp-block-image"><img src="${esc(u)}" alt=""/></figure>\n<!-- /wp:image -->`
      ).join("\n");
      const block = `<!-- wp:gallery {"columns":${columns},"linkTo":"none"} -->\n<figure class="wp-block-gallery has-nested-images columns-${columns}">${images}</figure>\n<!-- /wp:gallery -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "gallery", image_count: image_urls.length, columns, message: `Gallery (${image_urls.length} images) appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_gallery"); }
  });

  // 13. Video
  server.tool("wp_add_video",
    "Append a video embed block to an existing post or page.",
    AddVideoSchema.shape, async (params) => {
    try {
      const { post_id, post_type, url } = AddVideoSchema.parse(params);
      const block = `<!-- wp:embed {"url":"${esc(url)}","type":"video"} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">${esc(url)}</div></figure>\n<!-- /wp:embed -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "video", message: `Video embed appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_video"); }
  });

  // 14. Embed
  server.tool("wp_add_embed",
    "Append any embed (YouTube, Twitter, etc.) to an existing post or page.",
    AddEmbedSchema.shape, async (params) => {
    try {
      const { post_id, post_type, url } = AddEmbedSchema.parse(params);
      const block = `<!-- wp:embed {"url":"${esc(url)}"} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">${esc(url)}</div></figure>\n<!-- /wp:embed -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "embed", message: `Embed appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_embed"); }
  });

  // 15. Custom HTML
  server.tool("wp_add_html",
    "Append a custom HTML block to an existing post or page.",
    AddHtmlSchema.shape, async (params) => {
    try {
      const { post_id, post_type, html } = AddHtmlSchema.parse(params);
      // Custom HTML is intentionally NOT escaped — user provides raw HTML
      const block = `<!-- wp:html -->\n${html}\n<!-- /wp:html -->`;
      await appendBlockToPost(client, post_id, post_type, block);
      return mcpSuccess({ post_id, block_type: "html", message: `Custom HTML block appended to ${post_type}/${post_id}` });
    } catch (e) { return mcpError(e, "wp_add_html"); }
  });
}
