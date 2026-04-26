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
  UpdateRedirectSchema,
  DeleteRedirectSchema,
  CheckPremiumSchema,
  ListYoastVariablesSchema,
  GetSchemaSchema,
  GetSitemapIndexSchema,
  BulkGetSeoSchema,
  BulkUpdateSeoSchema,
} from "../schemas/index.js";

const YOAST_TEMPLATE_VARIABLES = [
  { variable: "%%title%%",       description: "The title of the post, page, or archive" },
  { variable: "%%sitename%%",    description: "The site name set in WordPress general settings" },
  { variable: "%%sep%%",         description: "The separator defined in Yoast SEO settings" },
  { variable: "%%excerpt%%",     description: "The post excerpt (auto-generated if empty)" },
  { variable: "%%category%%",    description: "The primary category name" },
  { variable: "%%tag%%",         description: "The primary tag name" },
  { variable: "%%author%%",      description: "The post author display name" },
  { variable: "%%date%%",        description: "The post publication date" },
  { variable: "%%modified%%",    description: "The post last modified date" },
  { variable: "%%id%%",          description: "The post or page ID" },
  { variable: "%%name%%",        description: "The post author user_nicename" },
  { variable: "%%pagetotal%%",   description: "The total number of pages in a paginated sequence" },
  { variable: "%%pagenumber%%",  description: "The current page number in a paginated sequence" },
  { variable: "%%searchphrase%%",description: "The search phrase (search results page only)" },
  { variable: "%%term_title%%",  description: "The taxonomy term title" },
  { variable: "%%term_description%%", description: "The taxonomy term description" },
];

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

  // ── Update Redirect ──────────────────────────────────────────────
  server.tool(
    "yoast_update_redirect",
    "Update an existing URL redirect in Yoast SEO Premium. Change origin, target, or redirect type.",
    UpdateRedirectSchema.shape,
    async (params) => {
      try {
        const { id, origin, target, type } = UpdateRedirectSchema.parse(params);
        const data: Record<string, unknown> = {};
        if (origin !== undefined) data.origin = origin;
        if (target !== undefined) data.target = target;
        if (type !== undefined) data.type = type;
        const redirect = await client.updateRedirect(id, data as { origin?: string; target?: string; type?: number });
        return mcpSuccess(redirect);
      } catch (e) {
        return mcpError(e, "yoast_update_redirect");
      }
    },
  );

  // ── Delete Redirect ─────────────────────────────────────────────
  server.tool(
    "yoast_delete_redirect",
    "Delete a URL redirect from Yoast SEO Premium by its ID.",
    DeleteRedirectSchema.shape,
    async (params) => {
      try {
        const { id } = DeleteRedirectSchema.parse(params);
        await client.deleteRedirect(id);
        return mcpSuccess({ deleted: true, id });
      } catch (e) {
        return mcpError(e, "yoast_delete_redirect");
      }
    },
  );

  // ── Check Premium ───────────────────────────────────────────────
  server.tool(
    "yoast_check_premium",
    "Check whether Yoast SEO Premium is active on the WordPress site by probing the redirects endpoint.",
    CheckPremiumSchema.shape,
    async () => {
      try {
        await client.listRedirects();
        return mcpSuccess({ premium: true });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (message.includes("404") || message.includes("Not Found") || message.includes("rest_no_route")) {
          return mcpSuccess({ premium: false, reason: "Yoast SEO Premium redirects endpoint not available" });
        }
        return mcpError(e, "yoast_check_premium");
      }
    },
  );

  // ── List Yoast Variables ────────────────────────────────────────
  server.tool(
    "yoast_list_variables",
    "List all available Yoast SEO template variables with descriptions. These can be used in SEO title and meta description templates.",
    ListYoastVariablesSchema.shape,
    async () => {
      try {
        return mcpSuccess({
          variables: YOAST_TEMPLATE_VARIABLES,
          usage: "Use these variables in SEO title and meta description fields. Example: %%title%% %%sep%% %%sitename%%",
        });
      } catch (e) {
        return mcpError(e, "yoast_list_variables");
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
          sitemaps.push({ loc: match[1]!, lastmod: match[2] });
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
