import { Card } from '../../ui/Card';
import type { Account } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';

interface LoanDetailsProps {
    account: Account;
    symbol: string;
}

const LoanDetails = ({ account, symbol }: LoanDetailsProps) => {
    if (!account.metadata_) return null;

    const md = account.metadata_ as any;
    const money = (value: number | undefined) =>
        formatCurrency(value, { currency: account.currency, symbol, decimals: 2 });

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-3">
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                    Loan Details
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Loan Amount</p>
                    <p className="text-lg font-black text-foreground tabular-nums">
                        {money(md.loan_amount)}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Outstanding</p>
                    <p className="text-lg font-black text-destructive tabular-nums">
                        {money((account as any).balance ? Math.abs((account as any).balance) : md.outstanding_amount)}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-black text-foreground tabular-nums">
                        {md.interest_rate}%
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Amount</p>
                    <p className="text-lg font-black text-primary tabular-nums">
                        {money(md.emi_amount)}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tenure</p>
                    <p className="text-lg font-black text-foreground">
                        {md.tenure_months}m
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                    <p className="text-lg font-black text-foreground">
                        {md.start_date ? formatDate(md.start_date) : '-'}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Start Date</p>
                    <p className="text-lg font-black text-foreground">
                        {md.emi_start_date ? formatDate(md.emi_start_date) : '-'}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Day</p>
                    <p className="text-lg font-black text-foreground">
                        Day {md.interest_accrual_day || 1}
                    </p>
                </div>
            </div>
        </Card>
    );
}

export default LoanDetails;
