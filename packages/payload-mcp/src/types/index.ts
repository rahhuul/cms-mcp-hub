/**
 * Type definitions for @cmsmcp/payload
 */

export interface PayloadConfig {
  url: string;
  apiKey?: string;
  email?: string;
  password?: string;
}

export interface PayloadCollection {
  slug: string;
  labels: {
    singular: string;
    plural: string;
  };
  fields: PayloadField[];
  auth?: boolean;
  upload?: boolean;
  versions?: boolean | { drafts?: boolean };
  timestamps?: boolean;
  [key: string]: unknown;
}

export interface PayloadField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  localized?: boolean;
  label?: string;
  relationTo?: string | string[];
  hasMany?: boolean;
  fields?: PayloadField[];
  [key: string]: unknown;
}

export interface PayloadGlobal {
  slug: string;
  label: string;
  fields: PayloadField[];
  versions?: boolean | { drafts?: boolean };
  [key: string]: unknown;
}

export interface PayloadEntry {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface PayloadListResponse {
  docs: PayloadEntry[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface PayloadMediaFile {
  id: string | number;
  filename: string;
  mimeType: string;
  filesize: number;
  width?: number;
  height?: number;
  url: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface PayloadVersion {
  id: string;
  version: PayloadEntry;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface PayloadVersionsResponse {
  docs: PayloadVersion[];
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
}

export interface PayloadAccessResult {
  [collection: string]: {
    create: { permission: boolean };
    read: { permission: boolean };
    update: { permission: boolean };
    delete: { permission: boolean };
    [key: string]: unknown;
  };
}
