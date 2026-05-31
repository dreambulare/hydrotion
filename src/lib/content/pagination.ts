export const HOME_PAGE_SIZE = 10;

export type PaginationResult<T> = {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
};

export function getPageParam(input: string | string[] | undefined) {
  const raw = Array.isArray(input) ? input[0] : input;
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function paginateItems<T>(items: T[], requestedPage: number, pageSize = HOME_PAGE_SIZE): PaginationResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = Math.min(Math.max(1, requestedPage), totalPages);
  const start = (currentPage - 1) * pageSize;

  return {
    items: items.slice(start, start + pageSize),
    currentPage,
    totalPages,
    totalItems,
    pageSize
  };
}
