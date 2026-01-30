import { useState, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronDown,
    TrendingUp,
    TrendingDown,
    Info,
    Calendar,
    BadgePercent,
    DollarSign,
    Clock,
    Target,
    Layers,
    Eye
} from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import Modal from './Modal';
import type { SummaryResponse, AccountSummary, Account } from '../types';
import { ACCOUNT_TYPE } from '../constants';

interface AccountSummaryPanelProps {
    data: SummaryResponse;
    accountsData?: Account[];
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

    const inTotal = (account.categories || []).filter(c => c.transaction_type === 'Credit').reduce((acc, c) => acc + Number(c.total_amount || 0), 0);
    const outTotal = (account.categories || []).filter(c => c.transaction_type === 'Debit').reduce((acc, c) => acc + Number(c.total_amount || 0), 0);

    return (
        <Card className="overflow-hidden border-border/40 transition-[border-color,box-shadow,transform] duration-300">
            <div
                className="p-4 flex justify-between items-center cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={onToggle}
            >
                <div className="flex items-center gap-4">
                    <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-0' : '-rotate-90'}`}>
                        <ChevronDown size={20} className="text-muted-foreground" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="font-bold text-base text-foreground">{account.account_name || 'Unnamed Account'}</div>
                            <button
                                onClick={(e) => onOpenInfo(account.account_id, e)}
                                className="p-1 hover:bg-primary/10 rounded-full text-muted-foreground hover:text-primary transition-colors opacity-60 hover:opacity-100"
                                title="Quick Info"
                            >
                                <Info size={12} />
                            </button>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold flex items-center gap-2">
                            <span>{account.account_type}</span>
                            <span className="w-1 h-1 rounded-full bg-border" />
                            <span>{account.currency}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 pr-2">
                    <div className="flex gap-6">
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Inflow</div>
                            <div className="text-sm font-black text-emerald-500 tabular-nums">
                                +{inTotal.toLocaleString()}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">Outflow</div>
                            <div className="text-sm font-black text-rose-500 tabular-nums">
                                -{outTotal.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block"></div>
                    <button
                        onClick={handleView}
                        className="p-2 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-colors group"
                        title="View Details"
                    >
                        <Eye size={18} className="group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <CardContent className="pt-0 pb-4 px-4">
                    <div className="bg-muted/30 rounded-xl border border-border/50 overflow-hidden mt-2">
                        <div className="grid grid-cols-12 p-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border/50">
                            <div className="col-span-1"></div>
                            <div className="col-span-6">Category</div>
                            <div className="col-span-5 text-right">Amount ({account.currency})</div>
                        </div>
                        <div className="divide-y divide-border/30">
                            {account.categories.length > 0 ? (
                                [...account.categories].sort((a, b) => b.total_amount - a.total_amount).map((cat, idx) => (
                                    <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-accent/20 transition-colors">
                                        <div className="col-span-1 flex justify-center">
                                            {cat.transaction_type === 'Credit' ?
                                                <TrendingUp size={14} className="text-emerald-500" /> :
                                                <TrendingDown size={14} className="text-rose-500" />
                                            }
                                        </div>
                                        <div className="col-span-6 text-sm font-medium text-foreground">{cat.name}</div>
                                        <div className={`col-span-5 text-right text-sm font-bold tabular-nums ${cat.transaction_type === 'Credit' ? 'text-emerald-500' : 'text-foreground'}`}>
                                            {cat.transaction_type === 'Credit' ? '+' : ''}{Number(cat.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
    );
});

const AccountSummaryPanel = memo(({ data, accountsData }: AccountSummaryPanelProps) => {
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
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-lg font-bold text-foreground">Account Breakdowns</h3>
            </div>
            {data.accounts.length > 0 ? (
                data.accounts.map((account: AccountSummary) => (
                    <AccountCard
                        key={account.account_id}
                        account={account}
                        isExpanded={!!expandedAccounts[account.account_id]}
                        onToggle={() => toggleAccount(account.account_id)}
                        onOpenInfo={openInfo}
                    />
                ))
            ) : (
                <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-4 bg-muted/10">
                    <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center border border-border/50 shadow-inner">
                        <TrendingDown className="text-muted-foreground/50 rotate-45" size={28} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-lg font-bold text-foreground">No accounts found</p>
                        <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed">
                            We couldn't find any account data to display. Add some transactions or connect an account to see your breakdown.
                        </p>
                    </div>
                </Card>
            )}

            {/* Account Info Modal (Quick View) */}
            <Modal
                isOpen={!!infoAccount}
                onClose={() => setInfoAccount(null)}
                title="Account Information"
                maxWidth="max-w-md"
            >
                {infoAccount && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-border/50">
                            <div>
                                <h4 className="text-2xl font-black text-foreground">{infoAccount.account_name}</h4>
                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{infoAccount.account_type} · {infoAccount.currency}</p>
                            </div>
                            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${infoAccount.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                                {infoAccount.status}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {infoAccount.account_type === ACCOUNT_TYPE.SAVINGS && infoAccount.savings_account && (
                                <>
                                    <InfoCard disabled label="Current Balance" value={`${infoAccount.currency} ${Number(infoAccount.savings_account.balance).toLocaleString()}`} icon={<DollarSign size={16} />} />
                                    <InfoCard disabled label="Interest Rate" value={`${infoAccount.savings_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                                    <InfoCard disabled label="Min Balance" value={`${infoAccount.currency} ${Number(infoAccount.savings_account.min_balance).toLocaleString()}`} icon={<Target size={16} />} />
                                    <InfoCard disabled label="Accrual Day" value={infoAccount.savings_account.interest_accrual_day?.toString() || '1'} icon={<Calendar size={16} />} />
                                </>
                            )}

                            {infoAccount.account_type === ACCOUNT_TYPE.LOAN && infoAccount.loan_account && (
                                <>
                                    <InfoCard disabled label="Loan Amount" value={`${infoAccount.currency} ${Number(infoAccount.loan_account.loan_amount).toLocaleString()}`} icon={<DollarSign size={16} />} />
                                    <InfoCard disabled label="Outstanding" value={`${infoAccount.currency} ${Number(infoAccount.loan_account.outstanding_amount).toLocaleString()}`} icon={<TrendingDown size={16} className="text-rose-500" />} color="text-rose-500" />
                                    <InfoCard disabled label="Interest Rate" value={`${infoAccount.loan_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                                    <InfoCard disabled label="EMI Amount" value={`${infoAccount.currency} ${Number(infoAccount.loan_account.emi_amount).toLocaleString()}`} icon={<Clock size={16} />} />
                                    <InfoCard disabled label="Tenure" value={`${infoAccount.loan_account.tenure_months} Months`} icon={<Calendar size={16} />} />
                                    <InfoCard disabled label="Start Date" value={new Date(infoAccount.loan_account.start_date).toLocaleDateString()} icon={<Calendar size={16} />} />
                                </>
                            )}

                            {infoAccount.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT && infoAccount.fixed_deposit_account && (
                                <>
                                    <InfoCard disabled label="Principal" value={`${infoAccount.currency} ${Number(infoAccount.fixed_deposit_account.principal_amount).toLocaleString()}`} icon={<DollarSign size={16} />} />
                                    <InfoCard disabled label="Maturity Amount" value={`${infoAccount.currency} ${Number(infoAccount.fixed_deposit_account.maturity_amount).toLocaleString()}`} icon={<TrendingUp size={16} className="text-emerald-500" />} color="text-emerald-500" />
                                    <InfoCard disabled label="Interest Rate" value={`${infoAccount.fixed_deposit_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                                    <InfoCard disabled label="Accrual Day" value={infoAccount.fixed_deposit_account.interest_accrual_day?.toString() || '1'} icon={<Calendar size={16} />} />
                                    <InfoCard disabled label="Start Date" value={new Date(infoAccount.fixed_deposit_account.start_date).toLocaleDateString()} icon={<Calendar size={16} />} />
                                    <InfoCard disabled label="Maturity Date" value={new Date(infoAccount.fixed_deposit_account.maturity_date).toLocaleDateString()} icon={<Calendar size={16} />} />
                                </>
                            )}

                            {infoAccount.account_type === ACCOUNT_TYPE.INVESTMENT && infoAccount.investment_holdings && (
                                <div className="col-span-2 space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Holdings ({infoAccount.investment_holdings.length})</p>
                                    <div className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
                                        {infoAccount.investment_holdings.map((holding, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 border-b border-border/30 last:border-0 hover:bg-accent/10 transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                        <Layers size={14} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-foreground">{holding.symbol}</p>
                                                        <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{holding.name}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-foreground">{holding.quantity.toLocaleString()} units</p>
                                                    <p className="text-[10px] text-muted-foreground">Avg: {infoAccount.currency} {Number(holding.average_price).toLocaleString()}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                            <Button
                                variant="ghost"
                                className="w-full text-xs font-bold uppercase tracking-widest"
                                onClick={() => setInfoAccount(null)}
                            >
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
});

export default AccountSummaryPanel;

function InfoCard({ label, value, icon, color = "text-foreground", disabled = false }: { label: string, value: string, icon: React.ReactNode, color?: string, disabled?: boolean }) {
    return (
        <div className={`p-4 rounded-2xl border border-border/50 bg-muted/20 flex flex-col gap-2 transition-[border-color,box-shadow] ${!disabled && 'hover:border-primary/30 cursor-pointer shadow-sm'}`}>
            <div className="flex items-center gap-2 text-muted-foreground">
                {icon}
                <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
            </div>
            <div className={`text-base font-black tabular-nums transition-colors ${color}`}>
                {value}
            </div>
        </div>
    );
}
