import {
    DollarSign,
    BadgePercent,
    Target,
    Calendar,
    TrendingDown,
    Clock,
    TrendingUp,
    Layers
} from 'lucide-react';
import { Button } from '../../ui/Button';
import type { Account } from '../../../types';
import { ACCOUNT_TYPE } from '../../../constants';
import { formatDate } from '../../../lib/utils';
import { formatNumber } from '../../../lib/format';
import { accountSupportsHoldings, getAccountHoldings } from '../../../lib/accounts';

interface AccountQuickViewProps {
    account: Account;
    onClose: () => void;
}

const AccountQuickView = ({ account, onClose }: AccountQuickViewProps) => {
    // The currency code is already rendered next to each value, so these are
    // grouped numbers without a symbol.
    const money = (value: unknown) => formatNumber(Number(value ?? 0), { currency: account.currency, decimals: 2 });
    const holdings = getAccountHoldings(account);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                    <h4 className="text-2xl font-black text-foreground">{account.account_name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{account.account_type} · {account.currency}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${account.status === 'Active' ? 'bg-emerald-600/15 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                    {account.status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {account.account_type === ACCOUNT_TYPE.SAVINGS && account.savings_account && (
                    <>
                        <InfoCard disabled label="Current Balance" value={`${account.currency} ${money(account.savings_account.balance)}`} icon={<DollarSign size={16} />} />
                        <InfoCard 
                            disabled 
                            label="Interest Rate" 
                            value={account.is_interest_enabled ? `${account.savings_account.interest_rate}%` : 'Interest Disabled'} 
                            icon={<BadgePercent size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                        <InfoCard disabled label="Min Balance" value={`${account.currency} ${money(account.savings_account.min_balance)}`} icon={<Target size={16} />} />
                        <InfoCard 
                            disabled 
                            label="Accrual Day" 
                            value={account.is_interest_enabled ? (account.savings_account.interest_accrual_day?.toString() || '1') : 'N/A'} 
                            icon={<Calendar size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.LOAN && account.loan_account && (
                    <>
                        <InfoCard disabled label="Loan Amount" value={`${account.currency} ${money(account.loan_account.loan_amount)}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Outstanding" value={`${account.currency} ${money(account.loan_account.outstanding_amount)}`} icon={<TrendingDown size={16} className="text-rose-600" />} color="text-rose-600" />
                        <InfoCard 
                            disabled 
                            label="Interest Rate" 
                            value={account.is_interest_enabled ? `${account.loan_account.interest_rate}%` : 'Interest Disabled'} 
                            icon={<BadgePercent size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                        <InfoCard disabled label="EMI Amount" value={`${account.currency} ${money(account.loan_account.emi_amount)}`} icon={<Clock size={16} />} />
                        <InfoCard disabled label="Tenure" value={`${account.loan_account.tenure_months} Months`} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Start Date" value={formatDate(account.loan_account.start_date)} icon={<Calendar size={16} />} />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT && account.fixed_deposit_account && (
                    <>
                        <InfoCard disabled label="Current Balance" value={`${account.currency} ${money(account.fixed_deposit_account.balance)}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Principal" value={`${account.currency} ${money(account.fixed_deposit_account.principal_amount)}`} icon={<Target size={16} />} />
                        <InfoCard disabled label="Maturity Amount" value={`${account.currency} ${money(account.fixed_deposit_account.maturity_amount)}`} icon={<TrendingUp size={16} className="text-emerald-600" />} color="text-emerald-600" />
                        <InfoCard 
                            disabled 
                            label="Interest Rate" 
                            value={account.is_interest_enabled ? `${account.fixed_deposit_account.interest_rate}%` : 'Interest Disabled'} 
                            icon={<BadgePercent size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                        <InfoCard 
                            disabled 
                            label="Accrual Day" 
                            value={account.is_interest_enabled ? (account.fixed_deposit_account.interest_accrual_day?.toString() || '1') : 'N/A'} 
                            icon={<Calendar size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                        <InfoCard disabled label="Start Date" value={formatDate(account.fixed_deposit_account.start_date)} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Maturity Date" value={formatDate(account.fixed_deposit_account.maturity_date)} icon={<Calendar size={16} />} />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.RECURRING_DEPOSIT && account.metadata_ && (
                    <>
                        <InfoCard disabled label="Current Balance" value={`${account.currency} ${money(account.balance || 0)}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Monthly Deposit" value={`${account.currency} ${money(account.metadata_.deposit_amount)}`} icon={<Target size={16} />} />
                        <InfoCard disabled label="Maturity Amount" value={`${account.currency} ${money(account.metadata_.maturity_amount)}`} icon={<TrendingUp size={16} className="text-emerald-600" />} color="text-emerald-600" />
                        <InfoCard 
                            disabled 
                            label="Interest Rate" 
                            value={account.is_interest_enabled ? `${account.metadata_.interest_rate}%` : 'Interest Disabled'} 
                            icon={<BadgePercent size={16} />} 
                            color={!account.is_interest_enabled ? 'text-muted-foreground/60' : 'text-foreground'}
                        />
                        <InfoCard 
                            disabled 
                            label="Deposit Day" 
                            value={`${account.metadata_.deposit_day}th of month`} 
                            icon={<Calendar size={16} />} 
                        />
                        <InfoCard disabled label="Start Date" value={formatDate(account.metadata_.start_date)} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Maturity Date" value={formatDate(account.metadata_.maturity_date)} icon={<Calendar size={16} />} />
                    </>
                )}

                {accountSupportsHoldings(account) && (
                    <>
                        <InfoCard disabled label="Current Asset Value" value={`${account.currency} ${money(account.asset_value ?? account.net_value ?? 0)}`} icon={<TrendingUp size={16} />} color="text-emerald-600" />
                        <InfoCard disabled label="Ledger Balance" value={`${account.currency} ${money(account.balance ?? 0)}`} icon={<DollarSign size={16} />} />
                        <div className="col-span-2 space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Holdings ({holdings.length})</p>
                            <div className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
                                {holdings.map((holding, idx) => (
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
                                            <p className="text-sm font-black text-foreground">{formatNumber(holding.quantity, { currency: account.currency, maxDecimals: 4 })} {holding.unit}</p>
                                            <p className="text-[10px] text-muted-foreground">Current: {account.currency} {money(holding.current_price ?? holding.average_price)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>

            <div className="pt-4 border-t border-border/50 flex flex-col gap-2">
                <Button
                    variant="ghost"
                    className="w-full text-xs font-bold uppercase tracking-widest"
                    onClick={onClose}
                >
                    Close
                </Button>
            </div>
        </div>
    );
}

const InfoCard = ({ label, value, icon, color = "text-foreground", disabled = false }: { label: string, value: string, icon: React.ReactNode, color?: string, disabled?: boolean }) => {
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

export default AccountQuickView;
