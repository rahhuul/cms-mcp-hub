import { z } from "zod";

const PostType = z.enum(["post", "page", "product"]).default("post").describe("WordPress post type");
const PostId = z.number().int().positive().describe("WordPress post/page ID");

// ═══ SEO Data ══════════════════════════════════════════════════════════

export const GetSeoDataSchema = z.object({
  post_id: PostId,
  post_type: PostType,
});

export const UpdateSeoDataSchema = z.object({
  post_id: PostId,
  post_type: PostType,
  title: z.string().optional().describe("SEO title template (supports Yoast variables like %%title%% %%sep%% %%sitename%%)"),
  meta_description: z.string().max(320).optional().describe("Meta description (recommended: 120-160 chars)"),
  focus_keyword: z.string().optional().describe("Primary focus keyphrase for SEO analysis"),
  canonical_url: z.string().url().optional().describe("Canonical URL to prevent duplicate content"),
});

// ═══ SEO Score ═════════════════════════════════════════════════════════

export const GetSeoScoreSchema = z.object({
  post_id: PostId,
  post_type: PostType,
});

// ═══ Bulk Operations ══════════════════════════════════════════════════

export const BulkGetSeoSchema = z.object({
  post_ids: z.array(PostId).min(1).max(50).describe("Array of post/page IDs (max 50)"),
  post_type: PostType,
});

export const BulkUpdateSeoSchema = z.object({
  updates: z.array(z.object({
    post_id: PostId,
    title: z.string().optional(),
    meta_description: z.string().max(320).optional(),
    focus_keyword: z.string().optional(),
  })).min(1).max(25).describe("Array of SEO updates (max 25)"),
  post_type: PostType,
});

// ═══ Indexing ══════════════════════════════════════════════════════════

export const GetIndexableStatusSchema = z.object({
  post_id: PostId,
  post_type: PostType,
});

export const UpdateIndexableSchema = z.object({
  post_id: PostId,
  post_type: PostType,
  noindex: z.boolean().optional().describe("Set to true to add noindex meta tag"),
  canonical_url: z.string().url().optional().describe("Override canonical URL"),
});

// ═══ Redirects (Yoast Premium) ════════════════════════════════════════

export const ListRedirectsSchema = z.object({});

export const CreateRedirectSchema = z.object({
  origin: z.string().min(1).describe("Source URL path (e.g., /old-page)"),
  url: z.string().min(1).describe("Target URL (e.g., /new-page or https://example.com/page)"),
  type: z.number().int().default(301).describe("HTTP redirect status code (301=permanent, 302=temporary, 307, 410=gone)"),
  format: z.enum(["plain", "regex"]).default("plain").describe("Match format: plain URL or regex pattern"),
});

export const UpdateRedirectSchema = z.object({
  id: z.string().min(1).describe("Redirect ID to update"),
  origin: z.string().optional().describe("New source URL path (e.g., /old-page)"),
  target: z.string().optional().describe("New target URL (e.g., /new-page or https://example.com/page)"),
  type: z.number().int().optional().describe("HTTP redirect status code (301=permanent, 302=temporary, 307, 410=gone)"),
});

export const DeleteRedirectSchema = z.object({
  id: z.string().min(1).describe("Redirect ID to delete"),
});

export const CheckPremiumSchema = z.object({});

export const ListYoastVariablesSchema = z.object({});

export const GetSiteConfigSchema = z.object({});

// ═══ Social (Open Graph / Twitter) ════════════════════════════════════

export const GetSocialDataSchema = z.object({
  post_id: PostId,
  post_type: PostType,
});

export const UpdateSocialDataSchema = z.object({
  post_id: PostId,
  post_type: PostType,
  og_title: z.string().optional().describe("Open Graph title (Facebook, LinkedIn)"),
  og_description: z.string().optional().describe("Open Graph description"),
  og_image: z.string().url().optional().describe("Open Graph image URL"),
  twitter_title: z.string().optional().describe("Twitter/X card title"),
  twitter_description: z.string().optional().describe("Twitter/X card description"),
  twitter_image: z.string().url().optional().describe("Twitter/X card image URL"),
});

// ═══ Schema (Structured Data) ═════════════════════════════════════════

export const GetSchemaSchema = z.object({
  url: z.string().url().describe("Full URL of the page to get structured data for"),
});

// ═══ Sitemap ══════════════════════════════════════════════════════════

export const GetSitemapIndexSchema = z.object({});
