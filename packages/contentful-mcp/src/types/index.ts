/**
 * Type definitions for @cmsmcp/contentful
 */

export interface ContentfulConfig {
  spaceId: string;
  environmentId: string;
  managementToken: string;
}

export interface ContentfulSpace {
  sys: { type: string; id: string; createdAt: string; updatedAt: string };
  name: string;
  [key: string]: unknown;
}

export interface ContentfulEnvironment {
  sys: { type: string; id: string; createdAt: string; updatedAt: string; status: { sys: { id: string } } };
  name: string;
  [key: string]: unknown;
}

export interface ContentfulContentType {
  sys: { type: string; id: string; version: number; createdAt: string; updatedAt: string };
  name: string;
  description: string;
  displayField: string;
  fields: ContentfulField[];
  [key: string]: unknown;
}

export interface ContentfulField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  localized: boolean;
  validations?: unknown[];
  items?: { type: string; linkType?: string; validations?: unknown[] };
  [key: string]: unknown;
}

export interface ContentfulEntry {
  sys: {
    type: string;
    id: string;
    version: number;
    createdAt: string;
    updatedAt: string;
    contentType: { sys: { id: string } };
    publishedVersion?: number;
  };
  fields: Record<string, unknown>;
  metadata?: { tags: Array<{ sys: { id: string } }> };
  [key: string]: unknown;
}

export interface ContentfulAsset {
  sys: { type: string; id: string; version: number; createdAt: string; updatedAt: string };
  fields: {
    title?: Record<string, string>;
    description?: Record<string, string>;
    file?: Record<string, { url: string; fileName: string; contentType: string }>;
  };
  [key: string]: unknown;
}

export interface ContentfulLocale {
  sys: { type: string; id: string };
  name: string;
  code: string;
  default: boolean;
  fallbackCode: string | null;
  [key: string]: unknown;
}

export interface ContentfulTag {
  sys: { type: string; id: string; version: number; createdAt: string; updatedAt: string };
  name: string;
  [key: string]: unknown;
}

export interface ContentfulCollection<T> {
  sys: { type: string };
  total: number;
  skip: number;
  limit: number;
  items: T[];
}

export interface ContentfulBulkAction {
  sys: { type: string; id: string; status: string; createdAt: string; updatedAt: string };
  action: string;
  [key: string]: unknown;
}
