import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Plus, Loader2 } from 'lucide-react';
import { handleApiError } from '../api';
import Modal from '../components/Modal';
import { Button } from '../components/ui/Button';
import { Switch } from '../components/ui/Switch';
import { Card } from '../components/ui/Card';
import AccountSummaryPanel from '../components/AccountSummaryPanel';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import { fetchAccounts, createAccount } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../components/ui/Select';
import { fetchSummary, setSummaryTimeRange } from '../store/slices/summarySlice';
import { cn } from '../lib/utils';
import { ACCOUNT_TYPES, TIME_RANGES, DEFAULT_CURRENCY, DEFAULT_ACCRUAL_DAY, ACCOUNT_TYPE } from '../constants';

export default function Accounts() {
    const dispatch = useAppDispatch();
    const isModalOpen = useAppSelector((state: RootState) => state.ui.modals['createAccount']);
    const { items: accounts, loading: isAccountsLoading } = useAppSelector((state: RootState) => state.accounts);
    const { data: summaryData, loading: isSummaryLoading, filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);

    const timeRange = summaryFilters.timeRange;

    useEffect(() => {
        dispatch(fetchAccounts());
        dispatch(fetchCurrencies());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchSummary({
            timeRange,
            accountTypes: [...ACCOUNT_TYPES]
        }));
    }, [dispatch, timeRange]);

    // Form State
    const [newAccountName, setNewAccountName] = useState('');
    const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPE.SAVINGS);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [isInterestEnabled, setIsInterestEnabled] = useState(false);

    // Savings Specific State
    const [savingsInterestRate, setSavingsInterestRate] = useState('');
    const [savingsMinBalance, setSavingsMinBalance] = useState('');
    const [savingsAccrualDay, setSavingsAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);

    // Loan Specific State
    const [loanAmount, setLoanAmount] = useState('');
    const [loanInterestRate, setLoanInterestRate] = useState('');
    const [loanTenure, setLoanTenure] = useState('');
    const [loanEMI, setLoanEMI] = useState('');
    const [loanAccrualDay, setLoanAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);

    // Fixed Deposit Specific State
    const [fdPrincipal, setFdPrincipal] = useState('');
    const [fdInterestRate, setFdInterestRate] = useState('');
    const [fdStartDate, setFdStartDate] = useState('');
    const [fdMaturityDate, setFdMaturityDate] = useState('');
    const [fdMaturityAmount, setFdMaturityAmount] = useState('');
    const [fdAccrualDay, setFdAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);

    // Set default interest enabled state based on account type
    useEffect(() => {
        if (accountType === ACCOUNT_TYPE.SAVINGS || accountType === ACCOUNT_TYPE.LOAN) {
            setIsInterestEnabled(false);
        } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {
            setIsInterestEnabled(true);
        } else {
            setIsInterestEnabled(false);
        }
    }, [accountType]);

    // Auto-calculate EMI or Tenure
    useEffect(() => {
        if (accountType !== ACCOUNT_TYPE.LOAN) return;

        const P = parseFloat(loanAmount);
        const R_annual = parseFloat(loanInterestRate);
        const T_months = parseFloat(loanTenure);

        if (P && R_annual && T_months) {
            const R = R_annual / 12 / 100;
            const emi = (P * R * Math.pow(1 + R, T_months)) / (Math.pow(1 + R, T_months) - 1);
            if (!document.activeElement?.getAttribute('placeholder')?.includes('calculated')) {
                setLoanEMI(emi.toFixed(2));
            }
        }
    }, [loanAmount, loanInterestRate, loanTenure, accountType]);

    // Auto-calculate FD Maturity Amount
    useEffect(() => {
        if (accountType !== ACCOUNT_TYPE.FIXED_DEPOSIT) return;

        const P = parseFloat(fdPrincipal);
        const R = parseFloat(fdInterestRate);

        if (P && R && fdStartDate && fdMaturityDate) {
            const start = new Date(fdStartDate);
            const end = new Date(fdMaturityDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const diffYears = diffDays / 365;

            if (diffDays > 0) {
                const interest = P * (R / 100) * diffYears;
                const maturity = P + interest;
                if (!document.activeElement?.getAttribute('placeholder')?.includes('0.00')) {
                    setFdMaturityAmount(maturity.toFixed(2));
                }
            }
        }
    }, [fdPrincipal, fdInterestRate, fdStartDate, fdMaturityDate, accountType]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountName) {
            const payload: any = {
                account_name: newAccountName,
                account_type: accountType,
                currency: currency,
                status: 'Active',
                is_interest_enabled: isInterestEnabled
            };

            if (accountType === ACCOUNT_TYPE.SAVINGS) {
                payload.savings_account = {
                    balance: 0,
                    interest_rate: savingsInterestRate ? parseFloat(savingsInterestRate) : null,
                    min_balance: savingsMinBalance ? parseFloat(savingsMinBalance) : 0,
                    interest_accrual_day: parseInt(savingsAccrualDay)
                };
            } else if (accountType === ACCOUNT_TYPE.LOAN) {
                payload.loan_account = {
                    loan_amount: parseFloat(loanAmount),
                    outstanding_amount: parseFloat(loanAmount),
                    interest_rate: parseFloat(loanInterestRate),
                    tenure_months: parseInt(loanTenure),
                    emi_amount: parseFloat(loanEMI),
                    start_date: new Date().toISOString().split('T')[0],
                    interest_accrual_day: parseInt(loanAccrualDay)
                };
            } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {
                payload.fixed_deposit_account = {
                    principal_amount: parseFloat(fdPrincipal),
                    interest_rate: parseFloat(fdInterestRate),
                    start_date: fdStartDate,
                    maturity_date: fdMaturityDate,
                    maturity_amount: parseFloat(fdMaturityAmount),
                    interest_accrual_day: parseInt(fdAccrualDay)
                };
            }

            const promise = dispatch(createAccount(payload)).unwrap();

            await toast.promise(promise, {
                loading: 'Creating account...',
                success: 'Account created successfully!',
                error: (err) => handleApiError(err, 'Failed to create account')
            });

            dispatch(fetchSummary({ timeRange, accountTypes: [...ACCOUNT_TYPES] }));
            closeModal();
        }
    };

    const closeModal = () => {
        dispatch(closeReduxModal('createAccount'));
        setNewAccountName('');
        setAccountType(ACCOUNT_TYPE.SAVINGS);
        setCurrency(DEFAULT_CURRENCY);
        setSavingsInterestRate('');
        setSavingsMinBalance('');
        setSavingsAccrualDay(DEFAULT_ACCRUAL_DAY);
        setLoanAmount('');
        setLoanInterestRate('');
        setLoanTenure('');
        setLoanEMI('');
        setLoanAccrualDay(DEFAULT_ACCRUAL_DAY);
        setFdPrincipal('');
        setFdInterestRate('');
        setFdStartDate('');
        setFdMaturityDate('');
        setFdMaturityAmount('');
        setFdAccrualDay(DEFAULT_ACCRUAL_DAY);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Card className="p-8 border-border/50 bg-background/90 text-foreground">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage your financial portfolio and tracking</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                        <div className="flex bg-muted/50 p-1 rounded-xl border border-border self-start md:self-auto">
                            {TIME_RANGES.map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => dispatch(setSummaryTimeRange(range))}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-4 rounded-lg transition-colors duration-200 h-8",
                                        timeRange !== range && "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {range === 'thisMonth' ? '30D' : range === 'lastMonth' ? 'Last Month' : 'All'}
                                </Button>
                            ))}
                        </div>

                        <Button
                            size="icon"
                            className="rounded-full h-10 w-10 shadow-md hover:bg-primary/90 transition-colors"
                            onClick={() => dispatch(openModal('createAccount'))}
                            title="New Account"
                        >
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>

                {isSummaryLoading || isAccountsLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : summaryData ? (
                    <AccountSummaryPanel data={summaryData} accountsData={accounts} />
                ) : (
                    <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                        <p className="text-muted-foreground">No account data found for this period.</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Account" maxWidth="max-w-3xl">
                <form onSubmit={handleCreateAccount} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Vacation Fund"
                                    value={newAccountName}
                                    onChange={(e) => setNewAccountName(e.target.value)}
                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/30"
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Type</label>
                                <Select
                                    value={accountType}
                                    onValueChange={(value) => setAccountType(value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Account Types</SelectLabel>
                                            <SelectItem value={ACCOUNT_TYPE.SAVINGS}>{ACCOUNT_TYPE.SAVINGS}</SelectItem>
                                            <SelectItem value={ACCOUNT_TYPE.INVESTMENT}>{ACCOUNT_TYPE.INVESTMENT}</SelectItem>
                                            <SelectItem value={ACCOUNT_TYPE.LOAN}>{ACCOUNT_TYPE.LOAN}</SelectItem>
                                            <SelectItem value={ACCOUNT_TYPE.FIXED_DEPOSIT}>{ACCOUNT_TYPE.FIXED_DEPOSIT}</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Currency</label>
                                <Select
                                    value={currency}
                                    onValueChange={(value) => setCurrency(value)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select currency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Supported Currencies</SelectLabel>
                                            {currencies?.map(curr => (
                                                <SelectItem key={curr.code} value={curr.code}>
                                                    {curr.symbol} {curr.name} ({curr.code})
                                                </SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            {accountType === ACCOUNT_TYPE.SAVINGS && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Savings Details</h4>

                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={isInterestEnabled}
                                            onCheckedChange={setIsInterestEnabled}
                                        />
                                        <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setIsInterestEnabled(!isInterestEnabled)}>
                                            Enable Interest
                                        </label>
                                    </div>

                                    <div className={cn("space-y-5 transition-opacity duration-200", !isInterestEnabled && "opacity-50 pointer-events-none")}>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (% APY)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 4.5"
                                                value={savingsInterestRate}
                                                onChange={(e) => setSavingsInterestRate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30 disabled:cursor-not-allowed"
                                                disabled={!isInterestEnabled}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Min Balance</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={savingsMinBalance}
                                                onChange={(e) => setSavingsMinBalance(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30 disabled:cursor-not-allowed"
                                                disabled={!isInterestEnabled}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Accrual Day <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Day of month)</span></label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="1"
                                                value={savingsAccrualDay}
                                                onChange={(e) => setSavingsAccrualDay(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:cursor-not-allowed"
                                                disabled={!isInterestEnabled}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.LOAN && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Loan Details</h4>


                                    <div className="flex items-center gap-3">
                                        <Switch
                                            checked={isInterestEnabled}
                                            onCheckedChange={setIsInterestEnabled}
                                        />
                                        <label className="text-sm font-medium text-foreground cursor-pointer" onClick={() => setIsInterestEnabled(!isInterestEnabled)}>
                                            Enable Interest
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Loan Amount</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={loanAmount}
                                            onChange={(e) => setLoanAmount(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>

                                    <div className={cn("space-y-5 transition-opacity duration-200", !isInterestEnabled && "opacity-50 pointer-events-none")}>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (%/yr)</label>
                                            <input
                                                type="number"
                                                step="0.1"
                                                placeholder="10.5"
                                                value={loanInterestRate}
                                                onChange={(e) => setLoanInterestRate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:cursor-not-allowed"
                                                disabled={!isInterestEnabled}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tenure <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Months)</span></label>
                                                <input
                                                    type="number"
                                                    placeholder="12"
                                                    value={loanTenure}
                                                    onChange={(e) => setLoanTenure(e.target.value)}
                                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:cursor-not-allowed"
                                                    disabled={!isInterestEnabled}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">EMI</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="calculated"
                                                    value={loanEMI}
                                                    onChange={(e) => setLoanEMI(e.target.value)}
                                                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:cursor-not-allowed"
                                                    disabled={!isInterestEnabled}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">EMI Day <span className="text-[10px] text-muted-foreground/50 lowercase italic">(Day of month)</span></label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="1"
                                                value={loanAccrualDay}
                                                onChange={(e) => setLoanAccrualDay(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:cursor-not-allowed"
                                                disabled={!isInterestEnabled}
                                            />
                                        </div>

                                        {(loanEMI && loanTenure && loanAmount) && (
                                            <div className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 p-4 rounded-xl border border-primary/20">
                                                Total Payable: <span className="text-lg font-black ml-2 tabular-nums">{((parseFloat(loanEMI) * parseFloat(loanTenure))).toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (
                                <div className="bg-muted/30 p-5 rounded-2xl space-y-5 border border-border h-full">
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/70 border-b border-border pb-3">Fixed Deposit Details</h4>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Principal Amount</label>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={fdPrincipal}
                                            onChange={(e) => setFdPrincipal(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition placeholder:text-muted-foreground/30"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (% p.a.)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            placeholder="6.5"
                                            value={fdInterestRate}
                                            onChange={(e) => setFdInterestRate(e.target.value)}
                                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={fdStartDate}
                                                onChange={(e) => setFdStartDate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={fdMaturityDate}
                                                onChange={(e) => setFdMaturityDate(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Amount</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={fdMaturityAmount}
                                                onChange={(e) => setFdMaturityAmount(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Accrual Day</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="31"
                                                placeholder="1"
                                                value={fdAccrualDay}
                                                onChange={(e) => setFdAccrualDay(e.target.value)}
                                                className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.INVESTMENT && (
                                <div className="bg-muted/30 p-5 rounded-2xl border border-border h-full flex items-center justify-center">
                                    <p className="text-muted-foreground text-sm text-center">No additional details required for Investment accounts</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={closeModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={
                                !newAccountName ||
                                (accountType === ACCOUNT_TYPE.LOAN && (!loanAmount || (isInterestEnabled && !loanInterestRate))) ||
                                (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount))
                            }
                        >
                            Create Account
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
