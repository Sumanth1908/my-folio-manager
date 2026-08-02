import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Info,
    Eye
} from 'lucide-react';
import Modal from '../../common/Modal';
import AccountQuickView from './AccountQuickView';
import { Badge } from '../../ui/Badge';
import { Button } from '../../ui/Button';
import { EmptyState } from '../../ui/EmptyState';
import type { SummaryResponse, AccountSummary, Account } from '../../../types';
import { TRANSACTION_TYPE } from '../../../constants';
import { cn } from '../../../lib/utils';
import { formatNumber } from '../../../lib/format';

interface AccountSummaryPanelProps {
    data: SummaryResponse;
    accountsData?: Account[];
    emptyMessage?: string;
}

const AccountCard = memo(({
    account,
    isExpanded,
    onToggle,
    onOpenInfo
}: {
    account: AccountSummary,
    isExpanded: boolean,
    onToggle: () => void,
    onOpenInfo: (id: string, e: React.MouseEvent) => void
}) => {
    const navigate = useNavigate();

    const handleView = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigate(`/accounts/${account.account_id}`);
    };

    const inTotal = (account.categories || []).filter(c => c.transaction_type === TRANSACTION_TYPE.CREDIT).reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
    const outTotal = (account.categories || []).filter(c => c.transaction_type === TRANSACTION_TYPE.DEBIT).reduce((acc, c) => acc + Number(c.total_amount || 0), 0);

    return (
        <div className="bg-card">
            <div className="grid gap-4 p-4 transition-colors hover:bg-muted/25 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 shrink-0 text-muted-foreground"
                        onClick={onToggle}
                        aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${account.account_name || 'account'}`}
                        aria-expanded={isExpanded}
                    >
                        <ChevronDown size={18} className={cn('transition-transform', !isExpanded && '-rotate-90')} />
                    </Button>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="truncate text-sm font-semibold text-foreground sm:text-base">{account.account_name || 'Unnamed Account'}</div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => onOpenInfo(account.account_id, e)}
                                className="h-7 w-7 shrink-0 text-muted-foreground"
                                title="Quick Info"
                                aria-label={`Quick information for ${account.account_name || 'account'}`}
                            >
                                <Info size={12} />
                            </Button>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={account.account_type === 'LOAN' ? 'expense' : account.account_type === 'SAVINGS' ? 'income' : 'primary'} className="py-0.5 text-[11px]">
                                {account.account_type.replaceAll('_', ' ')}
                            </Badge>
                            <span aria-hidden="true">·</span>
                            <span>{account.currency}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3 pl-12 sm:justify-end sm:pl-0">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Inflow</div>
                            <div className="amount text-sm text-income" title={formatNumber(inTotal, { currency: account.currency, decimals: 2 })}>
                                +{formatNumber(inTotal, { currency: account.currency, compact: true })}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Outflow</div>
                            <div className="amount text-sm text-expense" title={formatNumber(outTotal, { currency: account.currency, decimals: 2 })}>
                                -{formatNumber(outTotal, { currency: account.currency, compact: true })}
                            </div>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleView}
                        className="text-muted-foreground hover:text-primary"
                        title="View Details"
                        aria-label={`View ${account.account_name || 'account'} details`}
                    >
                        <Eye size={18} />
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <div className="border-t border-border bg-muted/15 px-4 py-4 sm:px-5">
                    <div className="overflow-hidden rounded-md border border-border bg-background">
                        <div className="grid grid-cols-12 border-b border-border p-3 text-xs font-medium text-muted-foreground">
                            <div className="col-span-1"></div>
                            <div className="col-span-6">Category</div>
                            <div className="col-span-5 text-right">Amount ({account.currency})</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {account.categories.length > 0 ? (
                                [...account.categories].sort((a, b) => b.total_amount - a.total_amount).map((cat, idx) => (
                                    <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-accent/20 transition-colors">
                                        <div className="col-span-1 flex justify-center">
                                            {cat.transaction_type === TRANSACTION_TYPE.CREDIT ?
                                                <TrendingUp size={14} className="text-income" /> :
                                                <TrendingDown size={14} className="text-expense" />
                                            }
                                        </div>
                                        <div className="col-span-6 text-sm font-medium text-foreground">{cat.name}</div>
                                        <div className={cn('col-span-5 text-right text-sm font-semibold tabular-nums', cat.transaction_type === TRANSACTION_TYPE.CREDIT ? 'text-income' : 'text-expense')}>
                                            {cat.transaction_type === TRANSACTION_TYPE.CREDIT ? '+' : ''}{formatNumber(cat.total_amount, { currency: account.currency, decimals: 2 })}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-sm text-muted-foreground">No transactions found for this period</div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});

const AccountSummaryPanel = memo(({ data, accountsData, emptyMessage }: AccountSummaryPanelProps) => {
    const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});
    const [infoAccount, setInfoAccount] = useState<Account | null>(null);

    const toggleAccount = useCallback((accountId: string) => {
        setExpandedAccounts(prev => ({
            ...prev,
            [accountId]: !prev[accountId]
        }));
    }, []);

    const openInfo = useCallback((accountId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const fullAccount = accountsData?.find(a => a.account_id === accountId);
        if (fullAccount) {
            setInfoAccount(fullAccount);
        }
    }, [accountsData]);

    return (
        <section className="space-y-3" aria-labelledby="account-breakdowns-title">
            <div className="flex items-center justify-between px-1">
                <h2 id="account-breakdowns-title" className="text-lg font-semibold text-foreground">Account breakdowns</h2>
                <span className="text-xs text-muted-foreground">{data.accounts.length} accounts</span>
            </div>
            {data.accounts.length > 0 ? (
                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
                    {data.accounts.map((account: AccountSummary) => (
                        <AccountCard
                            key={account.account_id}
                            account={account}
                            isExpanded={!!expandedAccounts[account.account_id]}
                            onToggle={() => toggleAccount(account.account_id)}
                            onOpenInfo={openInfo}
                        />
                    ))}
                </div>
            ) : (
                <EmptyState
                    icon={<TrendingDown className="rotate-45" size={20} />}
                    title="No accounts found"
                    description={emptyMessage || "We couldn't find any account data to display. Add some transactions or connect an account to see your breakdown."}
                />
            )}

            {/* Account Info Modal (Quick View) */}
            <Modal
                isOpen={!!infoAccount}
                onClose={() => setInfoAccount(null)}
                title={infoAccount?.account_name || 'Account information'}
                description="A quick summary of this account."
                maxWidth="max-w-md"
            >
                {infoAccount && (
                    <AccountQuickView
                        account={infoAccount}
                        onClose={() => setInfoAccount(null)}
                    />
                )}
            </Modal>
        </section>
    );
});

export default AccountSummaryPanel;
