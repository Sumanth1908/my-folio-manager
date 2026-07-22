import { Card } from '../../ui/Card';
import type { Account } from '../../../types';
import { formatCurrency } from '../../../lib/format';

interface SavingsDetailsProps {
    account: Account;
    symbol: string;
}

export default function SavingsDetails({ account, symbol }: SavingsDetailsProps) {
    if (!account.metadata_) return null;

    const md = account.metadata_ as any;

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                    Account Details
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {md.interest_rate ? `${md.interest_rate}% APY` : 'N/A'}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Min Balance</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {formatCurrency(md.min_balance, { currency: account.currency, symbol, decimals: 2 })}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Calculation Basis</p>
                    <p className="text-xl font-black text-foreground">
                        Daily
                    </p>
                </div>
            </div>
        </Card>
    );
}
