/**
 * SEO tools: get/update SEO data, scores, indexing status, and social metadata.
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpError, mcpSuccess } from "@cmsmcp/shared";
import type { YoastClient } from "../api/client.js";
import type { YoastSeoMeta } from "../types/index.js";
import {
  GetSeoDataSchema,
  UpdateSeoDataSchema,
  GetSeoScoreSchema,
  GetIndexableStatusSchema,
  UpdateIndexableSchema,
  GetSocialDataSchema,
  UpdateSocialDataSchema,
  GetSiteConfigSchema,
} from "../schemas/index.js";

/** Map post_type enum value to WP REST plural form */
function pluralize(postType: string): string {
  return postType === "page" ? "pages" : postType === "product" ? "products" : "posts";
}

export function registerSeoTools(server: McpServer, client: YoastClient): void {

  // ── Get Site Config ─────────────────────────────────────────────
  server.tool(
    "yoast_get_site_config",
    "Get Yoast SEO site-wide configuration. Returns business name, logo, social profiles, organization schema settings, and site representation type.",
    GetSiteConfigSchema.shape,
    async () => {
      try {
        const config = await client.getSiteRepresentation();
        return mcpSuccess(config);
      } catch (e) {
        return mcpError(e, "yoast_get_site_config");
      }
    },
  );

  // ── Get SEO Data ─────────────────────────────────────────────────
  server.tool(
    "yoast_get_seo_data",
    "Get Yoast SEO metadata for a WordPress post or page. Returns SEO title, meta description, focus keyword, canonical URL, and indexing status.",
    GetSeoDataSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = GetSeoDataSchema.parse(params);
        const post = await client.getPost(post_id, pluralize(post_type));
        const meta = post.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: post.id,
          title: post.title.rendered,
          slug: post.slug,
          link: post.link,
          seo: {
            title: meta["_yoast_wpseo_title"] ?? "",
            meta_description: meta["_yoast_wpseo_metadesc"] ?? "",
            focus_keyword: meta["_yoast_wpseo_focuskw"] ?? "",
            canonical: meta["_yoast_wpseo_canonical"] ?? "",
            noindex: meta["_yoast_wpseo_meta-robots-noindex"] === "1",
          },
        });
      } catch (e) {
        return mcpError(e, "yoast_get_seo_data");
      }
    },
  );

  // ── Update SEO Data ──────────────────────────────────────────────
  server.tool(
    "yoast_update_seo_data",
    "Update Yoast SEO metadata (title, meta description, focus keyword, canonical) for a WordPress post or page.",
    UpdateSeoDataSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type, title, meta_description, focus_keyword, canonical_url } = UpdateSeoDataSchema.parse(params);
        const meta: YoastSeoMeta = {};
        if (title !== undefined) meta._yoast_wpseo_title = title;
        if (meta_description !== undefined) meta._yoast_wpseo_metadesc = meta_description;
        if (focus_keyword !== undefined) meta._yoast_wpseo_focuskw = focus_keyword;
        if (canonical_url !== undefined) meta._yoast_wpseo_canonical = canonical_url;

        const updated = await client.updatePostMeta(post_id, pluralize(post_type), meta);
        const updatedMeta = updated.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: updated.id,
          updated_fields: Object.keys(meta),
          seo: {
            title: updatedMeta["_yoast_wpseo_title"] ?? "",
            meta_description: updatedMeta["_yoast_wpseo_metadesc"] ?? "",
            focus_keyword: updatedMeta["_yoast_wpseo_focuskw"] ?? "",
            canonical: updatedMeta["_yoast_wpseo_canonical"] ?? "",
          },
        });
      } catch (e) {
        return mcpError(e, "yoast_update_seo_data");
      }
    },
  );

  // ── Get SEO Score ────────────────────────────────────────────────
  server.tool(
    "yoast_get_seo_score",
    "Get Yoast SEO and readability scores for a WordPress post or page. Uses the Yoast head JSON output to extract score indicators.",
    GetSeoScoreSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = GetSeoScoreSchema.parse(params);
        const post = await client.getPost(post_id, pluralize(post_type));
        const meta = post.meta as Record<string, unknown>;

        // Yoast stores scores in post meta as _yoast_wpseo_linkdex (SEO) and _yoast_wpseo_content_score (readability)
        const seoScore = meta["_yoast_wpseo_linkdex"] as string | undefined;
        const readabilityScore = meta["_yoast_wpseo_content_score"] as string | undefined;
        const focusKeyword = meta["_yoast_wpseo_focuskw"] as string | undefined;

        return mcpSuccess({
          post_id: post.id,
          title: post.title.rendered,
          focus_keyword: focusKeyword ?? "",
          seo_score: seoScore ? parseInt(seoScore, 10) : null,
          seo_rating: scoreToRating(seoScore),
          readability_score: readabilityScore ? parseInt(readabilityScore, 10) : null,
          readability_rating: scoreToRating(readabilityScore),
        });
      } catch (e) {
        return mcpError(e, "yoast_get_seo_score");
      }
    },
  );

  // ── Get Indexable Status ─────────────────────────────────────────
  server.tool(
    "yoast_get_indexable_status",
    "Check whether a post/page is set to noindex and its canonical URL configuration.",
    GetIndexableStatusSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = GetIndexableStatusSchema.parse(params);
        const post = await client.getPost(post_id, pluralize(post_type));
        const meta = post.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: post.id,
          title: post.title.rendered,
          link: post.link,
          noindex: meta["_yoast_wpseo_meta-robots-noindex"] === "1",
          canonical: meta["_yoast_wpseo_canonical"] ?? "",
          status: post.status,
        });
      } catch (e) {
        return mcpError(e, "yoast_get_indexable_status");
      }
    },
  );

  // ── Update Indexable ─────────────────────────────────────────────
  server.tool(
    "yoast_update_indexable",
    "Update noindex setting and canonical URL for a post/page. Set noindex=true to prevent search engine indexing.",
    UpdateIndexableSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type, noindex, canonical_url } = UpdateIndexableSchema.parse(params);
        const meta: YoastSeoMeta = {};
        if (noindex !== undefined) meta["_yoast_wpseo_meta-robots-noindex"] = noindex ? "1" : "0";
        if (canonical_url !== undefined) meta._yoast_wpseo_canonical = canonical_url;

        const updated = await client.updatePostMeta(post_id, pluralize(post_type), meta);
        const updatedMeta = updated.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: updated.id,
          noindex: updatedMeta["_yoast_wpseo_meta-robots-noindex"] === "1",
          canonical: updatedMeta["_yoast_wpseo_canonical"] ?? "",
        });
      } catch (e) {
        return mcpError(e, "yoast_update_indexable");
      }
    },
  );

  // ── Get Social Data ──────────────────────────────────────────────
  server.tool(
    "yoast_get_social_data",
    "Get Open Graph and Twitter Card metadata for a post/page. Returns OG title, description, image and Twitter equivalents.",
    GetSocialDataSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type } = GetSocialDataSchema.parse(params);
        const post = await client.getPost(post_id, pluralize(post_type));
        const meta = post.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: post.id,
          title: post.title.rendered,
          open_graph: {
            title: meta["_yoast_wpseo_opengraph-title"] ?? "",
            description: meta["_yoast_wpseo_opengraph-description"] ?? "",
            image: meta["_yoast_wpseo_opengraph-image"] ?? "",
          },
          twitter: {
            title: meta["_yoast_wpseo_twitter-title"] ?? "",
            description: meta["_yoast_wpseo_twitter-description"] ?? "",
            image: meta["_yoast_wpseo_twitter-image"] ?? "",
          },
        });
      } catch (e) {
        return mcpError(e, "yoast_get_social_data");
      }
    },
  );

  // ── Update Social Data ───────────────────────────────────────────
  server.tool(
    "yoast_update_social_data",
    "Update Open Graph (Facebook/LinkedIn) and Twitter Card metadata for a post/page.",
    UpdateSocialDataSchema.shape,
    async (params) => {
      try {
        const { post_id, post_type, og_title, og_description, og_image, twitter_title, twitter_description, twitter_image } = UpdateSocialDataSchema.parse(params);
        const meta: YoastSeoMeta = {};
        if (og_title !== undefined) meta["_yoast_wpseo_opengraph-title"] = og_title;
        if (og_description !== undefined) meta["_yoast_wpseo_opengraph-description"] = og_description;
        if (og_image !== undefined) meta["_yoast_wpseo_opengraph-image"] = og_image;
        if (twitter_title !== undefined) meta["_yoast_wpseo_twitter-title"] = twitter_title;
        if (twitter_description !== undefined) meta["_yoast_wpseo_twitter-description"] = twitter_description;
        if (twitter_image !== undefined) meta["_yoast_wpseo_twitter-image"] = twitter_image;

        const updated = await client.updatePostMeta(post_id, pluralize(post_type), meta);
        const updatedMeta = updated.meta as Record<string, unknown>;
        return mcpSuccess({
          post_id: updated.id,
          updated_fields: Object.keys(meta),
          open_graph: {
            title: updatedMeta["_yoast_wpseo_opengraph-title"] ?? "",
            description: updatedMeta["_yoast_wpseo_opengraph-description"] ?? "",
            image: updatedMeta["_yoast_wpseo_opengraph-image"] ?? "",
          },
          twitter: {
            title: updatedMeta["_yoast_wpseo_twitter-title"] ?? "",
            description: updatedMeta["_yoast_wpseo_twitter-description"] ?? "",
            image: updatedMeta["_yoast_wpseo_twitter-image"] ?? "",
          },
        });
      } catch (e) {
        return mcpError(e, "yoast_update_social_data");
      }
    },
  );
}

/** Convert Yoast numeric score (0-100) to traffic light rating */
function scoreToRating(score: string | undefined): string {
  if (!score) return "unknown";
  const n = parseInt(score, 10);
  if (isNaN(n)) return "unknown";
  if (n === 0) return "not-set";
  if (n < 40) return "needs-improvement";
  if (n < 70) return "ok";
  return "good";
}
