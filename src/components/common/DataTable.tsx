import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  rowClassName?: (row: T, index: number) => string;
  sortKey?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
}

export function DataTable<T extends { id?: string }>({
  columns,
  data,
  loading = false,
  emptyText = '暂无数据',
  onRowClick,
  className,
  rowClassName,
  sortKey,
  sortOrder,
  onSort,
}: DataTableProps<T>) {
  const handleSort = (key: string) => {
    if (onSort) {
      onSort(key);
    }
  };

  return (
    <div className={cn('overflow-x-auto rounded-xl border border-neutral-200 bg-white', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-neutral-50 border-b border-neutral-200">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={cn(
                  'px-4 py-3 text-xs font-semibold text-neutral-600 uppercase tracking-wider',
                  col.align === 'center' && 'text-center',
                  col.align === 'right' && 'text-right',
                  col.width && `w-[${col.width}]`,
                  col.sortable && 'cursor-pointer hover:bg-neutral-100 transition-colors select-none'
                )}
                onClick={() => col.sortable && handleSort(String(col.key))}
              >
                <div className={cn(
                  'flex items-center space-x-1',
                  col.align === 'center' && 'justify-center',
                  col.align === 'right' && 'justify-end'
                )}>
                  <span>{col.header}</span>
                  {col.sortable && (
                    <span className="flex flex-col">
                      {sortKey === col.key ? (
                        sortOrder === 'asc' ? (
                          <ChevronUp size={14} className="text-primary-500" />
                        ) : (
                          <ChevronDown size={14} className="text-primary-500" />
                        )
                      ) : (
                        <ChevronsUpDown size={14} className="text-neutral-300" />
                      )}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <div className="flex flex-col items-center space-y-3">
                  <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-neutral-500">加载中...</p>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center">
                <p className="text-neutral-500">{emptyText}</p>
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={row.id || index}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-primary-50/50',
                  rowClassName?.(row, index)
                )}
                onClick={() => onRowClick?.(row, index)}
              >
                {columns.map((col) => (
                  <td
                    key={String(col.key)}
                    className={cn(
                      'px-4 py-3 text-sm text-neutral-700',
                      col.align === 'center' && 'text-center',
                      col.align === 'right' && 'text-right'
                    )}
                  >
                    {col.render
                      ? col.render(row, index)
                      : (row as Record<string, unknown>)[col.key as string] as React.ReactNode}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
