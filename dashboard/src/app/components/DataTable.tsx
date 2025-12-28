import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyState?: ReactNode;
  isLoading?: boolean;
}

export function DataTable<T extends { id: string | number }>({
  columns,
  data,
  onRowClick,
  emptyState,
  isLoading = false,
}: DataTableProps<T>) {
  const getAlignment = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-16 text-center">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium">Laden...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data.length && emptyState) {
    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-16">
          {emptyState}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide ${getAlignment(column.align)}`}
                  style={{ width: column.width }}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.map((item) => (
              <tr
                key={item.id}
                className={`
                  transition-all duration-150
                  ${onRowClick ? 'cursor-pointer hover:bg-muted/30' : ''}
                `}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 ${getAlignment(column.align)}`}
                  >
                    {column.render
                      ? column.render(item)
                      : (item as any)[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}