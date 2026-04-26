/**
 * Page Builder tools — declarative page building, HTML-to-blocks conversion,
 * and page structure analysis for Gutenberg.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  BuildPageSchema,
  ConvertHtmlToBlocksSchema,
  GetPageStructureSchema,
} from "../schemas/index.js";

// ─── Types ─────────────────────────────────────────────────────────

interface BlockDefinition {
  type: string;
  attrs: Record<string, unknown>;
  children?: BlockDefinition[];
}

interface ConversionStats {
  converted: number;
  preserved_as_html: number;
  elements_processed: number;
}

// ─── Escape helper ─────────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Light escape for attribute values inside JSON block comments */
function escapeAttr(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

// ─── Block definition → Gutenberg HTML ─────────────────────────────

function blockDefToHtml(block: BlockDefinition): string {
  const a = block.attrs || {};

  switch (block.type) {
    case "heading": {
      const level = (typeof a["level"] === "number" ? a["level"] : 2) as number;
      const content = String(a["content"] || "");
      return `<!-- wp:heading {"level":${level}} -->\n<h${level} class="wp-block-heading">${content}</h${level}>\n<!-- /wp:heading -->`;
    }

    case "paragraph": {
      const content = String(a["content"] || "");
      const align = a["align"] ? ` {"align":"${escapeAttr(String(a["align"]))}"` + "}" : "";
      const alignClass = a["align"] ? ` class="has-text-align-${a["align"]}"` : "";
      return `<!-- wp:paragraph${align} -->\n<p${alignClass}>${content}</p>\n<!-- /wp:paragraph -->`;
    }

    case "image": {
      const url = String(a["url"] || "");
      const alt = String(a["alt"] || "");
      const caption = a["caption"] ? String(a["caption"]) : "";
      return `<!-- wp:image {"url":"${escapeAttr(url)}","alt":"${escapeAttr(alt)}"} -->\n<figure class="wp-block-image"><img src="${url}" alt="${alt}"/>${caption ? `<figcaption class="wp-element-caption">${caption}</figcaption>` : ""}</figure>\n<!-- /wp:image -->`;
    }

    case "button": {
      const text = String(a["text"] || a["content"] || "Click here");
      const url = String(a["url"] || "#");
      return `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${url}">${text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
    }

    case "columns": {
      const count = (typeof a["count"] === "number" ? a["count"] : 2) as number;
      const children = block.children || [];
      const colBlocks: string[] = [];
      for (let i = 0; i < count; i++) {
        const child = children[i];
        const inner = child ? blockDefToHtml(child) : `<!-- wp:paragraph -->\n<p></p>\n<!-- /wp:paragraph -->`;
        colBlocks.push(`<!-- wp:column -->\n<div class="wp-block-column">${inner}</div>\n<!-- /wp:column -->`);
      }
      return `<!-- wp:columns -->\n<div class="wp-block-columns">${colBlocks.join("\n")}</div>\n<!-- /wp:columns -->`;
    }

    case "list": {
      const items = (Array.isArray(a["items"]) ? a["items"] : []) as string[];
      const ordered = a["ordered"] === true;
      const tag = ordered ? "ol" : "ul";
      const listItems = items
        .map((item) => `<!-- wp:list-item -->\n<li>${String(item)}</li>\n<!-- /wp:list-item -->`)
        .join("\n");
      return `<!-- wp:list ${ordered ? '{"ordered":true} ' : ""}-->\n<${tag}>${listItems}</${tag}>\n<!-- /wp:list -->`;
    }

    case "quote": {
      const text = String(a["text"] || a["content"] || "");
      const citation = a["citation"] ? String(a["citation"]) : "";
      return `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${text}</p>${citation ? `<cite>${citation}</cite>` : ""}</blockquote>\n<!-- /wp:quote -->`;
    }

    case "code": {
      const content = escapeHtml(String(a["content"] || ""));
      const lang = a["language"] ? ` lang="${escapeAttr(String(a["language"]))}"` : "";
      return `<!-- wp:code -->\n<pre class="wp-block-code"><code${lang}>${content}</code></pre>\n<!-- /wp:code -->`;
    }

    case "separator":
      return `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->`;

    case "spacer": {
      const height = typeof a["height"] === "number" ? a["height"] : 40;
      return `<!-- wp:spacer {"height":"${height}px"} -->\n<div style="height:${height}px" aria-hidden="true" class="wp-block-spacer"></div>\n<!-- /wp:spacer -->`;
    }

    case "html": {
      const content = String(a["content"] || "");
      return `<!-- wp:html -->\n${content}\n<!-- /wp:html -->`;
    }

    case "embed": {
      const url = String(a["url"] || "");
      return `<!-- wp:embed {"url":"${escapeAttr(url)}"} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">\n${url}\n</div></figure>\n<!-- /wp:embed -->`;
    }

    case "group": {
      const align = a["align"] ? `,"align":"${escapeAttr(String(a["align"]))}"` : "";
      const children = block.children || [];
      const inner = children.map(blockDefToHtml).join("\n\n");
      return `<!-- wp:group {"layout":{"type":"constrained"}${align}} -->\n<div class="wp-block-group${a["align"] ? ` align${a["align"]}` : ""}">${inner}</div>\n<!-- /wp:group -->`;
    }

    case "cover": {
      const url = String(a["url"] || "");
      const text = String(a["text"] || a["content"] || "");
      return `<!-- wp:cover {"url":"${escapeAttr(url)}","dimRatio":50} -->\n<div class="wp-block-cover"><span class="wp-block-cover__background has-background-dim"></span><img class="wp-block-cover__image-background" src="${url}" alt=""/><div class="wp-block-cover__inner-container"><!-- wp:paragraph {"align":"center"} -->\n<p class="has-text-align-center">${text}</p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover -->`;
    }

    default:
      // Unknown type — render as paragraph with content
      return `<!-- wp:paragraph -->\n<p>${String(a["content"] || "")}</p>\n<!-- /wp:paragraph -->`;
  }
}

// ─── HTML → Gutenberg blocks converter ─────────────────────────────

/**
 * Split raw HTML into top-level elements using regex.
 * Handles self-closing tags, comments, and nested elements.
 */
function splitTopLevelElements(html: string): string[] {
  const elements: string[] = [];
  let remaining = html.trim();

  while (remaining.length > 0) {
    remaining = remaining.trimStart();
    if (remaining.length === 0) break;

    // HTML comment
    if (remaining.startsWith("<!--")) {
      const end = remaining.indexOf("-->", 4);
      if (end !== -1) {
        elements.push(remaining.slice(0, end + 3));
        remaining = remaining.slice(end + 3);
        continue;
      }
    }

    // Self-closing tags: <hr/>, <br/>, <img ... />
    const selfClose = remaining.match(/^<(hr|br|img|input|meta|link)\b[^>]*\/?>/i);
    if (selfClose) {
      elements.push(selfClose[0]);
      remaining = remaining.slice(selfClose[0].length);
      continue;
    }

    // Opening tag
    const openMatch = remaining.match(/^<([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/);
    if (openMatch) {
      const tagName = openMatch[1]!.toLowerCase();
      // Find the matching closing tag, accounting for nesting
      let depth = 1;
      let pos = openMatch[0].length;
      const openPattern = new RegExp(`<${tagName}\\b[^>]*>`, "gi");
      const closePattern = new RegExp(`</${tagName}>`, "gi");

      while (depth > 0 && pos < remaining.length) {
        // Search for next open or close of same tag
        openPattern.lastIndex = pos;
        closePattern.lastIndex = pos;
        const nextOpen = openPattern.exec(remaining);
        const nextClose = closePattern.exec(remaining);

        if (!nextClose) {
          // No closing tag found — take rest as element
          pos = remaining.length;
          break;
        }

        if (nextOpen && nextOpen.index < nextClose.index) {
          depth++;
          pos = nextOpen.index + nextOpen[0].length;
        } else {
          depth--;
          pos = nextClose.index + nextClose[0].length;
        }
      }

      elements.push(remaining.slice(0, pos));
      remaining = remaining.slice(pos);
      continue;
    }

    // Plain text until next tag
    const nextTag = remaining.indexOf("<");
    if (nextTag > 0) {
      const text = remaining.slice(0, nextTag).trim();
      if (text) elements.push(text);
      remaining = remaining.slice(nextTag);
    } else if (nextTag === -1) {
      // No more tags — remaining is text
      const text = remaining.trim();
      if (text) elements.push(text);
      break;
    } else {
      // nextTag === 0 but didn't match above patterns — skip one char to avoid infinite loop
      elements.push(remaining.slice(0, 1));
      remaining = remaining.slice(1);
    }
  }

  return elements;
}

function convertElementToBlock(element: string, stats: ConversionStats): string {
  const el = element.trim();
  if (!el) return "";

  stats.elements_processed++;

  // Heading: <h1>...<h6>
  const headingMatch = el.match(/^<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>$/i);
  if (headingMatch) {
    const level = parseInt(headingMatch[1]!, 10);
    const content = headingMatch[2]!.trim();
    stats.converted++;
    return `<!-- wp:heading {"level":${level}} -->\n<h${level} class="wp-block-heading">${content}</h${level}>\n<!-- /wp:heading -->`;
  }

  // Paragraph: <p>
  const pMatch = el.match(/^<p\b[^>]*>([\s\S]*?)<\/p>$/i);
  if (pMatch) {
    const content = pMatch[1]!.trim();
    stats.converted++;
    return `<!-- wp:paragraph -->\n<p>${content}</p>\n<!-- /wp:paragraph -->`;
  }

  // Image: <img>
  const imgMatch = el.match(/^<img\b[^>]*\/?>/i);
  if (imgMatch) {
    const src = (el.match(/src=["']([^"']*)["']/i) || [])[1] || "";
    const alt = (el.match(/alt=["']([^"']*)["']/i) || [])[1] || "";
    stats.converted++;
    return `<!-- wp:image {"url":"${escapeAttr(src)}","alt":"${escapeAttr(alt)}"} -->\n<figure class="wp-block-image"><img src="${src}" alt="${alt}"/></figure>\n<!-- /wp:image -->`;
  }

  // Figure wrapping img
  const figureImgMatch = el.match(/^<figure\b[^>]*>([\s\S]*?)<\/figure>$/i);
  if (figureImgMatch && /<img\b/i.test(figureImgMatch[1]!)) {
    const inner = figureImgMatch[1]!;
    const src = (inner.match(/src=["']([^"']*)["']/i) || [])[1] || "";
    const alt = (inner.match(/alt=["']([^"']*)["']/i) || [])[1] || "";
    const capMatch = inner.match(/<figcaption\b[^>]*>([\s\S]*?)<\/figcaption>/i);
    const caption = capMatch ? capMatch[1]!.trim() : "";
    stats.converted++;
    return `<!-- wp:image {"url":"${escapeAttr(src)}","alt":"${escapeAttr(alt)}"} -->\n<figure class="wp-block-image"><img src="${src}" alt="${alt}"/>${caption ? `<figcaption class="wp-element-caption">${caption}</figcaption>` : ""}</figure>\n<!-- /wp:image -->`;
  }

  // Unordered list: <ul>
  const ulMatch = el.match(/^<ul\b[^>]*>([\s\S]*?)<\/ul>$/i);
  if (ulMatch) {
    const items = extractListItems(ulMatch[1]!);
    const listItems = items.map((i) => `<!-- wp:list-item -->\n<li>${i}</li>\n<!-- /wp:list-item -->`).join("\n");
    stats.converted++;
    return `<!-- wp:list -->\n<ul>${listItems}</ul>\n<!-- /wp:list -->`;
  }

  // Ordered list: <ol>
  const olMatch = el.match(/^<ol\b[^>]*>([\s\S]*?)<\/ol>$/i);
  if (olMatch) {
    const items = extractListItems(olMatch[1]!);
    const listItems = items.map((i) => `<!-- wp:list-item -->\n<li>${i}</li>\n<!-- /wp:list-item -->`).join("\n");
    stats.converted++;
    return `<!-- wp:list {"ordered":true} -->\n<ol>${listItems}</ol>\n<!-- /wp:list -->`;
  }

  // Blockquote: <blockquote>
  const bqMatch = el.match(/^<blockquote\b[^>]*>([\s\S]*?)<\/blockquote>$/i);
  if (bqMatch) {
    const inner = bqMatch[1]!.trim();
    // Extract cite if present
    const citeMatch = inner.match(/<cite\b[^>]*>([\s\S]*?)<\/cite>/i);
    let text = inner;
    if (citeMatch) {
      text = inner.replace(citeMatch[0], "").trim();
    }
    // Strip <p> wrappers in blockquote
    text = text.replace(/^<p\b[^>]*>([\s\S]*?)<\/p>$/i, "$1").trim();
    stats.converted++;
    return `<!-- wp:quote -->\n<blockquote class="wp-block-quote"><p>${text}</p>${citeMatch ? `<cite>${citeMatch[1]!.trim()}</cite>` : ""}</blockquote>\n<!-- /wp:quote -->`;
  }

  // Code: <pre> or <code>
  const preMatch = el.match(/^<pre\b[^>]*>([\s\S]*?)<\/pre>$/i);
  if (preMatch) {
    let codeContent = preMatch[1]!.trim();
    // Strip inner <code> wrapper if present
    const innerCode = codeContent.match(/^<code\b[^>]*>([\s\S]*?)<\/code>$/i);
    if (innerCode) codeContent = innerCode[1]!;
    stats.converted++;
    return `<!-- wp:code -->\n<pre class="wp-block-code"><code>${codeContent}</code></pre>\n<!-- /wp:code -->`;
  }
  // Standalone <code> without <pre>
  const codeMatch = el.match(/^<code\b[^>]*>([\s\S]*?)<\/code>$/i);
  if (codeMatch) {
    stats.converted++;
    return `<!-- wp:code -->\n<pre class="wp-block-code"><code>${codeMatch[1]}</code></pre>\n<!-- /wp:code -->`;
  }

  // Table: <table>
  const tableMatch = el.match(/^<table\b[^>]*>([\s\S]*?)<\/table>$/i);
  if (tableMatch) {
    stats.converted++;
    return `<!-- wp:table -->\n<figure class="wp-block-table"><table>${tableMatch[1]}</table></figure>\n<!-- /wp:table -->`;
  }

  // Horizontal rule: <hr>
  if (/^<hr\b[^>]*\/?>/i.test(el)) {
    stats.converted++;
    return `<!-- wp:separator -->\n<hr class="wp-block-separator has-alpha-channel-opacity"/>\n<!-- /wp:separator -->`;
  }

  // Iframe → embed
  const iframeMatch = el.match(/^<iframe\b[^>]*>/i);
  if (iframeMatch) {
    const src = (el.match(/src=["']([^"']*)["']/i) || [])[1] || "";
    stats.converted++;
    return `<!-- wp:embed {"url":"${escapeAttr(src)}"} -->\n<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">\n${src}\n</div></figure>\n<!-- /wp:embed -->`;
  }

  // Button-like anchor: <a> with class containing "button" or "btn"
  const buttonMatch = el.match(/^<a\b[^>]*class=["'][^"']*\b(?:button|btn)\b[^"']*["'][^>]*>([\s\S]*?)<\/a>$/i);
  if (buttonMatch) {
    const href = (el.match(/href=["']([^"']*)["']/i) || [])[1] || "#";
    const text = buttonMatch[1]!.trim();
    stats.converted++;
    return `<!-- wp:buttons -->\n<div class="wp-block-buttons"><!-- wp:button -->\n<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="${href}">${text}</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->`;
  }

  // Div/section with children → group
  const divMatch = el.match(/^<(div|section|article|main|header|footer)\b[^>]*>([\s\S]*?)<\/\1>$/i);
  if (divMatch) {
    const innerHtml = divMatch[2]!.trim();
    if (innerHtml) {
      const childElements = splitTopLevelElements(innerHtml);
      const childBlocks = childElements
        .map((child) => convertElementToBlock(child, stats))
        .filter(Boolean);
      if (childBlocks.length > 0) {
        stats.converted++;
        // Don't double-count: the children were already counted
        stats.elements_processed--; // This wrapper element doesn't count separately
        return `<!-- wp:group {"layout":{"type":"constrained"}} -->\n<div class="wp-block-group">${childBlocks.join("\n\n")}</div>\n<!-- /wp:group -->`;
      }
    }
    // Empty or un-parseable div — keep as HTML
    stats.preserved_as_html++;
    return `<!-- wp:html -->\n${el}\n<!-- /wp:html -->`;
  }

  // Plain text (no tags)
  if (!el.startsWith("<")) {
    stats.converted++;
    return `<!-- wp:paragraph -->\n<p>${el}</p>\n<!-- /wp:paragraph -->`;
  }

  // Anything else → preserve as wp:html
  stats.preserved_as_html++;
  return `<!-- wp:html -->\n${el}\n<!-- /wp:html -->`;
}

function extractListItems(listInnerHtml: string): string[] {
  const items: string[] = [];
  const regex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(listInnerHtml)) !== null) {
    items.push(match[1]!.trim());
  }
  return items;
}

function htmlToBlocks(html: string): { blockHtml: string; stats: ConversionStats } {
  const stats: ConversionStats = { converted: 0, preserved_as_html: 0, elements_processed: 0 };

  const cleaned = html.trim();
  if (!cleaned) {
    return { blockHtml: "", stats };
  }

  const elements = splitTopLevelElements(cleaned);
  const blocks = elements
    .map((el) => convertElementToBlock(el, stats))
    .filter(Boolean);

  return { blockHtml: blocks.join("\n\n"), stats };
}

// ─── Page structure parser ─────────────────────────────────────────

interface ParsedBlock {
  type: string;
  attrs: Record<string, unknown>;
  has_children: boolean;
  content_preview: string;
}

function parseBlockStructure(content: string): ParsedBlock[] {
  const blocks: ParsedBlock[] = [];
  const blockRegex = /<!-- wp:([a-z][a-z0-9-]*(?:\/[a-z][a-z0-9-]*)?)(\s+\{[^}]*\})?\s+(\/)?-->/g;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(content)) !== null) {
    const type = match[1]!;
    const attrStr = match[2] ? match[2].trim() : "{}";
    const selfClosing = !!match[3];

    let attrs: Record<string, unknown> = {};
    try {
      attrs = JSON.parse(attrStr) as Record<string, unknown>;
    } catch {
      // ignore parse errors
    }

    // Find content preview — get text between open and close comment
    let contentPreview = "";
    let hasChildren = false;

    if (!selfClosing) {
      const closeTag = `<!-- /wp:${type} -->`;
      const closeIdx = content.indexOf(closeTag, match.index + match[0].length);
      if (closeIdx !== -1) {
        const inner = content.slice(match.index + match[0].length, closeIdx);
        hasChildren = /<!-- wp:/.test(inner);
        // Strip HTML tags for preview
        contentPreview = inner.replace(/<[^>]+>/g, "").replace(/<!--[^>]*-->/g, "").trim().slice(0, 100);
      }
    }

    blocks.push({ type, attrs, has_children: hasChildren, content_preview: contentPreview });
  }

  return blocks;
}

