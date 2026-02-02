import { Card } from '../../ui/Card';
import type { Account } from '../../../types';

interface FDDetailsProps {
    account: Account;
    symbol: string;
}

const FDDetails = ({ account, symbol }: FDDetailsProps) => {
    if (!account.fixed_deposit_account) return null;

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                    Fixed Deposit Details
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Principal Amount</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {symbol}{account.fixed_deposit_account.principal_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {account.fixed_deposit_account.interest_rate}% p.a.
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Amount</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {symbol}{account.fixed_deposit_account.maturity_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                    <p className="text-xl font-black text-foreground">
                        {new Date(account.fixed_deposit_account.start_date).toLocaleDateString()}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Date</p>
                    <p className="text-xl font-black text-foreground">
                        {new Date(account.fixed_deposit_account.maturity_date).toLocaleDateString()}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Accrual Day</p>
                    <p className="text-xl font-black text-foreground">
                        Day {account.fixed_deposit_account.interest_accrual_day || 1}
                    </p>
                </div>
            </div>
        </Card>
    );
}

export default FDDetails;
