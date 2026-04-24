/**
 * Openverse API client — Creative Commons image search.
 * Free API, no key required for basic use.
 * https://api.openverse.org/v1/
 */

const BASE_URL = "https://api.openverse.org/v1";
const USER_AGENT = "@cmsmcp/wordpress";

export interface OpenverseImage {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  width: number;
  height: number;
  license: string;
  license_version: string;
  license_url: string;
  creator: string;
  creator_url: string;
  source: string;
  attribution: string;
  detail_url: string;
  foreign_landing_url: string;
}

export interface OpenverseSearchResult {
  result_count: number;
  page_count: number;
  page: number;
  results: OpenverseImage[];
}

export interface OpenverseSearchParams {
  query: string;
  page?: number;
  pageSize?: number;
  license?: string;
  licenseType?: string;
  category?: string;
  aspectRatio?: string;
  size?: string;
}

/**
 * Build proper Creative Commons attribution text for an image.
 */
export function buildAttribution(image: OpenverseImage): string {
  // If Openverse already provides attribution, use it
  if (image.attribution) {
    return image.attribution;
  }

  const parts: string[] = [];

  if (image.title) {
    parts.push(`"${image.title}"`);
  }

  if (image.creator) {
    if (image.creator_url) {
      parts.push(`by ${image.creator} (${image.creator_url})`);
    } else {
      parts.push(`by ${image.creator}`);
    }
  }

  const licenseLabel = image.license.toUpperCase();
  const version = image.license_version ? ` ${image.license_version}` : "";
  if (image.license_url) {
    parts.push(`is licensed under CC ${licenseLabel}${version} (${image.license_url})`);
  } else {
    parts.push(`is licensed under CC ${licenseLabel}${version}`);
  }

  return parts.join(" ");
}

/**
 * Perform a fetch against the Openverse API with standard headers.
 */
async function openverseFetch<T>(path: string): Promise<T> {
  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Openverse API error (${response.status}): ${body || response.statusText}`,
    );
  }

  return response.json() as Promise<T>;
}

function mapImage(raw: Record<string, unknown>): OpenverseImage {
  return {
    id: String(raw["id"] ?? ""),
    title: String(raw["title"] ?? ""),
    url: String(raw["url"] ?? ""),
    thumbnail: String(raw["thumbnail"] ?? ""),
    width: Number(raw["width"] ?? 0),
    height: Number(raw["height"] ?? 0),
    license: String(raw["license"] ?? ""),
    license_version: String(raw["license_version"] ?? ""),
    license_url: String(raw["license_url"] ?? ""),
    creator: String(raw["creator"] ?? "Unknown"),
    creator_url: String(raw["creator_url"] ?? ""),
    source: String(raw["source"] ?? ""),
    attribution: String(raw["attribution"] ?? ""),
    detail_url: String(raw["detail_url"] ?? ""),
    foreign_landing_url: String(raw["foreign_landing_url"] ?? ""),
  };
}

export class OpenverseClient {
  /**
   * Search Creative Commons images on Openverse.
   */
  async searchImages(params: OpenverseSearchParams): Promise<OpenverseSearchResult> {
    const qs = new URLSearchParams();
    qs.set("q", params.query);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("page_size", String(Math.min(params.pageSize, 50)));
    if (params.license) qs.set("license", params.license);
    if (params.licenseType) qs.set("license_type", params.licenseType);
    if (params.category) qs.set("category", params.category);
    if (params.aspectRatio) qs.set("aspect_ratio", params.aspectRatio);
    if (params.size) qs.set("size", params.size);

    const data = await openverseFetch<Record<string, unknown>>(`images/?${qs.toString()}`);

    const results = Array.isArray(data["results"])
      ? (data["results"] as Record<string, unknown>[]).map(mapImage)
      : [];

    return {
      result_count: Number(data["result_count"] ?? 0),
      page_count: Number(data["page_count"] ?? 0),
      page: Number(data["page"] ?? params.page ?? 1),
      results,
    };
  }

  /**
   * Get detailed information about a specific Openverse image by ID.
   */
  async getImageDetails(id: string): Promise<OpenverseImage> {
    const raw = await openverseFetch<Record<string, unknown>>(`images/${encodeURIComponent(id)}/`);
    return mapImage(raw);
  }
}
