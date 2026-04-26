/**
 * Staging / migration tools — cross-site content synchronisation
 * using the SiteManager for multi-site WordPress setups.
 *
 * Every tool validates that at least two sites are configured before
 * proceeding, and returns a helpful error message otherwise.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { SiteManager } from "../site-manager.js";
import {
  StagingPushContentSchema,
  StagingPullContentSchema,
  StagingCompareContentSchema,
  StagingSyncTaxonomiesSchema,
  StagingSyncMediaSchema,
  StagingListDifferencesSchema,
} from "../schemas/index.js";

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const SINGLE_SITE_MSG =
  "Staging tools require at least two configured WordPress sites. " +
  "Add a second site to your CMSMCP configuration (e.g., a staging and production pair) " +
  "then restart the MCP server. Use wp_list_sites to see configured sites.";

function requireMultiSite(siteManager: SiteManager, toolName: string): ReturnType<typeof mcpError> | null {
  if (siteManager.siteCount < 2) {
    return mcpError(new Error(SINGLE_SITE_MSG), toolName);
  }
  return null;
}

/** Extract rendered field value from WP REST response. */
function rendered(field: unknown): string {
  if (field && typeof field === "object" && "rendered" in (field as Record<string, unknown>)) {
    return String((field as Record<string, string>)["rendered"] ?? "");
  }
  return typeof field === "string" ? field : "";
}

/* ------------------------------------------------------------------ */
/*  Register staging tools                                             */
/* ------------------------------------------------------------------ */

