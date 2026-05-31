import { describe, expect, it } from "vitest";
import { getPageParam, paginateItems } from "@/src/lib/content/pagination";

describe("pagination", () => {
  it("uses ten items per page by default", () => {
    const result = paginateItems(Array.from({ length: 25 }, (_, index) => index + 1), 2);

    expect(result.items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(result.currentPage).toBe(2);
    expect(result.totalPages).toBe(3);
  });

  it("clamps invalid and out-of-range page requests", () => {
    expect(getPageParam("abc")).toBe(1);
    expect(getPageParam("-2")).toBe(1);
    expect(getPageParam(["3", "4"])).toBe(3);
    expect(paginateItems([1, 2, 3], 99).currentPage).toBe(1);
  });
});
