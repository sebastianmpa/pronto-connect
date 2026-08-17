export interface PaginatedResponse<T> {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  items: T[];
}

export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<PaginatedResponse<T>>,
  pageSize = 100,
): Promise<T[]> {
  const first = await fetchPage(1, pageSize);
  const rows = Array.isArray(first.items) ? [...first.items] : [];
  const totalPages = Math.max(first.totalPages || 1, 1);

  for (let page = 2; page <= totalPages; page += 1) {
    const response = await fetchPage(page, pageSize);
    if (Array.isArray(response.items)) {
      rows.push(...response.items);
    }
  }

  return rows;
}

function startOfLocalDay(value: string): number | null {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function endOfLocalDay(value: string): number | null {
  if (!value) return null;
  const date = new Date(`${value}T23:59:59.999`);
  const timestamp = date.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function filterRowsByDateRange<T>(
  rows: T[],
  getDate: (row: T) => string | null | undefined,
  startDate: string,
  endDate: string,
): T[] {
  const start = startOfLocalDay(startDate);
  const end = endOfLocalDay(endDate);

  if (start === null && end === null) return rows;

  return rows.filter((row) => {
    const rawDate = getDate(row);
    if (!rawDate) return false;

    const timestamp = new Date(rawDate).getTime();
    if (Number.isNaN(timestamp)) return false;
    if (start !== null && timestamp < start) return false;
    if (end !== null && timestamp > end) return false;
    return true;
  });
}
