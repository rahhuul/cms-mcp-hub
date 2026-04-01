/**
 * Type definitions for @cmsmcp/webflow
 */

export interface WebflowConfig {
  apiToken: string;
}

export interface WebflowSite {
  id: string;
  displayName: string;
  shortName: string;
  previewUrl: string;
  timeZone: string;
  createdOn: string;
  lastUpdated: string;
  lastPublished: string | null;
  [key: string]: unknown;
}

export interface WebflowCollection {
  id: string;
  displayName: string;
  singularName: string;
  slug: string;
  createdOn: string;
  lastUpdated: string;
  fields: WebflowCollectionField[];
  [key: string]: unknown;
}

export interface WebflowCollectionField {
  id: string;
  isRequired: boolean;
  isEditable: boolean;
  type: string;
  slug: string;
  displayName: string;
  [key: string]: unknown;
}

export interface WebflowItem {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string | null;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, unknown>;
  [key: string]: unknown;
}

export interface WebflowPage {
  id: string;
  siteId: string;
  title: string;
  slug: string;
  parentId: string | null;
  collectionId: string | null;
  createdOn: string;
  lastUpdated: string;
  archived: boolean;
  draft: boolean;
  [key: string]: unknown;
}

export interface WebflowProduct {
  id: string;
  cmsLocaleId: string | null;
  lastPublished: string | null;
  lastUpdated: string;
  createdOn: string;
  isArchived: boolean;
  isDraft: boolean;
  fieldData: Record<string, unknown>;
  product: {
    id: string;
    [key: string]: unknown;
  };
  skus: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

export interface WebflowOrder {
  orderId: string;
  status: string;
  customerPaid: {
    unit: string;
    value: string;
    string: string;
  };
  createdOn: string;
  [key: string]: unknown;
}

export interface WebflowDomain {
  id: string;
  url: string;
  [key: string]: unknown;
}

export interface WebflowWebhook {
  id: string;
  triggerType: string;
  url: string;
  createdOn: string;
  [key: string]: unknown;
}

export interface WebflowListResponse<T> {
  items: T[];
  pagination?: {
    limit: number;
    offset: number;
    total: number;
  };
}
