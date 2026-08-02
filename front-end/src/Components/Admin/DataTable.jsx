import { ChevronLeft, ChevronRight } from "lucide-react";

export default function DataTable({ columns, data, keyField = "id" }) {
  return (
    <div className="rounded-2xl bg-surface border border-outline/10 neomorph-raised overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-on-surface border-collapse">
          <thead className="bg-surface-bright/80 text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10">
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || idx} className="px-6 py-4">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-on-surface-variant">
                  No records available.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row[keyField]}
                  className="transition-colors hover:bg-surface-container/50"
                >
                  {columns.map((col, idx) => (
                    <td key={col.key || idx} className="px-6 py-4 font-medium">
                      {col.render ? col.render(row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-bright/50 border-t border-outline/10 text-xs text-on-surface-variant">
        <span>Showing {data.length} records</span>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="p-1.5 rounded-lg border border-outline/20 opacity-40 cursor-not-allowed"
          >
            <ChevronLeft className="size-4" />
          </button>
          <span className="font-semibold text-on-surface px-2">Page 1 of 1</span>
          <button
            disabled
            className="p-1.5 rounded-lg border border-outline/20 opacity-40 cursor-not-allowed"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
