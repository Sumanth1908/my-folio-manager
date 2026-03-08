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

interface AccountQuickViewProps {
    account: Account;
    onClose: () => void;
}

const AccountQuickView = ({ account, onClose }: AccountQuickViewProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-border/50">
                <div>
                    <h4 className="text-2xl font-black text-foreground">{account.account_name}</h4>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mt-1">{account.account_type} · {account.currency}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${account.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                    {account.status}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {account.account_type === ACCOUNT_TYPE.SAVINGS && account.savings_account && (
                    <>
                        <InfoCard disabled label="Current Balance" value={`${account.currency} ${Number(account.savings_account.balance).toLocaleString()}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Interest Rate" value={`${account.savings_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                        <InfoCard disabled label="Min Balance" value={`${account.currency} ${Number(account.savings_account.min_balance).toLocaleString()}`} icon={<Target size={16} />} />
                        <InfoCard disabled label="Accrual Day" value={account.savings_account.interest_accrual_day?.toString() || '1'} icon={<Calendar size={16} />} />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.LOAN && account.loan_account && (
                    <>
                        <InfoCard disabled label="Loan Amount" value={`${account.currency} ${Number(account.loan_account.loan_amount).toLocaleString()}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Outstanding" value={`${account.currency} ${Number(account.loan_account.outstanding_amount).toLocaleString()}`} icon={<TrendingDown size={16} className="text-rose-500" />} color="text-rose-500" />
                        <InfoCard disabled label="Interest Rate" value={`${account.loan_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                        <InfoCard disabled label="EMI Amount" value={`${account.currency} ${Number(account.loan_account.emi_amount).toLocaleString()}`} icon={<Clock size={16} />} />
                        <InfoCard disabled label="Tenure" value={`${account.loan_account.tenure_months} Months`} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Start Date" value={formatDate(account.loan_account.start_date)} icon={<Calendar size={16} />} />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT && account.fixed_deposit_account && (
                    <>
                        <InfoCard disabled label="Principal" value={`${account.currency} ${Number(account.fixed_deposit_account.principal_amount).toLocaleString()}`} icon={<DollarSign size={16} />} />
                        <InfoCard disabled label="Maturity Amount" value={`${account.currency} ${Number(account.fixed_deposit_account.maturity_amount).toLocaleString()}`} icon={<TrendingUp size={16} className="text-emerald-500" />} color="text-emerald-500" />
                        <InfoCard disabled label="Interest Rate" value={`${account.fixed_deposit_account.interest_rate}%`} icon={<BadgePercent size={16} />} />
                        <InfoCard disabled label="Accrual Day" value={account.fixed_deposit_account.interest_accrual_day?.toString() || '1'} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Start Date" value={formatDate(account.fixed_deposit_account.start_date)} icon={<Calendar size={16} />} />
                        <InfoCard disabled label="Maturity Date" value={formatDate(account.fixed_deposit_account.maturity_date)} icon={<Calendar size={16} />} />
                    </>
                )}

                {account.account_type === ACCOUNT_TYPE.INVESTMENT && account.investment_holdings && (
                    <div className="col-span-2 space-y-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Asset Holdings ({account.investment_holdings.length})</p>
                        <div className="bg-muted/30 rounded-2xl border border-border/50 overflow-hidden">
                            {account.investment_holdings.map((holding, idx) => (
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
                                        <p className="text-[10px] text-muted-foreground">Avg: {account.currency} {Number(holding.average_price).toLocaleString()}</p>
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
