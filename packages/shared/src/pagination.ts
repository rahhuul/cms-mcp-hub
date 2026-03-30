/**
 * Pagination utilities for CMS API responses.
 */

import { z } from "zod";
import type { PaginatedResponse, PaginationParams } from "./types/index.js";

/** Default pagination values */
export const DEFAULT_PAGE_LIMIT = 25;
export const MAX_PAGE_LIMIT = 100;

/**
 * Reusable Zod schema for pagination parameters.
 * Use `.shape` when registering MCP tools.
 */
export const PaginationSchema = z.object({
  limit: z.number().min(1).max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT).describe("Number of items per page (1-100)"),
  offset: z.number().min(0).default(0).describe("Pagination offset"),
});

/**
 * Builds a PaginatedResponse wrapper from raw data.
 */
export function paginate<T>(
  data: T[],
  total: number,
  params: PaginationParams,
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      total,
      limit: params.limit,
      offset: params.offset,
      hasMore: params.offset + params.limit < total,
    },
  };
}

/**
 * Converts limit/offset pagination to page-based pagination
 * (for APIs that use page numbers).
 */
export function toPageParams(params: PaginationParams): { page: number; perPage: number } {
  return {
    page: Math.floor(params.offset / params.limit) + 1,
    perPage: params.limit,
  };
}

/**
 * Builds query string parameters from pagination params.
 */
export function paginationToQuery(params: PaginationParams, style: "offset" | "page" = "offset"): Record<string, string> {
  if (style === "page") {
    const { page, perPage } = toPageParams(params);
    return { page: String(page), per_page: String(perPage) };
  }
  return { limit: String(params.limit), offset: String(params.offset) };
}

/**
 * Collects all pages from a paginated API endpoint.
 * Use sparingly — prefer returning a single page in MCP tools.
 */
export async function fetchAllPages<T>(
  fetcher: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  pageSize: number = DEFAULT_PAGE_LIMIT,
  maxItems: number = 1000,
): Promise<T[]> {
  const allItems: T[] = [];
  let offset = 0;

  while (allItems.length < maxItems) {
    const result = await fetcher({ limit: pageSize, offset });
    allItems.push(...result.data);

    if (!result.pagination.hasMore || allItems.length >= maxItems) {
      break;
    }
    offset += pageSize;
  }

  return allItems.slice(0, maxItems);
}
