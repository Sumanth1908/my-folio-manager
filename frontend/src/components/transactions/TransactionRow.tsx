import { Plus, Trash2, Tag, Info } from 'lucide-react';
import { memo } from 'react';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { cn, formatDate } from '../../lib/utils';
import { TRANSACTION_TYPE } from '../../constants';

interface TransactionRowProps {
    tx: Transaction;
    accountName?: string;
    currencySymbol: string;

    onDelete?: (id: number) => void;
}

const TransactionRow = memo(({
    tx,
    accountName,
    currencySymbol,

    onDelete
}: TransactionRowProps) => (
    <div className="group flex justify-between items-center p-6 hover:bg-muted/30 transition-colors">
        <div className="flex items-center gap-5">
            <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors shadow-sm",
                tx.transaction_type === TRANSACTION_TYPE.CREDIT ? "bg-emerald-600/15 text-emerald-600" : "bg-rose-600/15 text-rose-600"
            )}>
                {tx.transaction_type === TRANSACTION_TYPE.CREDIT ? <Plus size={20} /> : <div className="w-4 h-0.5 bg-current rounded-full" />}
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
                    <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[9px] border border-border/50">{formatDate(tx.transaction_date)}</span>
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
                tx.transaction_type === TRANSACTION_TYPE.CREDIT ? 'text-emerald-600' : 'text-rose-600'
            )}>
                {tx.transaction_type === TRANSACTION_TYPE.CREDIT ? '+' : '-'}{currencySymbol}{Number(tx.amount || 0).toFixed(2)}
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
));

TransactionRow.displayName = 'TransactionRow';

export default TransactionRow;
