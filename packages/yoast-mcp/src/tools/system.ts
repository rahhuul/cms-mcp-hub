/**
 * System tools: redirects, schema/structured data, sitemap, and bulk operations.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { YoastClient } from "../api/client.js";
import type { YoastSeoMeta } from "../types/index.js";
import {
  ListRedirectsSchema,
  CreateRedirectSchema,
  GetSchemaSchema,
  GetSitemapIndexSchema,
  BulkGetSeoSchema,
  BulkUpdateSeoSchema,
} from "../schemas/index.js";

/** Map post_type enum value to WP REST plural form */
function pluralize(postType: string): string {
  return postType === "page" ? "pages" : postType === "product" ? "products" : "posts";
}

export function registerSystemTools(server: McpServer, client: YoastClient): void {

  // ── Bulk Get SEO ─────────────────────────────────────────────────
  server.tool(
    "yoast_bulk_get_seo",
    "Get SEO metadata for multiple posts/pages at once (max 50). Returns title, meta description, focus keyword, and scores for each.",
    BulkGetSeoSchema.shape,
    async (params) => {
      try {
        const { post_ids, post_type } = BulkGetSeoSchema.parse(params);
        const endpoint = pluralize(post_type);
        const results = await Promise.all(
          post_ids.map(async (id) => {
            try {
              const post = await client.getPost(id, endpoint);
              const meta = post.meta as Record<string, unknown>;
              return {
                post_id: post.id,
                title: post.title.rendered,
                slug: post.slug,
                seo: {
                  title: meta["_yoast_wpseo_title"] ?? "",
                  meta_description: meta["_yoast_wpseo_metadesc"] ?? "",
                  focus_keyword: meta["_yoast_wpseo_focuskw"] ?? "",
                  seo_score: meta["_yoast_wpseo_linkdex"] ?? null,
                  readability_score: meta["_yoast_wpseo_content_score"] ?? null,
                },
              };
            } catch (err) {
              return {
                post_id: id,
                error: err instanceof Error ? err.message : "Failed to fetch",
              };
            }
          }),
        );
        return mcpSuccess({ count: results.length, results });
      } catch (e) {
        return mcpError(e, "yoast_bulk_get_seo");
      }
    },
  );

  // ── Bulk Update SEO ──────────────────────────────────────────────
  server.tool(
    "yoast_bulk_update_seo",
    "Update SEO metadata for multiple posts/pages at once (max 25). Set title, meta description, and focus keyword per post.",
    BulkUpdateSeoSchema.shape,
    async (params) => {
      try {
        const { updates, post_type } = BulkUpdateSeoSchema.parse(params);
        const endpoint = pluralize(post_type);
        const results = await Promise.all(
          updates.map(async ({ post_id, title, meta_description, focus_keyword }) => {
            try {
              const meta: YoastSeoMeta = {};
              if (title !== undefined) meta._yoast_wpseo_title = title;
              if (meta_description !== undefined) meta._yoast_wpseo_metadesc = meta_description;
              if (focus_keyword !== undefined) meta._yoast_wpseo_focuskw = focus_keyword;

              const updated = await client.updatePostMeta(post_id, endpoint, meta);
              return { post_id: updated.id, status: "updated", updated_fields: Object.keys(meta) };
            } catch (err) {
              return {
                post_id,
                status: "error",
                error: err instanceof Error ? err.message : "Failed to update",
              };
            }
          }),
        );
        const succeeded = results.filter((r) => r.status === "updated").length;
        const failed = results.filter((r) => r.status === "error").length;
        return mcpSuccess({ total: results.length, succeeded, failed, results });
      } catch (e) {
        return mcpError(e, "yoast_bulk_update_seo");
      }
    },
  );

  // ── List Redirects ───────────────────────────────────────────────
  server.tool(
    "yoast_list_redirects",
    "List all URL redirects configured in Yoast SEO Premium. Returns origin, target, redirect type (301/302/307/410).",
    ListRedirectsSchema.shape,
    async () => {
      try {
        const redirects = await client.listRedirects();
        return mcpSuccess({ count: redirects.length, redirects });
      } catch (e) {
        return mcpError(e, "yoast_list_redirects");
      }
    },
  );

  // ── Create Redirect ──────────────────────────────────────────────
  server.tool(
    "yoast_create_redirect",
    "Create a URL redirect in Yoast SEO Premium. Supports 301 (permanent), 302 (temporary), 307, and 410 (gone) redirects.",
    CreateRedirectSchema.shape,
    async (params) => {
      try {
        const data = CreateRedirectSchema.parse(params);
        const redirect = await client.createRedirect(data);
        return mcpSuccess(redirect);
      } catch (e) {
        return mcpError(e, "yoast_create_redirect");
      }
    },
  );

  // ── Get Schema (Structured Data) ─────────────────────────────────
  server.tool(
    "yoast_get_schema",
    "Get JSON-LD structured data (schema.org) that Yoast generates for a given URL. Useful for reviewing and debugging rich snippets.",
    GetSchemaSchema.shape,
    async (params) => {
      try {
        const { url } = GetSchemaSchema.parse(params);
        const head = await client.getHead(url);
        const schema = head.json?.["schema"] ?? head.json?.["schema_org"] ?? null;
        return mcpSuccess({
          url,
          status: head.status,
          schema: schema ?? head.json,
        });
      } catch (e) {
        return mcpError(e, "yoast_get_schema");
      }
    },
  );

  // ── Get Sitemap Index ────────────────────────────────────────────
  server.tool(
    "yoast_get_sitemap_index",
    "Fetch the XML sitemap index generated by Yoast SEO. Returns the list of sub-sitemaps (posts, pages, categories, etc.) with last modified dates.",
    GetSitemapIndexSchema.shape,
    async () => {
      try {
        const xml = await client.getSitemapIndex();
        // Parse sitemap index XML to extract sitemap entries
        const sitemaps: Array<{ loc: string; lastmod?: string }> = [];
        const locMatches = xml.matchAll(/<sitemap>\s*<loc>([^<]+)<\/loc>(?:\s*<lastmod>([^<]+)<\/lastmod>)?\s*<\/sitemap>/g);
        for (const match of locMatches) {
          sitemaps.push({ loc: match[1], lastmod: match[2] });
        }
        return mcpSuccess({
          url: `${client.getSiteUrl()}/sitemap_index.xml`,
          sitemap_count: sitemaps.length,
          sitemaps,
        });
      } catch (e) {
        return mcpError(e, "yoast_get_sitemap_index");
      }
    },
  );
}
