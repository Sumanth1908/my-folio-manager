import { Card } from '../ui/Card';
import InvestmentDetails from './InvestmentDetails';
import type { Account } from '../../types';

interface AccountTypeDetailsProps {
    account: Account;
    symbol: string;
}

export default function AccountTypeDetails({ account, symbol }: AccountTypeDetailsProps) {
    if (account.account_type === 'Savings' && account.savings_account) {
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
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Accrual Day</p>
                        <p className="text-xl font-black text-foreground">
                            Day {account.savings_account.interest_accrual_day || 1}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (account.account_type === 'Fixed Deposit' && account.fixed_deposit_account) {
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

    if (account.account_type === 'Loan' && account.loan_account) {
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
                            {new Date(account.loan_account.start_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="bg-background p-4 rounded-2xl border border-border/50 col-span-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Day</p>
                        <p className="text-lg font-black text-foreground">
                            Day {account.loan_account.interest_accrual_day || 1}
                        </p>
                    </div>
                </div>
            </Card>
        );
    }

    if (account.account_type === 'Investment') {
        return <InvestmentDetails account={account} symbol={symbol} />;
    }

    return null;
}
