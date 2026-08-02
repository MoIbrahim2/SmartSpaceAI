import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Pagination({
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  onPageChange,
}) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 bg-surface-bright/50 border-t border-outline/10 text-xs text-on-surface-variant">
      <span>Showing {totalRecords} records</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="p-1.5 rounded-lg border border-outline/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-all"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="font-semibold text-on-surface px-2">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-lg border border-outline/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface transition-all"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
