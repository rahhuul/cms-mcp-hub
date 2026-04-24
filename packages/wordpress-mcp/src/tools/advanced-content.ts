/**
 * Advanced content management tools — scheduling, moderation, stats, search, preview.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  SchedulePostSchema,
  ModerateCommentsSchema,
  GetContentStatsSchema,
  FindContentSchema,
  GetPreviewUrlSchema,
} from "../schemas/index.js";

/** Map moderation action to WordPress comment status */
function actionToStatus(action: string): string {
  switch (action) {
    case "approve": return "approved";
    case "spam": return "spam";
    case "trash": return "trash";
    case "untrash": return "approved";
    default: return "approved";
  }
}

/** Strip HTML tags from a string */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

/** Count words in plain text */
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/** Extract headings by level from HTML content */
function countHeadings(html: string): Record<string, number> {
  const result: Record<string, number> = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>`, "gi");
    const matches = html.match(regex);
    result[`h${i}`] = matches ? matches.length : 0;
  }
  return result;
}

/** Count images in HTML */
function countImages(html: string): number {
  const matches = html.match(/<img\s/gi);
  return matches ? matches.length : 0;
}

/** Count and classify links in HTML */
function countLinks(html: string, siteUrl: string): { internal: number; external: number; total: number } {
  const hrefRegex = /href=["']([^"']+)["']/gi;
  let internal = 0;
  let external = 0;
  let match: RegExpExecArray | null;
  const domain = siteUrl.replace(/https?:\/\//, "").replace(/\/+$/, "");

  while ((match = hrefRegex.exec(html)) !== null) {
    const href = match[1] ?? "";
    if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue;
    if (href.startsWith("/") || href.includes(domain)) {
      internal++;
    } else if (href.startsWith("http")) {
      external++;
    }
  }
  return { internal, external, total: internal + external };
}

/** Count Gutenberg blocks */
function countBlocks(content: string): number {
  const matches = content.match(/<!-- wp:/g);
  return matches ? matches.length : 0;
}

/** Count paragraphs in HTML */
function countParagraphs(html: string): number {
  const matches = html.match(/<p[\s>]/gi);
  return matches ? matches.length : 0;
}

export function registerAdvancedContentTools(server: McpServer, client: WpClient): void {

  // ─── wp_schedule_post ───────────────────────────────────────────────
  server.tool("wp_schedule_post",
    "Schedule a post for future publishing by setting its status to 'future' with a specific publish date.",
    SchedulePostSchema.shape, async (params) => {
    try {
      const { post_id, date, post_type } = SchedulePostSchema.parse(params);
      const updated = await client.put<Record<string, unknown>>(
        `${post_type}/${post_id}`,
        { status: "future", date },
      );

      const title = (updated["title"] as Record<string, unknown>)?.["rendered"] ?? "";
      return mcpSuccess({
        id: updated["id"],
        title,
        status: updated["status"],
        scheduled_date: updated["date"],
        message: `Post ${post_id} scheduled for ${date}`,
      });
    } catch (e) { return mcpError(e, "wp_schedule_post"); }
  });

  // ─── wp_moderate_comments ───────────────────────────────────────────
  server.tool("wp_moderate_comments",
    "Bulk moderate comments: approve, mark as spam, trash, or untrash multiple comments at once.",
    ModerateCommentsSchema.shape, async (params) => {
    try {
      const { comment_ids, action } = ModerateCommentsSchema.parse(params);
      const status = actionToStatus(action);
      const results: Array<{ id: number; success: boolean; error?: string }> = [];

      for (const id of comment_ids) {
        try {
          await client.put(`comments/${id}`, { status });
          results.push({ id, success: true });
        } catch (err) {
          results.push({
            id,
            success: false,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      const succeeded = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      return mcpSuccess({
        processed: comment_ids.length,
        succeeded,
        failed,
        action,
        status_applied: status,
        results,
        message: `${succeeded}/${comment_ids.length} comments ${action === "approve" ? "approved" : action === "spam" ? "marked as spam" : action === "trash" ? "trashed" : "untrashed"}`,
      });
    } catch (e) { return mcpError(e, "wp_moderate_comments"); }
  });

  // ─── wp_get_content_stats ───────────────────────────────────────────
  server.tool("wp_get_content_stats",
    "Get detailed content statistics for a post: word count, reading time, heading structure, image/link counts, block analysis, and metadata.",
    GetContentStatsSchema.shape, async (params) => {
    try {
      const { post_id, post_type } = GetContentStatsSchema.parse(params);
      const post = await client.get<Record<string, unknown>>(
        `${post_type}/${post_id}`,
        { context: "edit" },
      );

      const rawContent = (post["content"] as Record<string, unknown>)?.["raw"] as string ?? "";
      const plainText = stripHtml(rawContent);
      const wordCount = countWords(plainText);

      // Get site URL for link classification
      let siteUrl = "";
      try {
        const settings = await client.get<Record<string, unknown>>("settings");
        siteUrl = (settings["url"] as string) ?? "";
      } catch {
        // If settings not accessible, skip link classification
      }

      const links = countLinks(rawContent, siteUrl);
      const headings = countHeadings(rawContent);

      const title = (post["title"] as Record<string, unknown>)?.["raw"] as string ?? "";
      const excerpt = (post["excerpt"] as Record<string, unknown>)?.["raw"] as string ?? "";
      const categories = post["categories"] as number[] ?? [];
      const tags = post["tags"] as number[] ?? [];
      const featuredMedia = post["featured_media"] as number ?? 0;

      return mcpSuccess({
        post_id,
        title,
        status: post["status"],
        stats: {
          word_count: wordCount,
          char_count: plainText.length,
          paragraphs: countParagraphs(rawContent),
          headings,
          images: countImages(rawContent),
          links,
          reading_time_min: Math.max(1, Math.round(wordCount / 250)),
          blocks: countBlocks(rawContent),
        },
        metadata: {
          categories_count: categories.length,
          tags_count: tags.length,
          has_featured_image: featuredMedia > 0,
          has_excerpt: excerpt.trim().length > 0,
          last_modified: post["modified"],
        },
      });
    } catch (e) { return mcpError(e, "wp_get_content_stats"); }
  });

  // ─── wp_find_content ────────────────────────────────────────────────
  server.tool("wp_find_content",
    "Advanced content search across multiple content types. Search by title, content, excerpt, or all fields with status filtering.",
    FindContentSchema.shape, async (params) => {
    try {
      const { query, content_types, search_in, status, limit } = FindContentSchema.parse(params);
      const allResults: Array<{
        id: number; type: string; title: string; excerpt_match: string;
        url: string; status: string; date: string;
      }> = [];

      for (const contentType of content_types) {
        const searchParams: Record<string, string | number | boolean | undefined> = {
          search: query,
          per_page: limit,
          context: "edit",
        };
        if (status !== "any") {
          searchParams["status"] = status;
        }

        try {
          const items = await client.list<Record<string, unknown>>(
            contentType, searchParams, 1, limit,
          );

          for (const item of items) {
            const titleRaw = (item["title"] as Record<string, unknown>)?.["raw"] as string ?? "";
            const contentRaw = (item["content"] as Record<string, unknown>)?.["raw"] as string ?? "";
            const excerptRaw = (item["excerpt"] as Record<string, unknown>)?.["raw"] as string ?? "";
            const queryLower = query.toLowerCase();

            // Client-side field filtering when search_in is specific
            if (search_in === "title" && !titleRaw.toLowerCase().includes(queryLower)) continue;
            if (search_in === "content" && !stripHtml(contentRaw).toLowerCase().includes(queryLower)) continue;
            if (search_in === "excerpt" && !stripHtml(excerptRaw).toLowerCase().includes(queryLower)) continue;

            // Build excerpt match snippet
            let excerptMatch = "";
            const plainContent = stripHtml(contentRaw);
            const matchIdx = plainContent.toLowerCase().indexOf(queryLower);
            if (matchIdx !== -1) {
              const start = Math.max(0, matchIdx - 50);
              const end = Math.min(plainContent.length, matchIdx + query.length + 50);
              excerptMatch = (start > 0 ? "..." : "") + plainContent.slice(start, end) + (end < plainContent.length ? "..." : "");
            } else if (excerptRaw) {
              excerptMatch = stripHtml(excerptRaw).slice(0, 120);
            }

            allResults.push({
              id: item["id"] as number,
              type: contentType,
              title: titleRaw,
              excerpt_match: excerptMatch,
              url: item["link"] as string ?? "",
              status: item["status"] as string ?? "",
              date: item["date"] as string ?? "",
            });
          }
        } catch {
          // Skip content types that error (e.g., unregistered custom types)
        }
      }

      // Sort by relevance: title matches first, then by date
      const queryLower = query.toLowerCase();
      allResults.sort((a, b) => {
        const aTitle = a.title.toLowerCase().includes(queryLower) ? 0 : 1;
        const bTitle = b.title.toLowerCase().includes(queryLower) ? 0 : 1;
        if (aTitle !== bTitle) return aTitle - bTitle;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      const trimmed = allResults.slice(0, limit);

      return mcpSuccess({
        total_results: trimmed.length,
        query,
        content_types,
        search_in,
        results: trimmed,
      });
    } catch (e) { return mcpError(e, "wp_find_content"); }
  });

  // ─── wp_get_preview_url ─────────────────────────────────────────────
  server.tool("wp_get_preview_url",
    "Generate a preview URL for a draft or pending post. Returns the URL that can be used to preview the post before publishing.",
    GetPreviewUrlSchema.shape, async (params) => {
    try {
      const { post_id, post_type } = GetPreviewUrlSchema.parse(params);
      const post = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);

      // Get site URL from settings
      const settings = await client.get<Record<string, unknown>>("settings");
      const siteUrl = ((settings["url"] as string) ?? "").replace(/\/+$/, "");

      const title = (post["title"] as Record<string, unknown>)?.["rendered"] ?? "";
      const postStatus = post["status"] as string ?? "";

      // Build preview URL based on post type
      let previewUrl: string;
      if (post_type === "pages") {
        previewUrl = `${siteUrl}/?page_id=${post_id}&preview=true`;
      } else if (post_type === "posts") {
        previewUrl = `${siteUrl}/?p=${post_id}&preview=true`;
      } else {
        // Custom post types
        previewUrl = `${siteUrl}/?post_type=${post_type}&p=${post_id}&preview=true`;
      }

      return mcpSuccess({
        preview_url: previewUrl,
        post_id,
        status: postStatus,
        title,
      });
    } catch (e) { return mcpError(e, "wp_get_preview_url"); }
  });
}
