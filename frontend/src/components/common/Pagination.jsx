import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange
}) => {
  if (totalItems <= pageSize && totalPages <= 1) return null;

  const startIdx = (currentPage - 1) * pageSize + 1;
  const endIdx = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12.5px',
        color: 'var(--text-dim)',
        flexWrap: 'wrap',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Showing <strong style={{ color: '#fff' }}>{startIdx}</strong> to <strong style={{ color: '#fff' }}>{endIdx}</strong> of{' '}
          <strong style={{ color: '#fff' }}>{totalItems}</strong> entries
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', padding: '4px 8px', fontSize: '12px', height: '28px', marginLeft: '8px' }}
          >
            <option value={10}>10 / page</option>
            <option value={25}>25 / page</option>
            <option value={50}>50 / page</option>
          </select>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', minWidth: '32px', height: '28px' }}
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} />
        </button>

        <span style={{ padding: '0 8px', color: '#f8fafc', fontWeight: 600 }}>
          {currentPage} / {Math.max(1, totalPages)}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="btn btn-secondary btn-sm"
          style={{ padding: '4px 8px', minWidth: '32px', height: '28px' }}
          aria-label="Next Page"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
