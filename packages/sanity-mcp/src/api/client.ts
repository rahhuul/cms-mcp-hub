/**
 * Sanity Content Lake API client.
 * Auth via Bearer token. Uses GROQ for queries, mutations array for writes.
 * Base URL: https://{projectId}.api.sanity.io/v{apiVersion}/
 */

import { ApiClient, createLogger } from "@cmsmcp/shared";
import type { Logger } from "@cmsmcp/shared";
import type {
  SanityConfig,
  SanityMutation,
  SanityMutationResponse,
  SanityQueryResponse,
} from "../types/index.js";

const DEFAULT_API_VERSION = "2024-01";

export class SanityClient {
  private readonly api: ApiClient;
  private readonly logger: Logger;
  private readonly projectId: string;
  private readonly dataset: string;
  private readonly token: string;

  constructor(config: SanityConfig) {
    this.logger = createLogger("sanity");
    this.projectId = config.projectId;
    this.dataset = config.dataset;
    this.token = config.token;
    const version = config.apiVersion || DEFAULT_API_VERSION;
    const baseUrl = `https://${config.projectId}.api.sanity.io/v${version}`;

    this.api = new ApiClient(
      {
        baseUrl,
        headers: { Authorization: `Bearer ${config.token}` },
        maxRetries: 3,
        rateLimitPerSecond: 10,
        timeoutMs: 30_000,
      },
      this.logger,
    );
  }

  /**
   * Execute a GROQ query against the dataset.
   * GET /data/query/{dataset}?query={groq}&$param=value
   */
  async query<T = unknown>(
    groq: string,
    params?: Record<string, string>,
  ): Promise<SanityQueryResponse<T>> {
    const queryParams: Record<string, string> = { query: groq };
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        queryParams[`$${key}`] = JSON.stringify(value);
      }
    }
    return this.api.get<SanityQueryResponse<T>>(
      `data/query/${this.dataset}`,
      queryParams,
    );
  }

  /**
   * Get a single document by ID.
   * GET /data/doc/{dataset}/{id}
   */
  async getDocument<T = Record<string, unknown>>(
    id: string,
  ): Promise<{ documents: T[] }> {
    return this.api.get<{ documents: T[] }>(
      `data/doc/${this.dataset}/${id}`,
    );
  }

  /**
   * Apply mutations to the dataset.
   * POST /data/mutate/{dataset}
   */
  async mutate(
    mutations: SanityMutation[],
    options?: { returnIds?: boolean; returnDocuments?: boolean; visibility?: string },
  ): Promise<SanityMutationResponse> {
    const params: Record<string, string | boolean> = {};
    if (options?.returnIds) params["returnIds"] = true;
    if (options?.returnDocuments) params["returnDocuments"] = true;
    if (options?.visibility) params["visibility"] = options.visibility;

    return this.api.request<SanityMutationResponse>(
      `data/mutate/${this.dataset}`,
      {
        method: "POST",
        body: { mutations },
        params: params as Record<string, string | number | boolean | undefined>,
      },
    );
  }

  /**
   * List all datasets for the project.
   * GET /datasets
   */
  async listDatasets(): Promise<unknown[]> {
    // Datasets endpoint is on the management API
    const managementApi = new ApiClient(
      {
        baseUrl: `https://${this.projectId}.api.sanity.io/v2024-01`,
        headers: { Authorization: `Bearer ${this.token}` },
        maxRetries: 3,
        rateLimitPerSecond: 10,
      },
      this.logger,
    );
    return managementApi.get<unknown[]>("datasets");
  }

  /**
   * List document types by querying all distinct _type values.
   */
  async listDocumentTypes(): Promise<SanityQueryResponse<string[]>> {
    return this.query<string[]>(
      `array::unique(*[]._type)`,
    );
  }

  /**
   * List assets (images/files) in the dataset.
   */
  async listAssets(
    type: "image" | "file",
    limit: number,
    offset: number,
  ): Promise<SanityQueryResponse> {
    const assetType = type === "image" ? "sanity.imageAsset" : "sanity.fileAsset";
    return this.query(
      `*[_type == "${assetType}"] | order(_createdAt desc) [${offset}...${offset + limit}] { _id, _type, url, originalFilename, size, mimeType, _createdAt }`,
    );
  }

  /**
   * Upload an image asset.
   * POST /assets/images/{dataset}
   * Requires raw body with Content-Type header matching the image type.
   */
  async uploadImage(
    imageUrl: string,
    filename?: string,
  ): Promise<{ document: Record<string, unknown> }> {
    // Fetch the image first
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from ${imageUrl}: ${imageResponse.statusText}`);
    }
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const imageBuffer = await imageResponse.arrayBuffer();

    const url = new URL(
      `https://${this.projectId}.api.sanity.io/v2024-01/assets/images/${this.dataset}`,
    );
    if (filename) {
      url.searchParams.set("filename", filename);
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${this.token}`,
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Image upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json() as Promise<{ document: Record<string, unknown> }>;
  }

  /**
   * Upload a file asset.
   * POST /assets/files/{dataset}
   * Requires raw body with Content-Type header matching the file type.
   */
  async uploadFile(
    fileUrl: string,
    filename: string,
  ): Promise<{ document: Record<string, unknown> }> {
    const fileResponse = await fetch(fileUrl);
    if (!fileResponse.ok) {
      throw new Error(`Failed to fetch file from ${fileUrl}: ${fileResponse.statusText}`);
    }
    const contentType = fileResponse.headers.get("content-type") || "application/octet-stream";
    const fileBuffer = await fileResponse.arrayBuffer();

    const url = new URL(
      `https://${this.projectId}.api.sanity.io/v2024-01/assets/files/${this.dataset}`,
    );
    url.searchParams.set("filename", filename);

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${this.token}`,
      },
      body: fileBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`File upload failed (${response.status}): ${errorText || response.statusText}`);
    }

    return response.json() as Promise<{ document: Record<string, unknown> }>;
  }

  /**
   * Export an entire dataset as NDJSON.
   * GET /data/export/{dataset}
   */
  async exportDataset(
    dataset: string,
    types?: string[],
  ): Promise<string> {
    const url = new URL(
      `https://${this.projectId}.api.sanity.io/v2024-01/data/export/${dataset}`,
    );
    if (types && types.length > 0) {
      url.searchParams.set("types", types.join(","));
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Dataset export failed (${response.status}): ${errorText || response.statusText}`);
    }

    return response.text();
  }

  /**
   * Get document history (transactions).
   * GET /data/history/{dataset}/transactions/{documentId}
   */
  async getHistory(
    documentId: string,
  ): Promise<unknown> {
    return this.api.get<unknown>(
      `data/history/${this.dataset}/transactions/${documentId}`,
    );
  }
}
