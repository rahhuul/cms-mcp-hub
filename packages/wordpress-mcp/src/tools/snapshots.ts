import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  ListSnapshotsSchema,
  GetSnapshotSchema,
  DiffContentSchema,
  RestoreSnapshotSchema,
  CreateBackupSchema,
  SafeUpdateSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Helper: simple line-based diff (no external deps)                  */
/* ------------------------------------------------------------------ */

function computeSimpleDiff(before: string, after: string): { changed: boolean; summary: string } {
  if (before === after) return { changed: false, summary: "No changes" };

  const beforeLines = before.split("\n");
  const afterLines = after.split("\n");
  const added = afterLines.length - beforeLines.length;

  return {
    changed: true,
    summary: `Content changed: ${beforeLines.length} lines \u2192 ${afterLines.length} lines (${added >= 0 ? "+" : ""}${added} lines)`,
  };
}

/* ------------------------------------------------------------------ */
/*  Helper: extract rendered text from WP response field               */
/* ------------------------------------------------------------------ */

function rendered(field: unknown): string {
  if (field && typeof field === "object" && "rendered" in (field as Record<string, unknown>)) {
    return String((field as Record<string, string>)["rendered"] ?? "");
  }
  return typeof field === "string" ? field : "";
}

/* ------------------------------------------------------------------ */
/*  Register snapshot & safety tools                                   */
/* ------------------------------------------------------------------ */