// ─── Tool registration ─────────────────────────────────────────────

export function registerPageBuilderTools(server: McpServer, client: WpClient): void {

  // ─── wp_build_page ────────────────────────────────────────────────
  server.tool(
    "wp_build_page",
    "Create a complete WordPress page from a declarative block structure. Supports heading, paragraph, image, button, columns (with children), list, quote, code, separator, spacer, html, embed, group, and cover blocks.",
    BuildPageSchema.shape,
    async (params) => {
      try {
        const v = BuildPageSchema.parse(params);
        const blockDefs = v.blocks as BlockDefinition[];

        // Convert each block definition to Gutenberg HTML
        const blockHtmlParts = blockDefs.map(blockDefToHtml);
        const content = blockHtmlParts.join("\n\n");

        // Create the page
        const pageData: Record<string, unknown> = {
          title: v.title,
          content,
          status: v.status,
        };
        if (v.template) pageData["template"] = v.template;
        if (v.featured_image_id) pageData["featured_media"] = v.featured_image_id;

        const page = await client.post<Record<string, unknown>>("pages", pageData);

        return mcpSuccess({
          id: page["id"],
          title: v.title,
          url: page["link"],
          status: page["status"],
          block_count: blockDefs.length,
          message: `Page "${v.title}" created with ${blockDefs.length} blocks (ID: ${page["id"]})`,
        });
      } catch (e) {
        return mcpError(e, "wp_build_page");
      }
    },
  );

  // ─── wp_convert_html_to_blocks ────────────────────────────────────
  server.tool(
    "wp_convert_html_to_blocks",
    "Convert raw HTML into WordPress Gutenberg block markup. Handles headings, paragraphs, images, lists, blockquotes, code, tables, separators, embeds, and more. Optionally creates a page with the result.",
    ConvertHtmlToBlocksSchema.shape,
    async (params) => {
      try {
        const v = ConvertHtmlToBlocksSchema.parse(params);

        if (v.create_page && !v.page_title) {
          return mcpError(new Error("page_title is required when create_page is true"), "wp_convert_html_to_blocks");
        }

        const { blockHtml, stats } = htmlToBlocks(v.html);
        // Each block has an opening comment, so count unique opening comments (not closing ones)
        const openingBlocks = (blockHtml.match(/<!-- wp:[a-z]/g) || []).length;

        const result: Record<string, unknown> = {
          block_html: blockHtml,
          block_count: openingBlocks,
          conversion_report: {
            converted: stats.converted,
            preserved_as_html: stats.preserved_as_html,
            elements_processed: stats.elements_processed,
          },
        };

        if (v.create_page && v.page_title) {
          const page = await client.post<Record<string, unknown>>("pages", {
            title: v.page_title,
            content: blockHtml,
            status: v.page_status,
          });
          result["page"] = {
            id: page["id"],
            title: v.page_title,
            url: page["link"],
            status: page["status"],
          };
          result["message"] = `HTML converted to ${openingBlocks} blocks and page created (ID: ${page["id"]})`;
        } else {
          result["message"] = `HTML converted to ${openingBlocks} blocks. Use the block_html as content when creating posts/pages.`;
        }

        return mcpSuccess(result);
      } catch (e) {
        return mcpError(e, "wp_convert_html_to_blocks");
      }
    },
  );

  // ─── wp_get_page_structure ────────────────────────────────────────
  server.tool(
    "wp_get_page_structure",
    "Analyze a WordPress page or post's Gutenberg block structure. Returns block types, attributes, hierarchy, and content previews.",
    GetPageStructureSchema.shape,
    async (params) => {
      try {
        const v = GetPageStructureSchema.parse(params);
        const post = await client.get<Record<string, unknown>>(
          `${v.post_type}/${v.post_id}`,
          { context: "edit" },
        );

        const rawContent = ((post["content"] as Record<string, unknown>)?.["raw"] as string) || "";

        if (!rawContent.includes("<!-- wp:")) {
          return mcpSuccess({
            blocks: [],
            total_blocks: 0,
            block_types_used: [],
            message: "This post does not contain Gutenberg blocks (may be classic editor content).",
          });
        }

        const blocks = parseBlockStructure(rawContent);
        const blockTypes = [...new Set(blocks.map((b) => b.type))];

        return mcpSuccess({
          blocks,
          total_blocks: blocks.length,
          block_types_used: blockTypes,
          message: `Found ${blocks.length} blocks using ${blockTypes.length} block types.`,
        });
      } catch (e) {
        return mcpError(e, "wp_get_page_structure");
      }
    },
  );
}
