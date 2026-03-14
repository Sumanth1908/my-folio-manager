import { Card } from '../../ui/Card';
import type { Account } from '../../../types';
import { formatDate } from '../../../lib/utils';

interface LoanDetailsProps {
    account: Account;
    symbol: string;
}

const LoanDetails = ({ account, symbol }: LoanDetailsProps) => {
    if (!account.loan_account) return null;

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
                        {symbol}{account.loan_account.loan_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Outstanding</p>
                    <p className="text-lg font-black text-destructive tabular-nums">
                        {symbol}{account.loan_account.outstanding_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-black text-foreground tabular-nums">
                        {account.loan_account.interest_rate}%
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Amount</p>
                    <p className="text-lg font-black text-primary tabular-nums">
                        {symbol}{account.loan_account.emi_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Tenure</p>
                    <p className="text-lg font-black text-foreground">
                        {account.loan_account.tenure_months}m
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                    <p className="text-lg font-black text-foreground">
                        {formatDate(account.loan_account.start_date)}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Start Date</p>
                    <p className="text-lg font-black text-foreground">
                        {account.loan_account.emi_start_date ? formatDate(account.loan_account.emi_start_date) : '-'}
                    </p>
                </div>
                <div className="bg-background p-4 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Day</p>
                    <p className="text-lg font-black text-foreground">
                        Day {account.loan_account.interest_accrual_day || 1}
                    </p>
                </div>
            </div>
        </Card>
    );
}

export default LoanDetails;
