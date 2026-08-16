import { meridian } from "./client";

export async function getAllPages<T>(
  fetchPage: (page: number) => Promise<{ data: T[]; pagination: { totalPages: number } }>
): Promise<T[]> {
  const first = await fetchPage(1);
  const totalPages = first.pagination.totalPages;

  if (totalPages <= 1) return first.data;

  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage(index + 2))
  );

  return [first.data, ...remaining.map((page) => page.data)].flat();
}

export const meridianAll = {
  employees: () => getAllPages((page) => meridian.employees({ page, pageSize: 20 })),
  facilities: () => getAllPages((page) => meridian.facilities({ page, pageSize: 20 })),
  workers: () => getAllPages((page) => meridian.workers({ page, pageSize: 20 })),
  shifts: (params?: Parameters<typeof meridian.shifts>[0]) =>
    getAllPages((page) => meridian.shifts({ ...params, page, pageSize: 20 })),
  credentials: (params?: Parameters<typeof meridian.credentials>[0]) =>
    getAllPages((page) => meridian.credentials({ ...params, page, pageSize: 20 })),
};