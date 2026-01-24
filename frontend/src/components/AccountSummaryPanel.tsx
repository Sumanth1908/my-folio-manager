import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import type { SummaryResponse, AccountSummary } from '../types';

interface AccountSummaryPanelProps {
    data: SummaryResponse;
}

export default function AccountSummaryPanel({ data }: AccountSummaryPanelProps) {
    const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

    const toggleAccount = (accountId: string) => {
        setExpandedAccounts(prev => ({
            ...prev,
            [accountId]: !prev[accountId]
        }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-foreground px-1">Account Breakdowns</h3>
            {data.accounts.map((account: AccountSummary) => (
                <Card key={account.account_id} className="overflow-hidden border-border/40">
                    <div
                        className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent/30 transition-colors"
                        onClick={() => toggleAccount(account.account_id)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`transition-transform duration-200 ${expandedAccounts[account.account_id] ? 'rotate-0' : '-rotate-90'}`}>
                                <ChevronDown size={20} className="text-muted-foreground" />
                            </div>
                            <div>
                                <div className="font-bold text-base text-foreground">{account.account_name || 'Unnamed Account'}</div>
                                <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
                                    <span>{account.account_type}</span>
                                    <span className="w-1 h-1 rounded-full bg-border" />
                                    <span>{account.currency}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6 pr-2">
                            {/* Summarized totals for the account header */}
                            <div className="flex gap-6">
                                <div className="text-right">
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Inflow</div>
                                    <div className="text-sm font-black text-emerald-500 tabular-nums">
                                        +{account.categories.filter(c => c.transaction_type === 'Credit').reduce((acc, c) => acc + c.total_amount, 0).toLocaleString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Outflow</div>
                                    <div className="text-sm font-black text-rose-500 tabular-nums">
                                        -{account.categories.filter(c => c.transaction_type === 'Debit').reduce((acc, c) => acc + c.total_amount, 0).toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* View Account details link */}
                            <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block"></div>
                            <Link
                                to={`/accounts/${account.account_id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-all group/link"
                                title="View Account Details"
                            >
                                <ExternalLink size={18} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {expandedAccounts[account.account_id] && (
                        <CardContent className="pt-0 pb-4 px-4">
                            <div className="bg-muted/30 rounded-xl border border-border/50 overflow-hidden mt-2">
                                <div className="grid grid-cols-12 p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
                                    <div className="col-span-1"></div>
                                    <div className="col-span-6">Category</div>
                                    <div className="col-span-5 text-right">Amount ({account.currency})</div>
                                </div>
                                <div className="divide-y divide-border/30">
                                    {account.categories.length > 0 ? (
                                        account.categories.sort((a, b) => b.total_amount - a.total_amount).map((cat, idx) => (
                                            <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-accent/20 transition-colors">
                                                <div className="col-span-1 flex justify-center">
                                                    {cat.transaction_type === 'Credit' ?
                                                        <TrendingUp size={14} className="text-emerald-500" /> :
                                                        <TrendingDown size={14} className="text-rose-500" />
                                                    }
                                                </div>
                                                <div className="col-span-6 text-sm font-medium text-foreground">{cat.name}</div>
                                                <div className={`col-span-5 text-right text-sm font-bold tabular-nums ${cat.transaction_type === 'Credit' ? 'text-emerald-500' : 'text-foreground'}`}>
                                                    {cat.transaction_type === 'Credit' ? '+' : ''}{cat.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-8 text-center text-sm text-muted-foreground">No transactions found for this period</div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
    );
}
