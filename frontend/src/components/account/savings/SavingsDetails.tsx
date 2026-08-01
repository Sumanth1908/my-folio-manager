import type { Account } from '../../../types';
import { formatCurrency } from '../../../lib/format';

interface SavingsDetailsProps {
    account: Account;
    symbol: string;
}

export default function SavingsDetails({ account, symbol }: SavingsDetailsProps) {
    if (!account.metadata_) return null;

    const md = account.metadata_;

    return (
        <section className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground">Account details</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                        {md.interest_rate ? `${md.interest_rate}% APY` : 'N/A'}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Min Balance</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                        {formatCurrency(md.min_balance, { currency: account.currency, symbol, decimals: 2 })}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Frequency</p>
                    <p className="text-lg font-bold text-foreground">
                        {(md.interest_frequency || 'MONTHLY').toLowerCase().replace(/^./, (value: string) => value.toUpperCase())}
                    </p>
                </div>
            </div>
        </section>
    );
}
