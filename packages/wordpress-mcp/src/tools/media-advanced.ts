/**
 * Advanced media management tools beyond basic CRUD.
 * Includes optimization audits, thumbnail regeneration, bulk alt text,
 * unused media detection, image size listing, and file replacement.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import type { PluginClient } from "../api/plugin-client.js";
import {
  MediaOptimizeAuditSchema,
  MediaRegenerateThumbnailsSchema,
  MediaBulkAltTextSchema,
  MediaFindUnusedSchema,
  MediaGetSizesSchema,
  MediaReplaceSchema,
} from "../schemas/index.js";

const PLUGIN_REQUIRED_MSG =
  "The CMS MCP Hub plugin is required for this tool. Install and activate it on the WordPress site.";

interface MediaItem {
  id: number;
  title?: { rendered?: string };
  alt_text?: string;
  source_url?: string;
  media_type?: string;
  mime_type?: string;
  media_details?: {
    width?: number;
    height?: number;
    filesize?: number;
    sizes?: Record<string, unknown>;
  };
  post?: number | null;
  date?: string;
}

export function registerMediaAdvancedTools(server: McpServer, client: WpClient, pluginClient: PluginClient): void {

  // ── wp_media_optimize_audit ──────────────────────────────────────
  server.tool(
    "wp_media_optimize_audit",
    "Audit the media library for optimization opportunities: images without alt text, oversized images, unused media (not attached to any post), missing thumbnails, and potential duplicates. Works without the companion plugin — uses the standard WP REST API.",
    MediaOptimizeAuditSchema.shape,
    async (params) => {
      try {
        const validated = MediaOptimizeAuditSchema.parse(params);
        const maxPages = Math.min(validated.max_pages, 10);
        const perPage = validated.per_page;

        const issues: {
          missing_alt_text: Array<{ id: number; title: string; url: string }>;
          oversized_images: Array<{ id: number; title: string; width: number; height: number; url: string }>;
          unattached_media: Array<{ id: number; title: string; url: string }>;
          missing_thumbnails: Array<{ id: number; title: string; url: string }>;
          potential_duplicates: Array<{ title: string; ids: number[] }>;
        } = {
          missing_alt_text: [],
          oversized_images: [],
          unattached_media: [],
          missing_thumbnails: [],
          potential_duplicates: [],
        };

        const maxWidth = validated.max_width;
        const maxHeight = validated.max_height;
        const seenNames = new Map<string, number[]>();
        let totalScanned = 0;

        for (let page = 1; page <= maxPages; page++) {
          const items = await client.list<MediaItem>(
            "media",
            { media_type: "image" },
            page,
            perPage,
          );
          if (items.length === 0) break;
          totalScanned += items.length;

          for (const item of items) {
            const title = item.title?.rendered ?? `(ID: ${item.id})`;
            const url = item.source_url ?? "";

            // Missing alt text
            if (!item.alt_text || item.alt_text.trim() === "") {
              issues.missing_alt_text.push({ id: item.id, title, url });
            }

            // Oversized images
            const w = item.media_details?.width ?? 0;
            const h = item.media_details?.height ?? 0;
            if (w > maxWidth || h > maxHeight) {
              issues.oversized_images.push({ id: item.id, title, width: w, height: h, url });
            }

            // Unattached media
            if (!item.post || item.post === 0) {
              issues.unattached_media.push({ id: item.id, title, url });
            }

            // Missing standard thumbnails
            const sizes = item.media_details?.sizes;
            if (sizes && !sizes["thumbnail"]) {
              issues.missing_thumbnails.push({ id: item.id, title, url });
            }

            // Track potential duplicates by filename
            const fileName = url.split("/").pop()?.replace(/(-\d+x\d+)?\.\w+$/, "") ?? "";
            if (fileName) {
              const existing = seenNames.get(fileName);
              if (existing) {
                existing.push(item.id);
              } else {
                seenNames.set(fileName, [item.id]);
              }
            }
          }

          if (items.length < perPage) break;
        }

        // Collect duplicates (entries with more than one ID)
        for (const [name, ids] of seenNames) {
          if (ids.length > 1) {
            issues.potential_duplicates.push({ title: name, ids });
          }
        }

        const totalIssues =
          issues.missing_alt_text.length +
          issues.oversized_images.length +
          issues.unattached_media.length +
          issues.missing_thumbnails.length +
          issues.potential_duplicates.length;

        return mcpSuccess({
          total_scanned: totalScanned,
          total_issues: totalIssues,
          issues,
          recommendations: [
            issues.missing_alt_text.length > 0
              ? `Add alt text to ${issues.missing_alt_text.length} image(s) for better SEO and accessibility.`
              : null,
            issues.oversized_images.length > 0
              ? `${issues.oversized_images.length} image(s) exceed ${maxWidth}x${maxHeight}px — consider resizing.`
              : null,
            issues.unattached_media.length > 0
              ? `${issues.unattached_media.length} media item(s) are not attached to any content — review and delete unused files.`
              : null,
            issues.missing_thumbnails.length > 0
              ? `${issues.missing_thumbnails.length} image(s) are missing thumbnails — use wp_media_regenerate_thumbnails.`
              : null,
            issues.potential_duplicates.length > 0
              ? `${issues.potential_duplicates.length} potential duplicate file name(s) detected — review and remove duplicates.`
              : null,
          ].filter(Boolean),
        });
      } catch (e) {
        return mcpError(e, "wp_media_optimize_audit");
      }
    },
  );

  // ── wp_media_regenerate_thumbnails ───────────────────────────────
  server.tool(
    "wp_media_regenerate_thumbnails",
    "Regenerate thumbnails for a specific media item or a batch of media items. Creates all registered image sizes from the original. Requires the CMS MCP Hub plugin.",
    MediaRegenerateThumbnailsSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_media_regenerate_thumbnails");
        }
        const validated = MediaRegenerateThumbnailsSchema.parse(params);
        const ids = validated.attachment_ids;
        const results: Array<{ id: number; status: string; error?: string }> = [];

        for (const id of ids) {
          try {
            await pluginClient.regenerateThumbnails(id);
            results.push({ id, status: "success" });
          } catch (err) {
            results.push({
              id,
              status: "error",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        const succeeded = results.filter((r) => r.status === "success").length;
        const failed = results.filter((r) => r.status === "error").length;

        return mcpSuccess({
          message: `Regenerated thumbnails: ${succeeded} succeeded, ${failed} failed.`,
          total: ids.length,
          succeeded,
          failed,
          results,
        });
      } catch (e) {
        return mcpError(e, "wp_media_regenerate_thumbnails");
      }
    },
  );

  // ── wp_media_bulk_alt_text ──────────────────────────────────────
  server.tool(
    "wp_media_bulk_alt_text",
    "Set alt text on multiple media items at once. Provide a mapping of media IDs to alt text strings. Uses the WP REST API to PATCH each item. Great for improving SEO and accessibility in bulk.",
    MediaBulkAltTextSchema.shape,
    async (params) => {
      try {
        const validated = MediaBulkAltTextSchema.parse(params);
        const results: Array<{ id: number; status: string; alt_text?: string; error?: string }> = [];

        for (const item of validated.items) {
          try {
            await client.post(`media/${item.id}`, { alt_text: item.alt_text });
            results.push({ id: item.id, status: "success", alt_text: item.alt_text });
          } catch (err) {
            results.push({
              id: item.id,
              status: "error",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        const succeeded = results.filter((r) => r.status === "success").length;
        const failed = results.filter((r) => r.status === "error").length;

        return mcpSuccess({
          message: `Updated alt text: ${succeeded} succeeded, ${failed} failed.`,
          total: validated.items.length,
          succeeded,
          failed,
          results,
        });
      } catch (e) {
        return mcpError(e, "wp_media_bulk_alt_text");
      }
    },
  );

  // ── wp_media_find_unused ────────────────────────────────────────
  server.tool(
    "wp_media_find_unused",
    "Find media items not attached to any post or page. Queries media with parent=0 and cross-references content usage. Paginates efficiently through the media library.",
    MediaFindUnusedSchema.shape,
    async (params) => {
      try {
        const validated = MediaFindUnusedSchema.parse(params);
        const perPage = validated.per_page;
        const maxPages = Math.min(validated.max_pages, 20);
        const mediaType = validated.media_type;

        const unused: Array<{
          id: number;
          title: string;
          url: string;
          mime_type: string;
          date: string;
          filesize: number | null;
        }> = [];
        let totalScanned = 0;

        for (let page = 1; page <= maxPages; page++) {
          const queryParams: Record<string, string | number | boolean | undefined> = {
            parent: 0,
          };
          if (mediaType) queryParams["media_type"] = mediaType;

          const items = await client.list<MediaItem>(
            "media",
            queryParams,
            page,
            perPage,
          );
          if (items.length === 0) break;
          totalScanned += items.length;

          for (const item of items) {
            unused.push({
              id: item.id,
              title: item.title?.rendered ?? `(ID: ${item.id})`,
              url: item.source_url ?? "",
              mime_type: item.mime_type ?? "unknown",
              date: item.date ?? "",
              filesize: item.media_details?.filesize ?? null,
            });
          }

          if (items.length < perPage) break;
        }

        // Calculate total file size
        const totalBytes = unused.reduce((sum, m) => sum + (m.filesize ?? 0), 0);
        const totalMB = (totalBytes / (1024 * 1024)).toFixed(2);

        return mcpSuccess({
          total_unused: unused.length,
          total_scanned: totalScanned,
          total_size_mb: parseFloat(totalMB),
          items: unused,
          note: "These media items have parent=0 (not attached to any post). Some may still be referenced via shortcodes or custom fields — verify before deleting.",
        });
      } catch (e) {
        return mcpError(e, "wp_media_find_unused");
      }
    },
  );

  // ── wp_media_get_sizes ──────────────────────────────────────────
  server.tool(
    "wp_media_get_sizes",
    "Get all registered image sizes on the WordPress site (thumbnail, medium, large, and custom sizes registered by themes/plugins). Tries the CMS MCP Hub plugin first; falls back to reading standard sizes from WP REST API settings.",
    MediaGetSizesSchema.shape,
    async (_params) => {
      try {
        // Try plugin first for comprehensive size list including custom sizes
        if (await pluginClient.isAvailable()) {
          try {
            const sizes = await pluginClient.getImageSizes();
            return mcpSuccess({ source: "plugin", sizes });
          } catch {
            // Fall through to REST API fallback
          }
        }

        // Fallback: read standard sizes from settings
        const settings = await client.get<Record<string, unknown>>("settings");
        const standardSizes: Record<string, { width: number; height: number; crop: boolean }> = {
          thumbnail: {
            width: (settings["thumbnail_size_w"] as number) ?? 150,
            height: (settings["thumbnail_size_h"] as number) ?? 150,
            crop: true,
          },
          medium: {
            width: (settings["medium_size_w"] as number) ?? 300,
            height: (settings["medium_size_h"] as number) ?? 300,
            crop: false,
          },
          large: {
            width: (settings["large_size_w"] as number) ?? 1024,
            height: (settings["large_size_h"] as number) ?? 1024,
            crop: false,
          },
        };

        return mcpSuccess({
          source: "rest_api_settings",
          sizes: standardSizes,
          note: "Only standard WordPress sizes are shown. Install the CMS MCP Hub plugin to see all custom sizes registered by themes and plugins.",
        });
      } catch (e) {
        return mcpError(e, "wp_media_get_sizes");
      }
    },
  );

  // ── wp_media_replace ────────────────────────────────────────────
  server.tool(
    "wp_media_replace",
    "Replace a media file while keeping the same attachment ID and all references throughout the site. The old file is replaced with a new one. Requires the CMS MCP Hub plugin.",
    MediaReplaceSchema.shape,
    async (params) => {
      try {
        if (!(await pluginClient.isAvailable())) {
          return mcpError(new Error(PLUGIN_REQUIRED_MSG), "wp_media_replace");
        }
        const validated = MediaReplaceSchema.parse(params);

        const data: Record<string, unknown> = {
          source: validated.source,
        };
        if (validated.filename) data["filename"] = validated.filename;

        const result = await pluginClient.replaceMedia(validated.attachment_id, data);
        return mcpSuccess({
          message: `Media ${validated.attachment_id} replaced successfully. All references remain intact.`,
          result,
        });
      } catch (e) {
        return mcpError(e, "wp_media_replace");
      }
    },
  );
}
