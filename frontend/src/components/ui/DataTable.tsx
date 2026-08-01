import { useState } from 'react';
import {
    flexRender,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    type ColumnDef,
    type SortingState,
} from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DataTableProps<TData> {
    columns: ColumnDef<TData, unknown>[];
    data: TData[];
    emptyMessage?: string;
    label: string;
    className?: string;
}

export function DataTable<TData>({ columns, data, emptyMessage = 'No results.', label, className }: DataTableProps<TData>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const table = useReactTable({
        data,
        columns,
        state: { sorting },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    return (
        <div className={cn('overflow-x-auto', className)}>
            <table className="w-full min-w-[620px] border-collapse text-left text-sm" aria-label={label}>
                <thead className="border-b border-border bg-muted/40">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id}>
                            {headerGroup.headers.map((header) => {
                                const sorted = header.column.getIsSorted();
                                const content = header.isPlaceholder
                                    ? null
                                    : flexRender(header.column.columnDef.header, header.getContext());
                                return (
                                    <th key={header.id} className="px-5 py-3 text-xs font-semibold text-muted-foreground">
                                        {header.column.getCanSort() ? (
                                            <button
                                                type="button"
                                                onClick={header.column.getToggleSortingHandler()}
                                                className="inline-flex items-center gap-1.5 hover:text-foreground"
                                            >
                                                {content}
                                                {sorted === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : sorted === 'desc' ? <ArrowDown className="h-3.5 w-3.5" /> : <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />}
                                            </button>
                                        ) : content}
                                    </th>
                                );
                            })}
                        </tr>
                    ))}
                </thead>
                <tbody className="divide-y divide-border">
                    {table.getRowModel().rows.length ? table.getRowModel().rows.map((row) => (
                        <tr key={row.id} className="transition-colors hover:bg-muted/35">
                            {row.getVisibleCells().map((cell) => (
                                <td key={cell.id} className="px-5 py-4">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </td>
                            ))}
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={columns.length} className="px-5 py-12 text-center text-sm text-muted-foreground">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}
