/**
 * Pure pagination maths shared by public listings and their tests.
 *
 * PostgREST returns an empty page (or a 416) for an out-of-range offset, which
 * used to make the UI claim a large total next to an empty table. Clamping the
 * requested page to the real page count keeps header, table and pagination in
 * agreement for every URL.
 */
export type PageWindow = {
  /** Page actually served (clamped to 1..totalPages). */
  page: number;
  totalPages: number;
  /** Zero-based PostgREST range start. */
  start: number;
  /** Zero-based PostgREST range end. */
  end: number;
  /** First row number for display, or 0 when there are no rows. */
  firstRow: number;
  /** Last row number for display, or 0 when there are no rows. */
  lastRow: number;
};

export function pageWindow(
  requestedPage: number,
  total: number,
  pageSize: number,
): PageWindow {
  const size = Math.max(1, Math.floor(Number.isFinite(pageSize) ? pageSize : 25));
  const count = Math.max(0, Math.floor(Number.isFinite(total) ? total : 0));
  const totalPages = Math.max(1, Math.ceil(count / size));
  const page = Math.min(
    Math.max(1, Math.floor(Number.isFinite(requestedPage) ? requestedPage : 1)),
    totalPages,
  );
  const start = (page - 1) * size;
  const lastOnPage = Math.min(count, start + size);
  return {
    page,
    totalPages,
    start,
    end: start + size - 1,
    firstRow: count === 0 ? 0 : start + 1,
    lastRow: lastOnPage,
  };
}
