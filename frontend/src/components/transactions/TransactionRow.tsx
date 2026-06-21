import { Plus, Trash2, Tag, Info } from 'lucide-react';
import { memo, useState } from 'react';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { cn, formatDate } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateTransactionCategory } from '../../store/slices/transactionsSlice';

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
    accountType,
    currencySymbol,

    onDelete
}: TransactionRowProps) => {
    const dispatch = useAppDispatch();
    const { items: categories } = useAppSelector(state => state.categories);
    const [isEditingCategory, setIsEditingCategory] = useState(false);

    const handleCategoryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newCategoryId = e.target.value;
        setIsEditingCategory(false);
        if (newCategoryId !== tx.category_id?.toString()) {
            await dispatch(updateTransactionCategory({ id: tx.transaction_id, categoryId: newCategoryId || null }));
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
                    <span 
                        className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50 cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => setIsEditingCategory(true)}
                    >
                        <Tag size={10} />
                        {isEditingCategory ? (
                            <select 
                                autoFocus
                                onBlur={() => setIsEditingCategory(false)}
                                onChange={handleCategoryChange}
                                className="bg-transparent border-none outline-none text-[9px] p-0 min-w-[80px]"
                                defaultValue={tx.category_id?.toString() || ""}
                            >
                                <option value="">No Category</option>
                                {categories.map(c => <option key={c.category_id} value={c.category_id.toString()}>{c.name}</option>)}
                            </select>
                        ) : (
                            tx.category?.name || 'Add Category'
                        )}
                    </span>
                    {accountType === 'LOAN' && Number(tx.amount || 0) > 0 && (
                        <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded text-[9px] border border-emerald-500/20 uppercase">
                            Payment
                        </span>
                    )}
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
