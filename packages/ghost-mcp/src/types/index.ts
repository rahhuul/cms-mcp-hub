/**
 * Type definitions for @cmsmcp/ghost
 */

export interface GhostConfig {
  url: string;
  adminApiKey: string;
  contentApiKey?: string;
}

export interface GhostPost {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  status: string;
  featured: boolean;
  published_at: string | null;
  excerpt: string | null;
  tags?: Array<{ id: string; name: string; slug: string }>;
  authors?: Array<{ id: string; name: string; slug: string }>;
  [key: string]: unknown;
}

export interface GhostPage {
  id: string;
  uuid: string;
  title: string;
  slug: string;
  status: string;
  published_at: string | null;
  [key: string]: unknown;
}

export interface GhostTag {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  count?: { posts: number };
  [key: string]: unknown;
}

export interface GhostAuthor {
  id: string;
  name: string;
  slug: string;
  email: string;
  [key: string]: unknown;
}

export interface GhostMember {
  id: string;
  email: string;
  name: string | null;
  status: string;
  [key: string]: unknown;
}

export interface GhostTier {
  id: string;
  name: string;
  slug: string;
  type: string;
  active: boolean;
  [key: string]: unknown;
}

export interface GhostNewsletter {
  id: string;
  name: string;
  slug: string;
  status: string;
  [key: string]: unknown;
}

export interface GhostSite {
  title: string;
  description: string;
  url: string;
  version: string;
  [key: string]: unknown;
}

export interface GhostListResponse<T> {
  [key: string]: T[] | { page: number; limit: number; pages: number; total: number; next: number | null; prev: number | null };
}
