import { Card } from '../../ui/Card';
import type { Account } from '../../../types';
import { formatDate } from '../../../lib/utils';
import { Repeat } from 'lucide-react';

interface RDDetailsProps {
    account: Account;
    symbol: string;
}

const RDDetails = ({ account, symbol }: RDDetailsProps) => {
    if (!account.metadata_) return null;

    const md = account.metadata_ as any;

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Repeat className="w-5 h-5 text-indigo-500" />
                </div>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-foreground/80">
                    Recurring Deposit Details
                </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Current Balance</p>
                    <p className="text-xl font-black text-primary tabular-nums">
                        {symbol}{(account as any).balance?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
                    </p>
                </div>
                <div className="bg-background p-5 rounded-2xl border border-border/50">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Monthly Deposit</p>
                    <p className="text-xl font-black text-foreground tabular-nums">
                        {symbol}{md.deposit_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
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
                        {symbol}{md.maturity_amount?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || '0.00'}
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
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Deposit Day</p>
                    <p className="text-xl font-black text-foreground">
                        {md.deposit_day ? `${md.deposit_day}th of month` : '-'}
                    </p>
                </div>
                {md.is_auto_deposit && (
                    <div className="bg-background p-5 rounded-2xl border border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Auto Deposit</p>
                        <p className="text-xl font-black text-emerald-500">
                            Enabled
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}

export default RDDetails;
