import { ReactNode } from "react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export default function Table<T>({ columns, data, keyExtractor, onRowClick, className = "" }: TableProps<T>) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider whitespace-nowrap"
                style={{ color: "#FFFFFF", background: "#1A3C5E" }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item, idx)}
              onClick={() => onRowClick?.(item)}
              className={onRowClick ? "cursor-pointer" : ""}
              style={{ background: idx % 2 === 0 ? "#FFFFFF" : "#F5F7FA", borderBottom: "1px solid #E2E8F0" }}
            >
              {columns.map((col) => (
                <td key={col.key} className={`px-4 py-3 whitespace-nowrap ${col.className || ""}`}>
                  {col.render ? col.render(item) : (item as any)[col.key] ?? "—"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