export function registerStagingTools(server: McpServer, siteManager: SiteManager): void {
  /* ── wp_staging_push_content ─────────────────────────────────────── */
  server.tool(
    "wp_staging_push_content",
    "Push a post or page from the active site to another configured site. " +
      "Copies title, content, excerpt, status, meta, and optionally featured image and taxonomy assignments.",
    StagingPushContentSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_push_content");
        if (guard) return guard;

        const { post_id, post_type, target_site_id, include_media, include_taxonomies } =
          StagingPushContentSchema.parse(params);

        const sourceClient = siteManager.getSiteClient();
        const targetClient = siteManager.getSiteClient(target_site_id);

        // Fetch source post
        const post = await sourceClient.get<Record<string, unknown>>(`${post_type}/${post_id}`);

        // Build payload for the target site
        const payload: Record<string, unknown> = {
          title: rendered(post["title"]),
          content: rendered(post["content"]),
          excerpt: rendered(post["excerpt"]),
          status: post["status"] ?? "draft",
          slug: post["slug"],
        };

        // Copy featured image
        let mediaCopied = false;
        if (include_media && post["featured_media"]) {
          try {
            const media = await sourceClient.get<Record<string, unknown>>(
              `media/${post["featured_media"]}`,
            );
            const sourceUrl = (media["source_url"] as string) ?? "";
            if (sourceUrl) {
              const uploaded = await targetClient.post<Record<string, unknown>>("media", {
                source_url: sourceUrl,
                title: rendered(media["title"]),
                alt_text: media["alt_text"] ?? "",
              });
              payload["featured_media"] = uploaded["id"];
              mediaCopied = true;
            }
          } catch {
            // Media copy is best-effort — continue without it
          }
        }

        // Copy taxonomies
        const taxonomiesCopied: string[] = [];
        if (include_taxonomies) {
          for (const tax of ["categories", "tags"] as const) {
            const ids = post[tax] as number[] | undefined;
            if (ids && ids.length > 0) {
              try {
                const sourceTerms = await sourceClient.list<Record<string, unknown>>(
                  tax,
                  {},
                  1,
                  100,
                );
                const relevantTerms = sourceTerms.filter((t) =>
                  ids.includes(t["id"] as number),
                );

                const targetTerms = await targetClient.list<Record<string, unknown>>(
                  tax,
                  {},
                  1,
                  100,
                );
                const targetSlugs = new Map(
                  targetTerms.map((t) => [t["slug"] as string, t["id"] as number]),
                );

                const mappedIds: number[] = [];
                for (const term of relevantTerms) {
                  const slug = term["slug"] as string;
                  if (targetSlugs.has(slug)) {
                    mappedIds.push(targetSlugs.get(slug)!);
                  } else {
                    // Create the term on the target
                    const created = await targetClient.post<Record<string, unknown>>(tax, {
                      name: term["name"],
                      slug,
                      description: term["description"] ?? "",
                    });
                    mappedIds.push(created["id"] as number);
                  }
                }

                if (mappedIds.length > 0) {
                  payload[tax] = mappedIds;
                  taxonomiesCopied.push(tax);
                }
              } catch {
                // Taxonomy copy is best-effort
              }
            }
          }
        }

        // Create or update on target (create as new post)
        const created = await targetClient.post<Record<string, unknown>>(post_type, payload);

        return mcpSuccess({
          message: `Pushed "${rendered(post["title"])}" to target site`,
          source_id: post_id,
          target_id: created["id"],
          target_url: (created["link"] as string) ?? null,
          media_copied: mediaCopied,
          taxonomies_copied: taxonomiesCopied,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_push_content");
      }
    },
  );

  /* ── wp_staging_pull_content ─────────────────────────────────────── */
  server.tool(
    "wp_staging_pull_content",
    "Pull a post or page from another configured site to the active site. " +
      "Creates a new post on the active site with the pulled content.",
    StagingPullContentSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_pull_content");
        if (guard) return guard;

        const { post_id, post_type, source_site_id, include_media, include_taxonomies } =
          StagingPullContentSchema.parse(params);

        const sourceClient = siteManager.getSiteClient(source_site_id);
        const targetClient = siteManager.getSiteClient(); // active site

        // Fetch source post
        const post = await sourceClient.get<Record<string, unknown>>(`${post_type}/${post_id}`);

        const payload: Record<string, unknown> = {
          title: rendered(post["title"]),
          content: rendered(post["content"]),
          excerpt: rendered(post["excerpt"]),
          status: "draft", // Always pull as draft for safety
          slug: post["slug"],
        };

        // Copy featured image
        let mediaCopied = false;
        if (include_media && post["featured_media"]) {
          try {
            const media = await sourceClient.get<Record<string, unknown>>(
              `media/${post["featured_media"]}`,
            );
            const sourceUrl = (media["source_url"] as string) ?? "";
            if (sourceUrl) {
              const uploaded = await targetClient.post<Record<string, unknown>>("media", {
                source_url: sourceUrl,
                title: rendered(media["title"]),
                alt_text: media["alt_text"] ?? "",
              });
              payload["featured_media"] = uploaded["id"];
              mediaCopied = true;
            }
          } catch {
            // Best-effort
          }
        }

        // Copy taxonomies
        const taxonomiesCopied: string[] = [];
        if (include_taxonomies) {
          for (const tax of ["categories", "tags"] as const) {
            const ids = post[tax] as number[] | undefined;
            if (ids && ids.length > 0) {
              try {
                const sourceTerms = await sourceClient.list<Record<string, unknown>>(tax, {}, 1, 100);
                const relevantTerms = sourceTerms.filter((t) => ids.includes(t["id"] as number));

                const targetTerms = await targetClient.list<Record<string, unknown>>(tax, {}, 1, 100);
                const targetSlugs = new Map(
                  targetTerms.map((t) => [t["slug"] as string, t["id"] as number]),
                );

                const mappedIds: number[] = [];
                for (const term of relevantTerms) {
                  const slug = term["slug"] as string;
                  if (targetSlugs.has(slug)) {
                    mappedIds.push(targetSlugs.get(slug)!);
                  } else {
                    const created = await targetClient.post<Record<string, unknown>>(tax, {
                      name: term["name"],
                      slug,
                      description: term["description"] ?? "",
                    });
                    mappedIds.push(created["id"] as number);
                  }
                }

                if (mappedIds.length > 0) {
                  payload[tax] = mappedIds;
                  taxonomiesCopied.push(tax);
                }
              } catch {
                // Best-effort
              }
            }
          }
        }

        const created = await targetClient.post<Record<string, unknown>>(post_type, payload);

        return mcpSuccess({
          message: `Pulled "${rendered(post["title"])}" from source site (created as draft)`,
          source_id: post_id,
          source_site: source_site_id,
          local_id: created["id"],
          local_url: (created["link"] as string) ?? null,
          media_copied: mediaCopied,
          taxonomies_copied: taxonomiesCopied,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_pull_content");
      }
    },
  );

  /* ── wp_staging_compare_content ──────────────────────────────────── */
  server.tool(
    "wp_staging_compare_content",
    "Compare a post or page between the active site and another configured site. " +
      "Returns a diff of title, content, excerpt, status, and modified date. Match by ID or slug.",
    StagingCompareContentSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_compare_content");
        if (guard) return guard;

        const { post_id, post_type, target_site_id, match_by } =
          StagingCompareContentSchema.parse(params);

        const activeClient = siteManager.getSiteClient();
        const targetClient = siteManager.getSiteClient(target_site_id);

        // Fetch from active site
        const activePost = await activeClient.get<Record<string, unknown>>(
          `${post_type}/${post_id}`,
        );

        // Fetch from target site
        let targetPost: Record<string, unknown>;
        if (match_by === "id") {
          targetPost = await targetClient.get<Record<string, unknown>>(
            `${post_type}/${post_id}`,
          );
        } else {
          // Match by slug
          const slug = activePost["slug"] as string;
          const matches = await targetClient.list<Record<string, unknown>>(
            post_type,
            { slug, status: "any" },
            1,
            1,
          );
          if (matches.length === 0) {
            return mcpSuccess({
              match_by: "slug",
              slug,
              status: "not_found",
              message: `No matching ${post_type.slice(0, -1)} with slug "${slug}" found on target site.`,
            });
          }
          targetPost = matches[0]!;
        }

        // Compare fields
        const fields = ["title", "content", "excerpt"] as const;
        const differences: Record<string, { active: string; target: string; changed: boolean }> = {};

        for (const field of fields) {
          const a = rendered(activePost[field]);
          const b = rendered(targetPost[field]);
          differences[field] = { active: a.slice(0, 500), target: b.slice(0, 500), changed: a !== b };
        }

        const statusChanged = activePost["status"] !== targetPost["status"];
        const activeModified = activePost["modified"] as string;
        const targetModified = targetPost["modified"] as string;

        return mcpSuccess({
          active_id: activePost["id"],
          target_id: targetPost["id"],
          match_by,
          slug: activePost["slug"],
          status: {
            active: activePost["status"],
            target: targetPost["status"],
            changed: statusChanged,
          },
          modified: {
            active: activeModified,
            target: targetModified,
            active_is_newer: activeModified > targetModified,
          },
          differences,
          has_changes: Object.values(differences).some((d) => d.changed) || statusChanged,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_compare_content");
      }
    },
  );

  /* ── wp_staging_sync_taxonomies ──────────────────────────────────── */
  server.tool(
    "wp_staging_sync_taxonomies",
    "Sync categories or tags between two configured WordPress sites. " +
      "Push copies terms from the active site to the target; pull copies from target to active. " +
      "Existing terms (matched by slug) are skipped.",
    StagingSyncTaxonomiesSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_sync_taxonomies");
        if (guard) return guard;

        const { taxonomy, target_site_id, direction } =
          StagingSyncTaxonomiesSchema.parse(params);

        const sourceClient =
          direction === "push"
            ? siteManager.getSiteClient()
            : siteManager.getSiteClient(target_site_id);
        const destClient =
          direction === "push"
            ? siteManager.getSiteClient(target_site_id)
            : siteManager.getSiteClient();

        // Fetch all terms from both sides
        const sourceTerms = await sourceClient.list<Record<string, unknown>>(
          taxonomy,
          {},
          1,
          100,
        );
        const destTerms = await destClient.list<Record<string, unknown>>(
          taxonomy,
          {},
          1,
          100,
        );

        const destSlugs = new Set(destTerms.map((t) => t["slug"] as string));

        const created: string[] = [];
        const skipped: string[] = [];

        for (const term of sourceTerms) {
          const slug = term["slug"] as string;
          if (destSlugs.has(slug)) {
            skipped.push(slug);
            continue;
          }

          await destClient.post<Record<string, unknown>>(taxonomy, {
            name: term["name"],
            slug,
            description: term["description"] ?? "",
          });
          created.push(slug);
        }

        return mcpSuccess({
          taxonomy,
          direction,
          created_count: created.length,
          created,
          skipped_count: skipped.length,
          skipped,
          source_total: sourceTerms.length,
          destination_total: destTerms.length + created.length,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_sync_taxonomies");
      }
    },
  );

  /* ── wp_staging_sync_media ───────────────────────────────────────── */
  server.tool(
    "wp_staging_sync_media",
    "Copy media attachments from the active site to another configured site by media IDs. " +
      "Downloads media from the source and uploads it to the target via URL.",
    StagingSyncMediaSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_sync_media");
        if (guard) return guard;

        const { media_ids, target_site_id } = StagingSyncMediaSchema.parse(params);

        const sourceClient = siteManager.getSiteClient();
        const targetClient = siteManager.getSiteClient(target_site_id);

        const results: Array<{
          source_id: number;
          target_id: number | null;
          status: "copied" | "failed";
          error?: string;
        }> = [];

        for (const mediaId of media_ids) {
          try {
            const media = await sourceClient.get<Record<string, unknown>>(`media/${mediaId}`);
            const sourceUrl = (media["source_url"] as string) ?? "";

            if (!sourceUrl) {
              results.push({ source_id: mediaId, target_id: null, status: "failed", error: "No source URL" });
              continue;
            }

            const uploaded = await targetClient.post<Record<string, unknown>>("media", {
              source_url: sourceUrl,
              title: rendered(media["title"]),
              alt_text: media["alt_text"] ?? "",
              caption: rendered(media["caption"]),
              description: rendered(media["description"]),
            });

            results.push({
              source_id: mediaId,
              target_id: uploaded["id"] as number,
              status: "copied",
            });
          } catch (err) {
            results.push({
              source_id: mediaId,
              target_id: null,
              status: "failed",
              error: err instanceof Error ? err.message : "Unknown error",
            });
          }
        }

        const copied = results.filter((r) => r.status === "copied").length;
        const failed = results.filter((r) => r.status === "failed").length;

        return mcpSuccess({
          total: media_ids.length,
          copied,
          failed,
          results,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_sync_media");
      }
    },
  );

  /* ── wp_staging_list_differences ─────────────────────────────────── */
  server.tool(
    "wp_staging_list_differences",
    "List all posts or pages that differ between the active site and another configured site. " +
      "Matches content by slug and reports which items are only on one site, or differ in content/status.",
    StagingListDifferencesSchema.shape,
    async (params) => {
      try {
        const guard = requireMultiSite(siteManager, "wp_staging_list_differences");
        if (guard) return guard;

        const { post_type, target_site_id, page, per_page } =
          StagingListDifferencesSchema.parse(params);

        const activeClient = siteManager.getSiteClient();
        const targetClient = siteManager.getSiteClient(target_site_id);

        // Fetch posts from both sites
        const activePosts = await activeClient.list<Record<string, unknown>>(
          post_type,
          { status: "any" },
          page,
          per_page,
        );
        const targetPosts = await targetClient.list<Record<string, unknown>>(
          post_type,
          { status: "any" },
          page,
          per_page,
        );

        // Build slug maps
        const activeBySlug = new Map(
          activePosts.map((p) => [p["slug"] as string, p]),
        );
        const targetBySlug = new Map(
          targetPosts.map((p) => [p["slug"] as string, p]),
        );

        const differences: Array<{
          slug: string;
          status: "active_only" | "target_only" | "content_differs" | "status_differs" | "identical";
          active_id?: number;
          target_id?: number;
          active_title?: string;
          target_title?: string;
          active_status?: string;
          target_status?: string;
          active_modified?: string;
          target_modified?: string;
        }> = [];

        // Check all active posts
        for (const [slug, aPost] of activeBySlug) {
          const tPost = targetBySlug.get(slug);
          if (!tPost) {
            differences.push({
              slug,
              status: "active_only",
              active_id: aPost["id"] as number,
              active_title: rendered(aPost["title"]),
              active_status: aPost["status"] as string,
            });
            continue;
          }

          const aContent = rendered(aPost["content"]);
          const tContent = rendered(tPost["content"]);
          const aStatus = aPost["status"] as string;
          const tStatus = tPost["status"] as string;

          if (aContent !== tContent) {
            differences.push({
              slug,
              status: "content_differs",
              active_id: aPost["id"] as number,
              target_id: tPost["id"] as number,
              active_title: rendered(aPost["title"]),
              target_title: rendered(tPost["title"]),
              active_status: aStatus,
              target_status: tStatus,
              active_modified: aPost["modified"] as string,
              target_modified: tPost["modified"] as string,
            });
          } else if (aStatus !== tStatus) {
            differences.push({
              slug,
              status: "status_differs",
              active_id: aPost["id"] as number,
              target_id: tPost["id"] as number,
              active_status: aStatus,
              target_status: tStatus,
            });
          }
          // identical posts are not included in the diff list
        }

        // Check target-only posts
        for (const [slug, tPost] of targetBySlug) {
          if (!activeBySlug.has(slug)) {
            differences.push({
              slug,
              status: "target_only",
              target_id: tPost["id"] as number,
              target_title: rendered(tPost["title"]),
              target_status: tPost["status"] as string,
            });
          }
        }

        return mcpSuccess({
          post_type,
          target_site_id,
          page,
          per_page,
          active_count: activePosts.length,
          target_count: targetPosts.length,
          differences_count: differences.length,
          differences,
        });
      } catch (e) {
        return mcpError(e, "wp_staging_list_differences");
      }
    },
  );
}
