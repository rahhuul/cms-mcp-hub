/**
 * Type definitions for @cmsmcp/strapi
 */

export interface StrapiConfig {
  url: string;
  apiToken: string;
}

export interface StrapiContentType {
  uid: string;
  apiID: string;
  schema: {
    displayName: string;
    singularName: string;
    pluralName: string;
    kind: string;
    description?: string;
    attributes: Record<string, StrapiAttribute>;
  };
}

export interface StrapiAttribute {
  type: string;
  required?: boolean;
  unique?: boolean;
  relation?: string;
  target?: string;
  [key: string]: unknown;
}

export interface StrapiComponent {
  uid: string;
  category: string;
  apiId: string;
  schema: {
    displayName: string;
    attributes: Record<string, StrapiAttribute>;
  };
}

export interface StrapiEntry {
  id: number;
  attributes: Record<string, unknown>;
  [key: string]: unknown;
}

export interface StrapiListResponse {
  data: StrapiEntry[];
  meta: {
    pagination: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiSingleResponse {
  data: StrapiEntry;
  meta: Record<string, unknown>;
}

export interface StrapiMediaFile {
  id: number;
  name: string;
  url: string;
  mime: string;
  size: number;
  width?: number;
  height?: number;
  [key: string]: unknown;
}

export interface StrapiLocale {
  id: number;
  name: string;
  code: string;
  isDefault: boolean;
}
