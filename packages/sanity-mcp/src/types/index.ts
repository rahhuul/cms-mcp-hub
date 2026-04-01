/**
 * Type definitions for @cmsmcp/sanity
 */

/** Configuration for the Sanity API client */
export interface SanityConfig {
  projectId: string;
  dataset: string;
  token: string;
  apiVersion?: string;
}

/** Sanity mutation operation types */
export interface SanityMutation {
  create?: Record<string, unknown>;
  createOrReplace?: Record<string, unknown>;
  createIfNotExists?: Record<string, unknown>;
  delete?: { id: string };
  patch?: SanityPatch;
}

/** Sanity patch operation */
export interface SanityPatch {
  id: string;
  set?: Record<string, unknown>;
  unset?: string[];
  inc?: Record<string, number>;
  dec?: Record<string, number>;
  ifRevisionID?: string;
}

/** Sanity GROQ query response */
export interface SanityQueryResponse<T = unknown> {
  ms: number;
  query: string;
  result: T;
}

/** Sanity mutation response */
export interface SanityMutationResponse {
  transactionId: string;
  results: Array<{
    id: string;
    operation: string;
  }>;
}

/** Sanity dataset info */
export interface SanityDataset {
  name: string;
  aclMode: string;
}

/** Sanity asset metadata */
export interface SanityAsset {
  _id: string;
  _type: string;
  url: string;
  originalFilename?: string;
  size?: number;
  mimeType?: string;
}

/** Sanity document history entry */
export interface SanityHistoryEntry {
  id: string;
  timestamp: string;
  author: string;
  mutations: SanityMutation[];
}
