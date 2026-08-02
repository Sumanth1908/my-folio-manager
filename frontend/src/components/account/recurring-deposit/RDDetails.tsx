import type { Account } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';
import { Repeat } from 'lucide-react';
import { getRecurringDepositScheduleDay } from '../../../lib/accounts';

interface RDDetailsProps {
    account: Account;
    symbol: string;
}

const RDDetails = ({ account, symbol }: RDDetailsProps) => {
    if (!account.metadata_) return null;

    const md = account.metadata_;
    const scheduleDay = getRecurringDepositScheduleDay(account);
    const interestRate = account.interest_policy?.annual_rate;
    const money = (value: number | undefined) =>
        formatCurrency(value, { currency: account.currency, symbol, decimals: 2 });

    return (
        <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Repeat className="h-3.5 w-3.5 text-indigo-500" /> Recurring deposit details
            </h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                        {money(account.balance)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Monthly Deposit</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                        {money(md.deposit_amount)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                        {interestRate != null ? `${interestRate}% p.a.` : '-'}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Amount</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                        {money(md.maturity_amount)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Start Date</p>
                    <p className="text-lg font-bold text-foreground">
                        {md.start_date ? formatDate(md.start_date) : '-'}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Maturity Date</p>
                    <p className="text-lg font-bold text-foreground">
                        {md.maturity_date ? formatDate(md.maturity_date) : '-'}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Monthly Schedule</p>
                    <p className="text-lg font-bold text-foreground">
                        {scheduleDay ? `Day ${scheduleDay} of each month` : '-'}
                    </p>
                </div>
                {md.is_auto_deposit && (
                    <div className="rounded-xl border border-border bg-card p-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Auto Deposit</p>
                        <p className="text-lg font-bold text-emerald-500">
                            Enabled
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}

export default RDDetails;
