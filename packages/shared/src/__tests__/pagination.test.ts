import { describe, it, expect } from "vitest";
import { paginate, toPageParams, paginationToQuery, PaginationSchema } from "../pagination.js";

describe("PaginationSchema", () => {
  it("validates correct params", () => {
    const result = PaginationSchema.parse({ limit: 10, offset: 20 });
    expect(result.limit).toBe(10);
    expect(result.offset).toBe(20);
  });

  it("applies defaults", () => {
    const result = PaginationSchema.parse({});
    expect(result.limit).toBe(25);
    expect(result.offset).toBe(0);
  });

  it("rejects invalid limit", () => {
    expect(() => PaginationSchema.parse({ limit: 0 })).toThrow();
    expect(() => PaginationSchema.parse({ limit: 101 })).toThrow();
  });

  it("rejects negative offset", () => {
    expect(() => PaginationSchema.parse({ offset: -1 })).toThrow();
  });
});

describe("paginate", () => {
  it("wraps data with pagination metadata", () => {
    const result = paginate(["a", "b", "c"], 10, { limit: 3, offset: 0 });
    expect(result.data).toEqual(["a", "b", "c"]);
    expect(result.pagination.total).toBe(10);
    expect(result.pagination.hasMore).toBe(true);
  });

  it("sets hasMore to false on last page", () => {
    const result = paginate(["a"], 3, { limit: 3, offset: 2 });
    expect(result.pagination.hasMore).toBe(false);
  });
});

describe("toPageParams", () => {
  it("converts offset to page number", () => {
    expect(toPageParams({ limit: 10, offset: 0 })).toEqual({ page: 1, perPage: 10 });
    expect(toPageParams({ limit: 10, offset: 10 })).toEqual({ page: 2, perPage: 10 });
    expect(toPageParams({ limit: 25, offset: 50 })).toEqual({ page: 3, perPage: 25 });
  });
});

describe("paginationToQuery", () => {
  it("returns offset-style query params", () => {
    const result = paginationToQuery({ limit: 10, offset: 20 }, "offset");
    expect(result).toEqual({ limit: "10", offset: "20" });
  });

  it("returns page-style query params", () => {
    const result = paginationToQuery({ limit: 10, offset: 20 }, "page");
    expect(result).toEqual({ page: "3", per_page: "10" });
  });
});
