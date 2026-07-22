import { Card } from '../../ui/Card';
import type { Account } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';

interface FDDetailsProps {
    account: Account;
    symbol: string;
}

const FDDetails = ({ account, symbol }: FDDetailsProps) => {
    if (!account.metadata_) return null;

    const md = account.metadata_ as any;
    const money = (value: number | undefined) =>
        formatCurrency(value, { currency: account.currency, symbol, decimals: 2 });

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                    Fixed Deposit Details
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {money((account as any).balance)}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Principal Amount</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {money(md.principal_amount)}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {md.interest_rate}% p.a.
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Amount</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {money(md.maturity_amount)}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                    <p className="text-xl font-black text-foreground">
                        {md.start_date ? formatDate(md.start_date) : '-'}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Date</p>
                    <p className="text-xl font-black text-foreground">
                        {md.maturity_date ? formatDate(md.maturity_date) : '-'}
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

export default FDDetails;
