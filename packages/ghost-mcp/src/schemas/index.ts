/**
 * Zod schemas for all Ghost MCP tool inputs.
 */

import { z } from "zod";

const PaginationMixin = {
  limit: z.number().min(1).max(100).default(15).describe("Items per page (max 100)"),
  page: z.number().min(1).default(1).describe("Page number"),
};

// ─── Posts ─────────────────────────────────────────────────────────────

export const ListPostsSchema = z.object({
  ...PaginationMixin,
  filter: z.string().optional().describe("Ghost NQL filter (e.g., 'tag:news+featured:true', 'status:draft')"),
  include: z.string().optional().describe("Relations to include (e.g., 'tags,authors')"),
  fields: z.string().optional().describe("Specific fields to return (e.g., 'title,slug,published_at')"),
  order: z.string().optional().describe("Sort order (e.g., 'published_at desc')"),
});

export const GetPostSchema = z.object({
  id: z.string().optional().describe("Post ID"),
  slug: z.string().optional().describe("Post slug (alternative to ID)"),
  include: z.string().optional().describe("Relations to include (e.g., 'tags,authors')"),
  fields: z.string().optional().describe("Specific fields to return"),
});

export const CreatePostSchema = z.object({
  title: z.string().min(1).describe("Post title"),
  lexical: z.string().optional().describe("Post content in Lexical JSON format"),
  html: z.string().optional().describe("Post content as HTML (converted to Lexical internally)"),
  status: z.enum(["draft", "published", "scheduled"]).default("draft").describe("Post status"),
  slug: z.string().optional().describe("URL slug (auto-generated if omitted)"),
  featured: z.boolean().optional().describe("Feature the post"),
  tags: z.array(z.object({
    name: z.string().optional(),
    id: z.string().optional(),
    slug: z.string().optional(),
  })).optional().describe("Tags — new tags created automatically by name"),
  authors: z.array(z.object({ id: z.string() })).optional().describe("Author IDs"),
  published_at: z.string().optional().describe("Publish date for scheduled posts (ISO 8601)"),
  excerpt: z.string().optional().describe("Custom excerpt"),
  meta_title: z.string().optional().describe("SEO title"),
  meta_description: z.string().optional().describe("SEO description"),
});

export const UpdatePostSchema = z.object({
  id: z.string().describe("Post ID to update"),
  updated_at: z.string().describe("Current updated_at value (required for collision detection)"),
  title: z.string().optional().describe("Post title"),
  lexical: z.string().optional().describe("Post content in Lexical JSON format"),
  html: z.string().optional().describe("Post content as HTML"),
  status: z.enum(["draft", "published", "scheduled"]).optional().describe("Post status"),
  slug: z.string().optional().describe("URL slug"),
  featured: z.boolean().optional().describe("Feature the post"),
  tags: z.array(z.object({
    name: z.string().optional(),
    id: z.string().optional(),
  })).optional().describe("Tags"),
  excerpt: z.string().optional().describe("Custom excerpt"),
  meta_title: z.string().optional().describe("SEO title"),
  meta_description: z.string().optional().describe("SEO description"),
});

export const DeletePostSchema = z.object({
  id: z.string().describe("Post ID to delete"),
});

// ─── Pages ─────────────────────────────────────────────────────────────

export const ListPagesSchema = z.object({
  ...PaginationMixin,
  filter: z.string().optional().describe("Ghost NQL filter"),
  include: z.string().optional().describe("Relations to include"),
  order: z.string().optional().describe("Sort order"),
});

export const CreatePageSchema = z.object({
  title: z.string().min(1).describe("Page title"),
  lexical: z.string().optional().describe("Page content in Lexical JSON"),
  html: z.string().optional().describe("Page content as HTML"),
  status: z.enum(["draft", "published"]).default("draft").describe("Page status"),
  slug: z.string().optional().describe("URL slug"),
});

