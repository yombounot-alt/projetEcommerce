export interface Pagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: Pagination;
}

export const MAX_PAGE_SIZE = 100;
export const DEFAULT_PAGE_SIZE = 12;

export function normalizePagination(page?: number | string, pageSize?: number | string) {
  const parsedPage = Math.max(1, Number(page) || 1);
  const parsedPageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(pageSize) || DEFAULT_PAGE_SIZE),
  );
  const skip = (parsedPage - 1) * parsedPageSize;
  return { page: parsedPage, pageSize: parsedPageSize, skip };
}

export function buildPaginatedResult<T>(
  items: T[],
  totalItems: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  return {
    items,
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / pageSize)),
    },
  };
}
