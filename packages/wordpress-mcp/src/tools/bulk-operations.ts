/**
 * Bulk operation tools — batch actions across multiple posts/media in one call.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  BulkFindReplaceSchema,
  BulkUpdateMetaSchema,
  BulkManageMediaSchema,
  BulkChangeStatusSchema,
  BulkAssignTermsSchema,
  BulkDeleteSchema,
} from "../schemas/index.js";

interface ItemResult {
  id: number;
  status: "success" | "error";
  error?: string;
}

function summarize(results: ItemResult[]): { total: number; succeeded: number; failed: number; results: ItemResult[] } {
  return {
    total: results.length,
    succeeded: results.filter((r) => r.status === "success").length,
    failed: results.filter((r) => r.status === "error").length,
    results,
  };
}

export function registerBulkOperationTools(server: McpServer, client: WpClient): void {

  // ─── wp_bulk_find_replace ──────────────────────────────────────────
  server.tool(
    "wp_bulk_find_replace",
    "Find and replace text across multiple posts or pages. Defaults to dry_run=true for safety — preview changes before applying.",
    BulkFindReplaceSchema.shape,
    async (params) => {
      try {
        const v = BulkFindReplaceSchema.parse(params);

        // Determine which post types to search
        const types: string[] = v.post_type === "any" ? ["posts", "pages"] : [v.post_type === "page" ? "pages" : "posts"];

        // Fetch posts matching search text
        const allPosts: Array<Record<string, unknown>> = [];
        for (const pt of types) {
          const fetched = await client.list<Record<string, unknown>>(pt, {
            search: v.search,
            per_page: v.max_posts,
            context: "edit",
          });
          allPosts.push(...fetched);
        }

        // Limit total
        const posts = allPosts.slice(0, v.max_posts);

        // Check each post for matches and build change list
        const changes: Array<{
          id: number;
          title: string;
          post_type: string;
          changes: Array<{ field: string; before_snippet: string; after_snippet: string }>;
        }> = [];

        for (const post of posts) {
          const postId = post["id"] as number;
          const rawTitle = ((post["title"] as Record<string, unknown>)?.["raw"] as string) || "";
          const rawContent = ((post["content"] as Record<string, unknown>)?.["raw"] as string) || "";
          const rawExcerpt = ((post["excerpt"] as Record<string, unknown>)?.["raw"] as string) || "";
          const postType = (post["type"] as string) || "post";

          const postChanges: Array<{ field: string; before_snippet: string; after_snippet: string }> = [];

          const checkField = (field: string, value: string): string | null => {
            if (!value.includes(v.search)) return null;
            const replaced = value.split(v.search).join(v.replace);
            // Create a short snippet around the first match
            const idx = value.indexOf(v.search);
            const start = Math.max(0, idx - 30);
            const end = Math.min(value.length, idx + v.search.length + 30);
            postChanges.push({
              field,
              before_snippet: value.slice(start, end),
              after_snippet: replaced.slice(start, start + (end - start) + (v.replace.length - v.search.length)),
            });
            return replaced;
          };

          const updateData: Record<string, unknown> = {};

          if (v.scope === "all" || v.scope === "title") {
            const result = checkField("title", rawTitle);
            if (result !== null) updateData["title"] = result;
          }
          if (v.scope === "all" || v.scope === "content") {
            const result = checkField("content", rawContent);
            if (result !== null) updateData["content"] = result;
          }
          if (v.scope === "all" || v.scope === "excerpt") {
            const result = checkField("excerpt", rawExcerpt);
            if (result !== null) updateData["excerpt"] = result;
          }

          if (postChanges.length > 0) {
            changes.push({ id: postId, title: rawTitle, post_type: postType, changes: postChanges });

            // Apply changes if not dry run
            if (!v.dry_run) {
              const endpoint = postType === "page" ? "pages" : "posts";
              try {
                await client.put(`${endpoint}/${postId}`, updateData);
              } catch {
                // Mark the change as failed — but still show it
                postChanges.forEach((c) => { c.after_snippet += " [UPDATE FAILED]"; });
              }
            }
          }
        }

        return mcpSuccess({
          dry_run: v.dry_run,
          search: v.search,
          replace: v.replace,
          scope: v.scope,
          posts_scanned: posts.length,
          modified: changes.length,
          posts: changes,
          message: v.dry_run
            ? `Dry run: ${changes.length} post(s) would be modified. Set dry_run=false to apply.`
            : `${changes.length} post(s) updated with find/replace.`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_find_replace"); }
    },
  );

  // ─── wp_bulk_update_meta ───────────────────────────────────────────
  server.tool(
    "wp_bulk_update_meta",
    "Batch update post meta/custom fields across multiple posts. Sets the same meta key-value pairs on all specified posts.",
    BulkUpdateMetaSchema.shape,
    async (params) => {
      try {
        const v = BulkUpdateMetaSchema.parse(params);
        const results: ItemResult[] = [];

        const settled = await Promise.allSettled(
          v.post_ids.map(async (id) => {
            await client.put(`${v.post_type}/${id}`, { meta: v.meta });
            return id;
          }),
        );

        for (let i = 0; i < settled.length; i++) {
          const s = settled[i]!;
          const id = v.post_ids[i]!;
          if (s.status === "fulfilled") {
            results.push({ id, status: "success" });
          } else {
            results.push({ id, status: "error", error: s.reason instanceof Error ? s.reason.message : String(s.reason) });
          }
        }

        const summary = summarize(results);
        return mcpSuccess({
          ...summary,
          meta_keys: Object.keys(v.meta),
          message: `Meta updated on ${summary.succeeded}/${summary.total} ${v.post_type}`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_update_meta"); }
    },
  );

  // ─── wp_bulk_manage_media ──────────────────────────────────────────
  server.tool(
    "wp_bulk_manage_media",
    "Batch update media metadata (alt text, captions, titles). Can target specific IDs, search for media, or fix missing alt text automatically.",
    BulkManageMediaSchema.shape,
    async (params) => {
      try {
        const v = BulkManageMediaSchema.parse(params);
        let mediaItems: Array<Record<string, unknown>> = [];

        // Resolve media items
        if (v.media_ids.length > 0) {
          // Fetch each by ID
          const settled = await Promise.allSettled(
            v.media_ids.map((id) => client.get<Record<string, unknown>>(`media/${id}`)),
          );
          for (const s of settled) {
            if (s.status === "fulfilled") mediaItems.push(s.value);
          }
        } else if (v.search) {
          mediaItems = await client.list<Record<string, unknown>>("media", { search: v.search, per_page: 50 });
        } else {
          mediaItems = await client.list<Record<string, unknown>>("media", {}, 1, 50);
        }

        const results: ItemResult[] = [];

        const settled = await Promise.allSettled(
          mediaItems.map(async (item) => {
            const id = item["id"] as number;
            const updateData: Record<string, unknown> = {};

            if (v.updates?.alt_text !== undefined) updateData["alt_text"] = v.updates.alt_text;
            if (v.updates?.caption !== undefined) updateData["caption"] = v.updates.caption;
            if (v.updates?.title !== undefined) updateData["title"] = v.updates.title;

            // Fix missing alt text: use existing title as alt text
            if (v.fix_missing_alt) {
              const currentAlt = (item["alt_text"] as string) || "";
              if (!currentAlt.trim()) {
                const title = ((item["title"] as Record<string, unknown>)?.["rendered"] as string) || "";
                if (title.trim()) {
                  updateData["alt_text"] = title.trim();
                }
              }
            }

            if (Object.keys(updateData).length === 0) return id;
            await client.put(`media/${id}`, updateData);
            return id;
          }),
        );

        for (let i = 0; i < settled.length; i++) {
          const s = settled[i]!;
          const id = mediaItems[i]?.["id"] as number;
          if (s.status === "fulfilled") {
            results.push({ id, status: "success" });
          } else {
            results.push({ id, status: "error", error: s.reason instanceof Error ? s.reason.message : String(s.reason) });
          }
        }

        const summary = summarize(results);
        return mcpSuccess({
          ...summary,
          message: `Media updated: ${summary.succeeded}/${summary.total} items`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_manage_media"); }
    },
  );

  // ─── wp_bulk_change_status ─────────────────────────────────────────
  server.tool(
    "wp_bulk_change_status",
    "Change the status of multiple posts at once — publish, draft, pending, private, or trash many posts in a single call.",
    BulkChangeStatusSchema.shape,
    async (params) => {
      try {
        const v = BulkChangeStatusSchema.parse(params);
        const results: ItemResult[] = [];

        const settled = await Promise.allSettled(
          v.post_ids.map(async (id) => {
            await client.put(`${v.post_type}/${id}`, { status: v.status });
            return id;
          }),
        );

        for (let i = 0; i < settled.length; i++) {
          const s = settled[i]!;
          const id = v.post_ids[i]!;
          if (s.status === "fulfilled") {
            results.push({ id, status: "success" });
          } else {
            results.push({ id, status: "error", error: s.reason instanceof Error ? s.reason.message : String(s.reason) });
          }
        }

        const summary = summarize(results);
        return mcpSuccess({
          ...summary,
          new_status: v.status,
          message: `Status changed to '${v.status}' on ${summary.succeeded}/${summary.total} ${v.post_type}`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_change_status"); }
    },
  );

  // ─── wp_bulk_assign_terms ──────────────────────────────────────────
  server.tool(
    "wp_bulk_assign_terms",
    "Assign categories and/or tags to multiple posts at once. Can add to existing terms or replace all terms.",
    BulkAssignTermsSchema.shape,
    async (params) => {
      try {
        const v = BulkAssignTermsSchema.parse(params);

        if (!v.categories?.length && !v.tags?.length) {
          return mcpSuccess({ total: 0, succeeded: 0, failed: 0, results: [], message: "No categories or tags provided — nothing to do." });
        }

        const results: ItemResult[] = [];

        const settled = await Promise.allSettled(
          v.post_ids.map(async (id) => {
            const updateData: Record<string, unknown> = {};

            if (v.mode === "replace") {
              // Replace: set exactly the provided terms
              if (v.categories) updateData["categories"] = v.categories;
              if (v.tags) updateData["tags"] = v.tags;
            } else {
              // Add: merge with existing terms
              const existing = await client.get<Record<string, unknown>>(`posts/${id}`);
              if (v.categories) {
                const current = (existing["categories"] as number[]) || [];
                const merged = [...new Set([...current, ...v.categories])];
                updateData["categories"] = merged;
              }
              if (v.tags) {
                const current = (existing["tags"] as number[]) || [];
                const merged = [...new Set([...current, ...v.tags])];
                updateData["tags"] = merged;
              }
            }

            await client.put(`posts/${id}`, updateData);
            return id;
          }),
        );

        for (let i = 0; i < settled.length; i++) {
          const s = settled[i]!;
          const id = v.post_ids[i]!;
          if (s.status === "fulfilled") {
            results.push({ id, status: "success" });
          } else {
            results.push({ id, status: "error", error: s.reason instanceof Error ? s.reason.message : String(s.reason) });
          }
        }

        const summary = summarize(results);
        return mcpSuccess({
          ...summary,
          mode: v.mode,
          categories: v.categories || [],
          tags: v.tags || [],
          message: `Terms ${v.mode === "replace" ? "replaced" : "added"} on ${summary.succeeded}/${summary.total} posts`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_assign_terms"); }
    },
  );

  // ─── wp_bulk_delete ───────────────────────────────────────────────────
  server.tool(
    "wp_bulk_delete",
    "Bulk delete posts, pages, media, or comments. Moves to trash by default; set force=true for permanent deletion. Media always requires force=true (applied automatically).",
    BulkDeleteSchema.shape,
    async (params) => {
      try {
        const v = BulkDeleteSchema.parse(params);
        const results: ItemResult[] = [];

        for (const id of v.ids) {
          try {
            // Media requires force=true in WordPress REST API
            const delForce = v.resource === "media" ? true : v.force;
            await client.del(`${v.resource}/${id}`, { force: delForce });
            results.push({ id, status: "success" });
          } catch (err) {
            results.push({ id, status: "error", error: err instanceof Error ? err.message : String(err) });
          }
        }

        const summary = summarize(results);
        return mcpSuccess({
          ...summary,
          resource: v.resource,
          force: v.force,
          message: `${summary.succeeded}/${summary.total} ${v.resource} ${v.force || v.resource === "media" ? "permanently deleted" : "trashed"}`,
        });
      } catch (e) { return mcpError(e, "wp_bulk_delete"); }
    },
  );
}
