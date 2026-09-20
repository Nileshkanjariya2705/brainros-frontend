import React from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';
import cn from 'classnames';
import Button from '@/components/ui/Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  limitOptions?: number[];
  isFetching?: boolean;
  itemName?: string;
  scrollToTop?: boolean;
  className?: string;
}

/**
 * Generates an array of page numbers with ellipsis ('...')
 * for concise, accessible navigation across large ranges.
 */
export const getPaginationRange = (currentPage: number, totalPages: number): (number | string)[] => {
  const delta = 1;
  const range: (number | string)[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - delta && i <= currentPage + delta)
    ) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }
  return range;
};

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [5, 10, 20, 50],
  isFetching = false,
  itemName = 'results',
  scrollToTop = true,
  className,
}) => {
  if (total <= 0) return null;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || newPage === page || isFetching) return;
    onPageChange(newPage);
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const startItem = Math.min((page - 1) * limit + 1, total);
  const endItem = Math.min(page * limit, total);
  const pageRange = getPaginationRange(page, totalPages);

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 border border-slate-200 bg-white px-5 py-4 rounded-2xl shadow-xs transition-all',
        className,
      )}
    >
      {/* Left: Summary and Per-Page Selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          Showing <strong className="text-slate-900 font-bold">{startItem}</strong> to{' '}
          <strong className="text-slate-900 font-bold">{endItem}</strong> of{' '}
          <strong className="text-slate-900 font-bold">{total}</strong> {itemName}
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-2 border-l border-slate-200 pl-3">
            <span className="text-slate-400">Show:</span>
            <select
              value={limit}
              disabled={isFetching}
              onChange={(e) => {
                onLimitChange(Number(e.target.value));
              }}
              className={cn(
                'rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none transition-opacity',
                isFetching && 'opacity-60 cursor-not-allowed',
              )}
            >
              {limitOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {isFetching && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md ml-2">
            <RotateCw size={11} className="animate-spin" />
            Loading...
          </span>
        )}
      </div>

      {/* Right: Navigation Controls */}
      {/* Right: Navigation Controls */}
      <div className="flex items-center gap-1.5">
        {/* Previous Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page <= 1 || isFetching}
          className="rounded-xl text-xs font-bold px-2.5 h-8 flex items-center gap-1 disabled:opacity-40"
        >
          <ChevronLeft size={14} />
          <span className="hidden sm:inline">Prev</span>
        </Button>

        {/* Numbered Page Buttons with Ellipsis */}
        <div className="flex items-center gap-1">
          {pageRange.map((pItem, idx) =>
            pItem === '...' ? (
              <span key={`dots-${idx}`} className="px-2 text-xs text-slate-400 font-bold">
                ...
              </span>
            ) : (
              <button
                key={`page-${pItem}`}
                type="button"
                disabled={isFetching}
                onClick={() => handlePageChange(Number(pItem))}
                className={cn(
                  'h-8 min-w-[32px] px-2 rounded-xl text-xs font-bold transition-all',
                  page === pItem
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent',
                  isFetching && 'cursor-not-allowed opacity-50',
                )}
              >
                {pItem}
              </button>
            ),
          )}
        </div>

        {/* Next Page Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page >= totalPages || isFetching}
          className="rounded-xl text-xs font-bold px-2.5 h-8 flex items-center gap-1 disabled:opacity-40"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight size={14} />
        </Button>
      </div>
    </div>
  );
};

export default Pagination;
