import { Plus, Trash2, Tag, Info } from 'lucide-react';
import { memo, useEffect } from 'react';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import { cn, formatDate } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateTransactionCategory } from '../../store/slices/transactionsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import toast from 'react-hot-toast';

interface TransactionRowProps {
    tx: Transaction;
    accountName?: string;
    accountType?: string;
    currencySymbol: string;

    onDelete?: (id: number) => void;
}

const TransactionRow = memo(({
    tx,
    accountName,
    currencySymbol,

    onDelete
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
    <div className="group flex justify-between items-center p-6 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-5">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                Number(tx.amount || 0) >= 0 ? "bg-emerald-600/15 text-emerald-600" : "bg-rose-600/15 text-rose-600"
            )}>
                {Number(tx.amount || 0) >= 0 ? <Plus size={20} /> : <div className="w-4 h-0.5 bg-current rounded-full" />}
            </div>
            <div>
                <div className="font-bold text-base text-foreground leading-tight mb-1">{tx.description || 'No Description'}</div>
                {tx.additional_info && (
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80 mb-2 italic">
                        <Info size={11} className="shrink-0" />
                        <span>{tx.additional_info}</span>
                    </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">{`ID: ${tx.transaction_id}`}</span>
                    {accountName && (
                        <>
                            <span className="text-primary/70">{accountName}</span>
                            <span className="text-muted-foreground/30">•</span>
                        </>
                    )}
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">{formatDate(tx.transaction_date, true)}</span>
                    <Select 
                        value={tx.category_id?.toString() || "none"}
                        onValueChange={handleCategoryChange}
                    >
                        <SelectTrigger className="flex h-auto w-auto items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50 hover:bg-muted transition-colors font-bold uppercase tracking-widest text-muted-foreground shadow-none ring-0 focus:ring-0 [&>svg:last-child]:hidden cursor-pointer">
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
        <div className="flex items-center gap-6">
            <span className={cn(
                "font-black text-lg tabular-nums tracking-tighter",
                Number(tx.amount || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
            )}>
                {Number(tx.amount || 0) >= 0 ? '+' : '-'}{currencySymbol}{Math.abs(Number(tx.amount || 0)).toFixed(2)}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">

                {onDelete && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(tx.transaction_id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        title="Delete Transaction"
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
