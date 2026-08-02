import { CalendarClock, Landmark } from 'lucide-react';
import type { Account } from '../../../types';

export default function InterestPolicySummary({ account }: { account: Account }) {
    const policy = account.interest_policy;
    if (!policy) return null;

    const treatmentLabel = policy.treatment === 'CAPITALIZE'
        ? 'Cumulative / capitalized'
        : policy.treatment === 'PAYOUT'
            ? 'Regular payout'
            : 'Added to interest due';

    return (
        <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                <Landmark className="h-3.5 w-3.5 text-primary" /> Managed interest policy
            </h2>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Annual rate</p>
                    <p className="mt-1 text-lg font-bold tabular-nums">{policy.annual_rate}%</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Handling</p>
                    <p className="mt-1 text-sm font-bold">{treatmentLabel}</p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Settlement</p>
                    <p className="mt-1 flex items-center gap-1 text-sm font-bold">
                        <CalendarClock className="h-3.5 w-3.5" /> {policy.settlement_frequency.replaceAll('_', ' ')}
                    </p>
                </div>
                <div className="rounded-xl border border-border bg-card p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Calculation</p>
                    <p className="mt-1 text-sm font-bold">{policy.day_count.replaceAll('_', ' / ')}</p>
                    <p className="text-[10px] text-muted-foreground">Version {policy.calculation_version ?? 1}</p>
                </div>
            </div>
        </section>
    );
}
