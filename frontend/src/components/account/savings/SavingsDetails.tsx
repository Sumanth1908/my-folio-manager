import { Card } from '../../ui/Card';
import type { Account } from '../../../types';

interface SavingsDetailsProps {
    account: Account;
    symbol: string;
}

export default function SavingsDetails({ account, symbol }: SavingsDetailsProps) {
    if (!account.savings_account) return null;

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
                        {account.savings_account.interest_rate ? `${account.savings_account.interest_rate}% APY` : 'N/A'}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Min Balance</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {symbol}{account.savings_account.min_balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
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
