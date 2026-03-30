/**
 * Type definitions for @cmsmcp/framer
 */

export interface FramerConfig {
  projectUrl: string;
  apiKey: string;
}

/** Serializable collection data returned by the Framer API */
export interface SerializedCollection {
  id: string;
  name: string;
  slugFieldName: string | null;
  managedBy: string;
}

/** Serializable field definition */
export interface SerializedField {
  id: string;
  name: string;
  type: string;
  required?: boolean;
}

/** Serializable collection item */
export interface SerializedCollectionItem {
  id: string;
  slug: string;
  draft: boolean;
  fieldData: Record<string, unknown>;
}

/** Serializable page node */
export interface SerializedPage {
  id: string;
  name?: string | null;
  path?: string | null;
  title?: string | null;
  visible?: boolean | null;
}

/** Serializable code file */
export interface SerializedCodeFile {
  id: string;
  name: string;
  content?: string;
}

/** Changed paths diff */
export interface ChangedPaths {
  added: string[];
  removed: string[];
  modified: string[];
}

/** Publish result from Framer */
export interface FramerPublishResult {
  deployment: {
    id: string;
    createdAt: string;
    updatedAt: string;
  };
  hostnames: Array<{
    hostname: string;
    type: string;
    isPrimary: boolean;
    isPublished: boolean;
    deploymentId: string;
  }>;
}
