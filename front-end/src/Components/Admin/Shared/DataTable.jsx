import { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Pagination from "./Pagination";

export default function DataTable({ columns, data, keyField = "id", pageSize = 5 }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortKey) return 0;
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortDir === "asc" ? -1 : 1;
    if (valA > valB) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="rounded-2xl bg-surface border border-outline/10 neomorph-raised overflow-hidden">
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm text-on-surface border-collapse">
          <thead className="sticky top-0 z-10 bg-surface-bright text-xs font-bold uppercase tracking-wider text-on-surface-variant border-b border-outline/10 shadow-xs">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={col.key || idx}
                  className={`px-6 py-4 ${col.sortable !== false ? "cursor-pointer select-none" : ""}`}
                  onClick={() => col.sortable !== false && col.key && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {col.sortable !== false && col.key && (
                      <span className="text-outline">
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="size-3.5 text-primary" />
                          ) : (
                            <ArrowDown className="size-3.5 text-primary" />
                          )
                        ) : (
                          <ArrowUpDown className="size-3.5" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-on-surface-variant">
                  No records available.
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={row[keyField] ?? row._id ?? rowIdx}
                  className="transition-colors hover:bg-surface-container/60"
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

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={sortedData.length}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
