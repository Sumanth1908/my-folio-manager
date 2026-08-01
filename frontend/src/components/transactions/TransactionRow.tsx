import { Plus, Trash2, Tag, Info, Pencil } from 'lucide-react';
import { memo, useEffect } from 'react';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { cn, formatDate } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateTransactionCategory } from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { toast } from 'sonner';

interface TransactionRowProps {
    tx: Transaction;
    accountName?: string;
    accountType?: string;
    currencySymbol: string;

    onDelete?: (id: number) => void;
    onEdit?: (tx: Transaction) => void;
}

const TransactionRow = memo(({
    tx,
    accountName,
    currencySymbol,

    onDelete,
    onEdit
}: TransactionRowProps) => {
    const dispatch = useAppDispatch();
    const { items: categories } = useAppSelector(state => state.categories);

    useEffect(() => {
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categories.length]);

    const handleCategoryChange = async (value: string) => {
        const newCategoryId = value === "none" ? null : value;
        if (newCategoryId !== (tx.category_id?.toString() || null)) {
            try {
                await dispatch(updateTransactionCategory({ id: tx.transaction_id, categoryId: newCategoryId })).unwrap();
                toast.success('Category updated successfully');
            } catch (err: any) {
                toast.error(err || 'Failed to update category');
            }
        }
    };

    return (
    <div className="group flex flex-col gap-4 p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <div className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors",
                Number(tx.amount || 0) >= 0 ? "bg-income-muted text-income" : "bg-expense-muted text-expense"
            )}>
                {Number(tx.amount || 0) >= 0 ? <Plus size={20} /> : <div className="w-4 h-0.5 bg-current rounded-full" />}
            </div>
            <div className="min-w-0">
                <div className="truncate text-sm font-semibold leading-tight text-foreground sm:text-base">{tx.description || 'No description'}</div>
                {tx.additional_info && (
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Info size={11} className="shrink-0" />
                        <span>{tx.additional_info}</span>
                    </div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-sm border border-border bg-muted/50 px-2 py-0.5">#{tx.transaction_id}</span>
                    {accountName && (
                        <>
                            <span className="font-medium text-foreground/80">{accountName}</span>
                            <span className="text-muted-foreground/30">•</span>
                        </>
                    )}
                    <span>{formatDate(tx.transaction_date, true)}</span>
                    <Select 
                        value={tx.category_id?.toString() || "none"}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger className="flex h-7 w-auto items-center gap-1.5 rounded-sm border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-muted-foreground shadow-none ring-0 focus:ring-0 [&>svg:last-child]:hidden cursor-pointer">
                            <Tag size={10} className="shrink-0" />
                            <SelectValue placeholder="Add Category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none" className="text-muted-foreground italic">No Category</SelectItem>
                            {categories.map(c => <SelectItem key={c.category_id} value={c.category_id.toString()}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
        <div className="flex items-center justify-between gap-4 pl-[3.25rem] sm:justify-end sm:pl-0">
            <span className={cn(
                "amount text-base sm:text-lg",
                Number(tx.amount || 0) >= 0 ? 'text-income' : 'text-expense'
            )}>
                {formatCurrency(tx.amount, { currency: tx.currency, symbol: currencySymbol, decimals: 2, signed: true })}
            </span>
            <div className="flex gap-1 opacity-100 transition-opacity lg:opacity-0 lg:group-focus-within:opacity-100 lg:group-hover:opacity-100">
                {onEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(tx)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        title="Edit Transaction"
                        aria-label={`Edit ${tx.description || 'transaction'}`}
                    >
                        <Pencil size={14} />
                    </Button>
                )}
                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(tx.transaction_id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete Transaction"
                        aria-label={`Delete ${tx.description || 'transaction'}`}
                    >
                        <Trash2 size={14} />
                    </Button>
                )}
            </div>
        </div>
    </div>
    );
});

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
