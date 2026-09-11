import { Fragment } from "react";

import { cn } from "@/lib/utils";

export type Column<T> = {
  /** Stable key, used for React keys only. */
  key: string;
  header: React.ReactNode;
  cell: (row: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  /** Fixed width, e.g. "w-24". */
  width?: string;
  className?: string;
  headerClassName?: string;
  /**
   * Hide this column below the given breakpoint. Secondary columns are
   * dropped on small screens rather than forcing a horizontal scroll.
   */
  hideBelow?: "sm" | "md" | "lg";
};

// Tailwind can't compile dynamic class names, so breakpoints are mapped
// to literal strings here.
const HIDE_BELOW: Record<NonNullable<Column<unknown>["hideBelow"]>, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
};

const ALIGN: Record<NonNullable<Column<unknown>["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  caption,
  captionVisible = false,
  empty = "No records found.",
  serialNumbers = false,
  startIndex = 0,
  rowClassName,
  renderAfterRow,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  /** Always provide one — screen readers rely on it. */
  caption: string;
  captionVisible?: boolean;
  empty?: React.ReactNode;
  /** Prepend an "S.No" column. */
  serialNumbers?: boolean;
  /** Offset for serial numbers on paginated pages. */
  startIndex?: number;
  rowClassName?: (row: T, index: number) => string | undefined;
  /**
   * Inject an extra full-width row after a given index — used for in-listing
   * ad slots (Phase 9: "mid-listing, every 5 rows").
   */
  renderAfterRow?: (row: T, index: number) => React.ReactNode;
}) {
  const colSpan = columns.length + (serialNumbers ? 1 : 0);

  if (!rows.length) {
    return (
      <div className="border border-rule bg-surface p-6 text-center text-sm text-ink-muted">
        {empty}
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="gov-table">
        <caption
          className={cn(
            "px-2.5 py-2 text-left font-serif text-sm font-bold text-navy",
            !captionVisible && "sr-only",
          )}
        >
          {caption}
        </caption>

        <thead>
          <tr>
            {serialNumbers ? (
              <th scope="col" className="w-12 text-center">
                S.No
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  col.width,
                  col.align && ALIGN[col.align],
                  col.hideBelow && HIDE_BELOW[col.hideBelow],
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.map((row, i) => {
            const extra = renderAfterRow?.(row, i);
            return (
              <Fragment key={rowKey(row, i)}>
                <tr className={rowClassName?.(row, i)}>
                  {serialNumbers ? (
                    <td className="text-center text-ink-faint tabular-nums">
                      {startIndex + i + 1}
                    </td>
                  ) : null}
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        col.align && ALIGN[col.align],
                        col.hideBelow && HIDE_BELOW[col.hideBelow],
                        col.className,
                      )}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
                {extra ? (
                  <tr className="bg-page">
                    <td colSpan={colSpan} className="p-0">
                      {extra}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Two-column key/value table — the standard government "overview" block used
 * on every detail page (Section 4.2 #2).
 */
export function DetailTable({
  rows,
  caption,
  labelWidth = "w-2/5",
}: {
  rows: { label: React.ReactNode; value: React.ReactNode }[];
  caption: string;
  labelWidth?: string;
}) {
  const visible = rows.filter((r) => r.value !== null && r.value !== undefined);
  if (!visible.length) return null;

  return (
    <div className="w-full overflow-x-auto">
      <table className="gov-table">
        <caption className="sr-only">{caption}</caption>
        <tbody>
          {visible.map((row, i) => (
            <tr key={i}>
              <th
                scope="row"
                className={cn(
                  labelWidth,
                  "border-t border-r border-rule bg-navy-50 px-2.5 py-2 text-left align-top font-sans text-sm font-semibold text-navy",
                )}
              >
                {row.label}
              </th>
              <td className="align-top">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
