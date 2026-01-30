import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { memo, useMemo, useEffect } from 'react';
import type { Transaction, Currency } from '../../types';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import LoadingSpinner from '../LoadingSpinner';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import type { RootState } from '../../store';

interface AccountTransactionsProps {
    transactions: Transaction[] | undefined;
    isLoading: boolean;
    symbol?: string;
    currencies?: Currency[];
    onEdit?: (tx: Transaction) => void;
    onDelete?: (id: number) => void;
    showAccountName?: boolean;
}

const TransactionRow = memo(({
    tx,
    accountName,
    currencySymbol,
    onEdit,
    onDelete
}: {
    tx: Transaction,
    accountName?: string,
    currencySymbol: string,
    onEdit?: (tx: Transaction) => void,
    onDelete?: (id: number) => void
}) => (
    <div className="group flex justify-between items-center p-6 hover:bg-muted/30 transition-all">
        <div className="flex items-center gap-5">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                tx.transaction_type === 'Credit' ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500"
            )}>
                {tx.transaction_type === 'Credit' ? <Plus size={20} /> : <div className="w-4 h-0.5 bg-current rounded-full" />}
            </div>
            <div>
                <div className="font-bold text-base text-foreground leading-tight mb-1">{tx.description || 'No Description'}</div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">{`ID: ${tx.transaction_id}`}</span>
                    {accountName && (
                        <>
                            <span className="text-primary/70">{accountName}</span>
                            <span className="text-muted-foreground/30">•</span>
                        </>
                    )}
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">{new Date(tx.transaction_date).toLocaleDateString()}</span>
                    {tx.category && (
                        <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">
                            <Tag size={10} />
                            {tx.category.name}
                        </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-6">
            <span className={cn(
                "font-black text-lg tabular-nums tracking-tighter",
                tx.transaction_type === 'Credit' ? 'text-emerald-500' : 'text-foreground'
            )}>
                {tx.transaction_type === 'Credit' ? '+' : '-'}{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
            </span>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(tx)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                        title="Edit Transaction"
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
                    >
                        <Trash2 size={14} />
                    </Button>
                )}
            </div>
        </div>
    </div>
));

const AccountTransactions = memo(({
    transactions,
    isLoading,
    symbol,
    currencies,
    onEdit,
    onDelete,
    showAccountName = false
}: AccountTransactionsProps) => {
    const dispatch = useAppDispatch();
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    useEffect(() => {
        if (showAccountName && accounts.length === 0) {
            dispatch(fetchAccounts());
        }
    }, [dispatch, showAccountName, accounts.length]);

    const accountsMap = useMemo(() => {
        const map = new Map<string, string>();
        accounts.forEach(a => {
            if (a.account_id) map.set(a.account_id, a.account_name || 'Unknown Account');
        });
        return map;
    }, [accounts]);

    const getCurrencySymbol = (tx: Transaction) => {
        if (currencies) {
            return currencies.find(c => c.code === tx.currency)?.symbol || tx.currency || '$';
        }
        return symbol || '$';
    };

    return (
        <>
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {transactions?.map((tx: Transaction) => (
                        <TransactionRow
                            key={tx.transaction_id}
                            tx={tx}
                            accountName={showAccountName ? accountsMap.get(tx.account_id) : undefined}
                            currencySymbol={getCurrencySymbol(tx)}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    ))}
                    {transactions?.length === 0 && (
                        <div className="text-center py-24">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No transactions found</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1 lowercase italic">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
});

export default AccountTransactions;
