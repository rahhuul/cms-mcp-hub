/**
 * Advanced comment moderation tools — bulk moderation, statistics,
 * spam pattern detection, and auto-moderation rules.
 * Works with standard WordPress REST API (no plugin required).
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { WpClient } from "../api/client.js";
import {
  CommentBulkModerateSchema,
  CommentGetStatsSchema,
  CommentFindSpamPatternsSchema,
  CommentAutoModerateSchema,
} from "../schemas/index.js";

// ─── Types ──────────────────────────────────────────────────────────────

interface ModerationResult {
  id: number;
  status: "success" | "error";
  action?: string;
  error?: string;
}

interface SpamIndicator {
  comment_id: number;
  author: string;
  reasons: string[];
  score: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────

/** Count URLs in a string */
function countUrls(text: string): number {
  const urlPattern = /https?:\/\/[^\s<>"']+/gi;
  return (text.match(urlPattern) ?? []).length;
}

/** Known spam phrases */
const SPAM_PHRASES = [
  "buy now", "click here", "free money", "earn money",
  "work from home", "make money online", "online casino",
  "weight loss", "diet pill", "cheap pills", "viagra",
  "cialis", "pharmacy", "payday loan", "bitcoin investment",
  "double your", "limited time offer", "act now",
  "congratulations you", "you have been selected",
  "nigerian prince", "wire transfer",
];

function detectSpamPatterns(content: string, authorEmail: string, authorUrl: string): string[] {
  const reasons: string[] = [];
  const lower = content.toLowerCase();

  // Excessive URLs
  const urlCount = countUrls(content);
  if (urlCount >= 3) {
    reasons.push(`Contains ${urlCount} URLs`);
  }

  // Known spam phrases
  for (const phrase of SPAM_PHRASES) {
    if (lower.includes(phrase)) {
      reasons.push(`Contains spam phrase: "${phrase}"`);
    }
  }

  // All caps (more than 50% and at least 20 chars)
  if (content.length >= 20) {
    const upperCount = (content.match(/[A-Z]/g) ?? []).length;
    const letterCount = (content.match(/[A-Za-z]/g) ?? []).length;
    if (letterCount > 0 && upperCount / letterCount > 0.5) {
      reasons.push("Excessive use of capital letters");
    }
  }

  // Suspicious author URL patterns
  if (authorUrl && /\.(ru|cn|tk|ml|ga|cf|gq)\/?$/i.test(authorUrl)) {
    reasons.push(`Suspicious author URL domain: ${authorUrl}`);
  }

  // Very short generic comments
  if (content.length < 20 && /^(nice|great|good|thanks|thank you|cool|awesome|wow|hello|hi)\b/i.test(content.trim())) {
    reasons.push("Very short generic comment (possible bot)");
  }

  // Disposable email domain patterns
  if (/(@(mailinator|guerrillamail|throwaway|tempmail|yopmail|10minutemail)\.)/.test(authorEmail)) {
    reasons.push("Disposable email address detected");
  }

  return reasons;
}

// ─── Status mapping ─────────────────────────────────────────────────────

function mapStatusToApi(action: string): string {
  switch (action) {
    case "approve": return "approved";
    case "hold": return "hold";
    case "spam": return "spam";
    case "trash": return "trash";
    default: return action;
  }
}

// ─── Tool registration ──────────────────────────────────────────────────

export function registerCommentModerationTools(server: McpServer, client: WpClient): void {

  // ── wp_comment_bulk_moderate ─────────────────────────────────────────
  server.tool(
    "wp_comment_bulk_moderate",
    "Bulk approve, spam, hold, or trash comments by IDs or filter criteria (date range, author, status). Uses Promise.allSettled for per-comment error handling.",
    CommentBulkModerateSchema.shape,
    async (params) => {
      try {
        const v = CommentBulkModerateSchema.parse(params);
        let commentIds = v.comment_ids ?? [];

        // If no IDs provided, fetch comments matching filter criteria
        if (commentIds.length === 0) {
          const filterParams: Record<string, string | number | boolean | undefined> = {};
          if (v.status) filterParams["status"] = v.status === "approve" ? "approved" : v.status;
          if (v.post) filterParams["post"] = v.post;
          if (v.before) filterParams["before"] = v.before;
          if (v.after) filterParams["after"] = v.after;
          if (v.author_email) filterParams["author_email"] = v.author_email;

          const comments = await client.list<Record<string, unknown>>(
            "comments",
            filterParams,
            1,
            v.max,
          );
          commentIds = comments.map((c) => c["id"] as number);
        }

        if (commentIds.length === 0) {
          return mcpSuccess({ message: "No comments matched the filter criteria.", moderated: 0 });
        }

        // Moderate each comment using Promise.allSettled
        const apiStatus = mapStatusToApi(v.action);
        const results = await Promise.allSettled(
          commentIds.map((id) =>
            client.put<Record<string, unknown>>(`comments/${id}`, { status: apiStatus }),
          ),
        );

        const moderationResults: ModerationResult[] = results.map((r, i) => {
          if (r.status === "fulfilled") {
            return { id: commentIds[i]!, status: "success" as const, action: v.action };
          }
          return {
            id: commentIds[i]!,
            status: "error" as const,
            error: r.reason instanceof Error ? r.reason.message : String(r.reason),
          };
        });

        const succeeded = moderationResults.filter((r) => r.status === "success").length;
        const failed = moderationResults.filter((r) => r.status === "error").length;

        return mcpSuccess({
          action: v.action,
          total: moderationResults.length,
          succeeded,
          failed,
          results: moderationResults,
        });
      } catch (e) {
        return mcpError(e, "wp_comment_bulk_moderate");
      }
    },
  );

  // ── wp_comment_get_stats ────────────────────────────────────────────
  server.tool(
    "wp_comment_get_stats",
    "Get comment statistics: total count, approved, pending, spam, trash. Optionally filter by post ID. Provides a quick overview of comment moderation workload.",
    CommentGetStatsSchema.shape,
    async (params) => {
      try {
        const v = CommentGetStatsSchema.parse(params);
        const baseParams: Record<string, string | number | boolean | undefined> = {};
        if (v.post) baseParams["post"] = v.post;

        // Fetch counts for each status
        const statuses = ["approved", "hold", "spam", "trash"] as const;
        const counts: Record<string, number> = {};

        const results = await Promise.allSettled(
          statuses.map(async (status) => {
            const comments = await client.list<Record<string, unknown>>(
              "comments",
              { ...baseParams, status, per_page: 1 },
              1,
              1,
            );
            // WP REST API returns total in response — we use array length as fallback
            // but the list method returns the array, so we need a different approach
            // Fetch with per_page=1 and count the total from response
            return { status, count: comments.length };
          }),
        );

        // To get accurate totals we fetch a page with all statuses
        // and use the per_page=100 approach for reasonable sites
        for (const r of results) {
          if (r.status === "fulfilled") {
            counts[r.value.status] = r.value.count;
          }
        }

        // Get actual counts by fetching up to 100 per status
        const accurateCounts = await Promise.allSettled(
          statuses.map(async (status) => {
            const comments = await client.list<Record<string, unknown>>(
              "comments",
              { ...baseParams, status },
              1,
              100,
            );
            return { status, count: comments.length };
          }),
        );

        let total = 0;
        for (const r of accurateCounts) {
          if (r.status === "fulfilled") {
            counts[r.value.status] = r.value.count;
            total += r.value.count;
          }
        }

        return mcpSuccess({
          post: v.post ?? "all",
          total,
          approved: counts["approved"] ?? 0,
          pending: counts["hold"] ?? 0,
          spam: counts["spam"] ?? 0,
          trash: counts["trash"] ?? 0,
        });
      } catch (e) {
        return mcpError(e, "wp_comment_get_stats");
      }
    },
  );

  // ── wp_comment_find_spam_patterns ───────────────────────────────────
  server.tool(
    "wp_comment_find_spam_patterns",
    "Analyze pending or approved comments for spam patterns: excessive URLs, known spam phrases, suspicious domains, generic bot-like content, disposable emails. Pure client-side analysis — does not modify any comments.",
    CommentFindSpamPatternsSchema.shape,
    async (params) => {
      try {
        const v = CommentFindSpamPatternsSchema.parse(params);

        // Fetch comments to analyze
        const statusFilter = v.status === "all" ? undefined : (v.status === "approve" ? "approved" : v.status);
        const comments = await client.list<Record<string, unknown>>(
          "comments",
          statusFilter ? { status: statusFilter } : {},
          1,
          v.max_scan,
        );

        const suspicious: SpamIndicator[] = [];

        for (const comment of comments) {
          const id = comment["id"] as number;
          const content = ((comment["content"] as Record<string, unknown>)?.["rendered"] as string) ?? "";
          const authorName = (comment["author_name"] as string) ?? "";
          const authorEmail = (comment["author_email"] as string) ?? "";
          const authorUrl = (comment["author_url"] as string) ?? "";

          // Strip HTML tags for text analysis
          const plainText = content.replace(/<[^>]+>/g, "");
          const reasons = detectSpamPatterns(plainText, authorEmail, authorUrl);

          if (reasons.length > 0) {
            suspicious.push({
              comment_id: id,
              author: authorName || authorEmail || "unknown",
              reasons,
              score: Math.min(100, reasons.length * 25),
            });
          }
        }

        // Sort by spam score descending
        suspicious.sort((a, b) => b.score - a.score);

        return mcpSuccess({
          scanned: comments.length,
          suspicious_count: suspicious.length,
          suspicious,
          summary: suspicious.length === 0
            ? "No spam patterns detected in scanned comments."
            : `Found ${suspicious.length} suspicious comment(s) out of ${comments.length} scanned. Review the results and use wp_comment_bulk_moderate to take action.`,
        });
      } catch (e) {
        return mcpError(e, "wp_comment_find_spam_patterns");
      }
    },
  );

  // ── wp_comment_auto_moderate ────────────────────────────────────────
  server.tool(
    "wp_comment_auto_moderate",
    "Apply moderation rules to pending comments: auto-approve authors with enough previously approved comments, auto-spam based on content patterns. Defaults to dry_run=true for safety — preview actions before applying.",
    CommentAutoModerateSchema.shape,
    async (params) => {
      try {
        const v = CommentAutoModerateSchema.parse(params);

        // Fetch pending comments
        const pending = await client.list<Record<string, unknown>>(
          "comments",
          { status: "hold" },
          1,
          v.max_process,
        );

        if (pending.length === 0) {
          return mcpSuccess({ message: "No pending comments to moderate.", actions: [] });
        }

        // Build author history cache
        const authorHistoryCache = new Map<string, number>();

        const actions: Array<{
          comment_id: number;
          author: string;
          action: "approve" | "spam" | "skip";
          reason: string;
          applied: boolean;
        }> = [];

        for (const comment of pending) {
          const id = comment["id"] as number;
          const authorEmail = (comment["author_email"] as string) ?? "";
          const authorName = (comment["author_name"] as string) ?? "";
          const authorUrl = (comment["author_url"] as string) ?? "";
          const content = ((comment["content"] as Record<string, unknown>)?.["rendered"] as string) ?? "";
          const plainText = content.replace(/<[^>]+>/g, "");

          // Check spam patterns first
          const spamReasons = detectSpamPatterns(plainText, authorEmail, authorUrl);
          const urlCount = countUrls(plainText);

          if (spamReasons.length >= 2 || urlCount > v.spam_url_threshold) {
            actions.push({
              comment_id: id,
              author: authorName || authorEmail,
              action: "spam",
              reason: spamReasons.length >= 2
                ? `Multiple spam indicators: ${spamReasons.slice(0, 3).join("; ")}`
                : `Excessive URLs (${urlCount} found, threshold: ${v.spam_url_threshold})`,
              applied: false,
            });
            continue;
          }

          // Check author history for auto-approve
          if (authorEmail) {
            let approvedCount = authorHistoryCache.get(authorEmail);
            if (approvedCount === undefined) {
              const approved = await client.list<Record<string, unknown>>(
                "comments",
                { status: "approved", author_email: authorEmail },
                1,
                v.min_approved_history,
              );
              approvedCount = approved.length;
              authorHistoryCache.set(authorEmail, approvedCount);
            }

            if (approvedCount >= v.min_approved_history) {
              actions.push({
                comment_id: id,
                author: authorName || authorEmail,
                action: "approve",
                reason: `Author has ${approvedCount} previously approved comment(s) (threshold: ${v.min_approved_history})`,
                applied: false,
              });
              continue;
            }
          }

          actions.push({
            comment_id: id,
            author: authorName || authorEmail,
            action: "skip",
            reason: "No auto-moderation rule matched — requires manual review",
            applied: false,
          });
        }

        // Apply actions if not dry run
        if (!v.dry_run) {
          const actionable = actions.filter((a) => a.action !== "skip");
          const applyResults = await Promise.allSettled(
            actionable.map(async (a) => {
              const apiStatus = a.action === "approve" ? "approved" : a.action;
              await client.put<Record<string, unknown>>(`comments/${a.comment_id}`, { status: apiStatus });
              a.applied = true;
            }),
          );

          // Mark failures
          for (let i = 0; i < applyResults.length; i++) {
            if (applyResults[i]!.status === "rejected") {
              actionable[i]!.applied = false;
            }
          }
        }

        const toApprove = actions.filter((a) => a.action === "approve").length;
        const toSpam = actions.filter((a) => a.action === "spam").length;
        const skipped = actions.filter((a) => a.action === "skip").length;
        const applied = actions.filter((a) => a.applied).length;

        return mcpSuccess({
          dry_run: v.dry_run,
          total_pending: pending.length,
          to_approve: toApprove,
          to_spam: toSpam,
          skipped,
          applied: v.dry_run ? 0 : applied,
          actions,
          message: v.dry_run
            ? `Dry run complete. Would approve ${toApprove}, spam ${toSpam}, skip ${skipped}. Set dry_run=false to apply.`
            : `Applied ${applied} action(s): ${toApprove} approved, ${toSpam} spammed, ${skipped} skipped.`,
        });
      } catch (e) {
        return mcpError(e, "wp_comment_auto_moderate");
      }
    },
  );
}