export function registerSnapshotTools(server: McpServer, client: WpClient): void {

  // ── wp_list_snapshots ─────────────────────────────────────────────
  server.tool(
    "wp_list_snapshots",
    "List revision history (snapshots) for a post or page. Returns revision IDs, dates, authors, and content excerpts.",
    ListSnapshotsSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type } = ListSnapshotsSchema.parse(p);
        const revisions = await client.get<Record<string, unknown>[]>(
          `${post_type}/${post_id}/revisions`,
        );
        const snapshots = revisions.map((r) => ({
          id: r["id"],
          date: r["date"],
          author: r["author"],
          title: rendered(r["title"]),
          content_excerpt: rendered(r["content"]).replace(/<[^>]*>/g, "").slice(0, 200),
        }));
        return mcpSuccess({ post_id, post_type, total: snapshots.length, snapshots });
      } catch (e) {
        return mcpError(e, "wp_list_snapshots");
      }
    },
  );

  // ── wp_get_snapshot ───────────────────────────────────────────────
  server.tool(
    "wp_get_snapshot",
    "Get full content of a specific revision/snapshot including title, content, excerpt, date, and author.",
    GetSnapshotSchema.shape,
    async (p) => {
      try {
        const { post_id, revision_id, post_type } = GetSnapshotSchema.parse(p);
        const rev = await client.get<Record<string, unknown>>(
          `${post_type}/${post_id}/revisions/${revision_id}`,
        );
        return mcpSuccess({
          id: rev["id"],
          date: rev["date"],
          author: rev["author"],
          title: rendered(rev["title"]),
          content: rendered(rev["content"]),
          excerpt: rendered(rev["excerpt"]),
        });
      } catch (e) {
        return mcpError(e, "wp_get_snapshot");
      }
    },
  );

  // ── wp_diff_content ───────────────────────────────────────────────
  server.tool(
    "wp_diff_content",
    "Compare two revisions of a post side by side. Shows which fields changed and a summary diff for each.",
    DiffContentSchema.shape,
    async (p) => {
      try {
        const { post_id, revision_id_a, revision_id_b, post_type } = DiffContentSchema.parse(p);
        const basePath = `${post_type}/${post_id}/revisions`;

        const [revA, revB] = await Promise.all([
          client.get<Record<string, unknown>>(`${basePath}/${revision_id_a}`),
          client.get<Record<string, unknown>>(`${basePath}/${revision_id_b}`),
        ]);

        const fields = ["title", "content", "excerpt"] as const;
        const fieldsChanged: string[] = [];
        const diffs: { field: string; before: string; after: string; diff: { changed: boolean; summary: string } }[] = [];

        for (const field of fields) {
          const before = rendered(revA[field]);
          const after = rendered(revB[field]);
          const diff = computeSimpleDiff(before, after);
          if (diff.changed) {
            fieldsChanged.push(field);
          }
          diffs.push({ field, before, after, diff });
        }

        return mcpSuccess({
          post_id,
          revision_a: { id: revision_id_a, date: revA["date"] },
          revision_b: { id: revision_id_b, date: revB["date"] },
          fields_changed: fieldsChanged,
          diffs,
        });
      } catch (e) {
        return mcpError(e, "wp_diff_content");
      }
    },
  );

  // ── wp_restore_snapshot ───────────────────────────────────────────
  server.tool(
    "wp_restore_snapshot",
    "Restore a post or page to a previous revision. Overwrites current title, content, and excerpt with the revision's values.",
    RestoreSnapshotSchema.shape,
    async (p) => {
      try {
        const { post_id, revision_id, post_type } = RestoreSnapshotSchema.parse(p);

        // Fetch revision content
        const rev = await client.get<Record<string, unknown>>(
          `${post_type}/${post_id}/revisions/${revision_id}`,
        );

        // Update the post with revision content
        const updateData: Record<string, unknown> = {
          title: rendered(rev["title"]),
          content: rendered(rev["content"]),
          excerpt: rendered(rev["excerpt"]),
        };
        await client.put(`${post_type}/${post_id}`, updateData);

        return mcpSuccess({
          restored: true,
          post_id,
          revision_id,
          message: `Post ${post_id} restored to revision ${revision_id}`,
        });
      } catch (e) {
        return mcpError(e, "wp_restore_snapshot");
      }
    },
  );

  // ── wp_create_backup ──────────────────────────────────────────────
  server.tool(
    "wp_create_backup",
    "Create a duplicate/backup of a post or page as a new draft. Copies title, content, excerpt, and appends a suffix to the title.",
    CreateBackupSchema.shape,
    async (p) => {
      try {
        const { post_id, post_type, suffix } = CreateBackupSchema.parse(p);

        // Fetch original post
        const original = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);
        const originalTitle = rendered(original["title"]);

        // Create a draft copy
        const backupData: Record<string, unknown> = {
          title: originalTitle + suffix,
          content: rendered(original["content"]),
          excerpt: rendered(original["excerpt"]),
          status: "draft",
        };
        const backup = await client.post<Record<string, unknown>>(post_type, backupData);

        return mcpSuccess({
          backup_id: backup["id"],
          original_id: post_id,
          backup_title: originalTitle + suffix,
          status: "draft",
          message: `Backup of "${originalTitle}" created as draft (ID: ${backup["id"]})`,
        });
      } catch (e) {
        return mcpError(e, "wp_create_backup");
      }
    },
  );

  // ── wp_safe_update ────────────────────────────────────────────────
  server.tool(
    "wp_safe_update",
    "Update a post with automatic backup. Creates a duplicate draft first (unless disabled), then applies updates to the original.",
    SafeUpdateSchema.shape,
    async (p) => {
      try {
        const { post_id, updates, post_type, create_backup } = SafeUpdateSchema.parse(p);

        let backupId: number | undefined;

        // Create backup if requested
        if (create_backup) {
          const original = await client.get<Record<string, unknown>>(`${post_type}/${post_id}`);
          const originalTitle = rendered(original["title"]);
          const backupData: Record<string, unknown> = {
            title: originalTitle + " (Backup)",
            content: rendered(original["content"]),
            excerpt: rendered(original["excerpt"]),
            status: "draft",
          };
          const backup = await client.post<Record<string, unknown>>(post_type, backupData);
          backupId = backup["id"] as number;
        }

        // Apply updates
        const changesApplied = Object.keys(updates).filter(
          (k) => (updates as Record<string, unknown>)[k] !== undefined,
        );
        await client.put(`${post_type}/${post_id}`, updates);

        return mcpSuccess({
          updated: true,
          post_id,
          backup_id: backupId,
          changes_applied: changesApplied,
          message: `Post ${post_id} updated${backupId ? ` (backup: ${backupId})` : ""}`,
        });
      } catch (e) {
        return mcpError(e, "wp_safe_update");
      }
    },
  );
}