export const UpdatePageSchema = z.object({
  id: z.string().describe("Page ID to update"),
  updated_at: z.string().describe("Current updated_at value"),
  title: z.string().optional().describe("Page title"),
  lexical: z.string().optional().describe("Page content in Lexical JSON"),
  html: z.string().optional().describe("Page content as HTML"),
  status: z.enum(["draft", "published"]).optional().describe("Page status"),
  slug: z.string().optional().describe("URL slug"),
});

// ─── Pages (delete) ───────────────────────────────────────────────────

export const DeletePageSchema = z.object({
  id: z.string().describe("Page ID to delete"),
});

// ─── Tags ──────────────────────────────────────────────────────────────

export const ListTagsSchema = z.object({
  ...PaginationMixin,
  filter: z.string().optional().describe("Ghost NQL filter"),
  include: z.string().optional().describe("Include 'count.posts' to get post counts"),
  order: z.string().optional().describe("Sort order"),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1).describe("Tag name"),
  slug: z.string().optional().describe("URL slug"),
  description: z.string().optional().describe("Tag description"),
});

export const DeleteTagSchema = z.object({
  id: z.string().describe("Tag ID to delete"),
});

// ─── Authors ───────────────────────────────────────────────────────────

export const ListAuthorsSchema = z.object({
  ...PaginationMixin,
  include: z.string().optional().describe("Include 'count.posts' to get post counts"),
});

// ─── Members ───────────────────────────────────────────────────────────

export const ListMembersSchema = z.object({
  ...PaginationMixin,
  filter: z.string().optional().describe("Ghost NQL filter (e.g., 'status:paid')"),
  search: z.string().optional().describe("Search by name or email"),
  order: z.string().optional().describe("Sort order"),
});

export const CreateMemberSchema = z.object({
  email: z.string().email().describe("Member email"),
  name: z.string().optional().describe("Member name"),
  labels: z.array(z.object({ name: z.string() })).optional().describe("Labels for segmentation"),
  note: z.string().optional().describe("Internal note"),
  newsletters: z.array(z.object({ id: z.string() })).optional().describe("Newsletter subscriptions"),
});

// ─── Tiers & Newsletters ──────────────────────────────────────────────

export const ListTiersSchema = z.object({
  ...PaginationMixin,
});

export const ListNewslettersSchema = z.object({
  ...PaginationMixin,
});

// ─── Images ────────────────────────────────────────────────────────────

export const UploadImageSchema = z.object({
  url: z.string().url().describe("URL of the image to upload"),
  ref: z.string().optional().describe("Reference name for the image"),
});

// ─── Webhooks ─────────────────────────────────────────────────────────

export const ListWebhooksSchema = z.object({
  ...PaginationMixin,
});

export const CreateWebhookSchema = z.object({
  event: z.string().describe("Webhook event name (e.g., 'post.published', 'member.added')"),
  target_url: z.string().url().describe("URL to receive webhook POST requests"),
});

export const UpdateWebhookSchema = z.object({
  id: z.string().describe("Webhook ID to update"),
  event: z.string().optional().describe("Webhook event name"),
  target_url: z.string().url().optional().describe("URL to receive webhook POST requests"),
});

export const DeleteWebhookSchema = z.object({
  id: z.string().describe("Webhook ID to delete"),
});

// ─── Members (get/update) ─────────────────────────────────────────────

export const GetMemberSchema = z.object({
  id: z.string().describe("Member ID"),
});

export const UpdateMemberSchema = z.object({
  id: z.string().describe("Member ID to update"),
  email: z.string().email().optional().describe("Member email"),
  name: z.string().optional().describe("Member name"),
  labels: z.array(z.object({ name: z.string() })).optional().describe("Labels for segmentation"),
  note: z.string().optional().describe("Internal note"),
  newsletters: z.array(z.object({ id: z.string() })).optional().describe("Newsletter subscriptions"),
});

// ─── Offers ───────────────────────────────────────────────────────────

export const ListOffersSchema = z.object({
  ...PaginationMixin,
});

// ─── Site ──────────────────────────────────────────────────────────────

export const GetSiteSchema = z.object({});
