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
        <section className="space-y-2">
            <h2 className="text-xs font-bold text-muted-foreground">Fixed deposit details</h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                        {money((account as any).balance)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Principal Amount</p>
                    <p className="text-lg font-bold text-foreground tabular-nums">
                        {money(md.principal_amount)}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate</p>
                    <p className="text-lg font-bold text-primary tabular-nums">
                        {md.interest_rate}% p.a.
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Schedule</p>
                    <p className="text-lg font-bold text-foreground">Monthly</p>
                    <p className="text-[10px] text-muted-foreground">Accrued daily</p>
                </div>
            </div>
        </section>
    );
}

export default FDDetails;
