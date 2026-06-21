import { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { createAccount, fetchAccounts } from '../../../store/slices/accountsSlice';
import { fetchSummary } from '../../../store/slices/summarySlice';
import { handleApiError } from '../../../api';
import { Button } from '../../ui/Button';
import { Switch } from '../../ui/Switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../../ui/Select';
import { cn } from '../../../lib/utils';
import { ACCOUNT_TYPES, DEFAULT_CURRENCY, DEFAULT_ACCRUAL_DAY, ACCOUNT_TYPE } from '../../../constants';
import toast from 'react-hot-toast';
import { PiggyBank, TrendingUp, Landmark, ShieldCheck, Repeat } from 'lucide-react';

import SavingsEditFields from '../savings/SavingsEditFields';
import LoanEditFields from '../loan/LoanEditFields';
import FDEditFields from '../fixed-deposit/FDEditFields';

interface CreateAccountFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const ACCOUNT_TYPE_CONFIG = [
    {
        id: ACCOUNT_TYPE.SAVINGS,
        title: 'Savings Account',
        description: 'Standard account for cash and liquid assets.',
        icon: PiggyBank,
        color: 'text-emerald-500'
    },
    {
        id: ACCOUNT_TYPE.INVESTMENT,
        title: 'Investment Account',
        description: 'Track stocks, ETFs, and other holdings.',
        icon: TrendingUp,
        color: 'text-blue-500'
    },
    {
        id: ACCOUNT_TYPE.LOAN,
        title: 'Loan Account',
        description: 'Manage debts, mortgages, and EMIs.',
        icon: Landmark,
        color: 'text-rose-500'
    },
    {
        id: ACCOUNT_TYPE.FIXED_DEPOSIT,
        title: 'Fixed Deposit',
        description: 'Term deposits with locked maturity.',
        icon: ShieldCheck,
        color: 'text-amber-500'
    },
    {
        id: ACCOUNT_TYPE.RECURRING_DEPOSIT,
        title: 'Recurring Deposit',
        description: 'Periodic deposits with fixed returns.',
        icon: Repeat,
        color: 'text-indigo-500'
    }
];

const CreateAccountForm = ({ onSuccess, onCancel }: CreateAccountFormProps) => {
    const dispatch = useAppDispatch();
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);

    // Form State
    const [newAccountName, setNewAccountName] = useState('');
    const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPE.SAVINGS);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [isInterestEnabled, setIsInterestEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Savings Specific State
    const [savingsInterestRate, setSavingsInterestRate] = useState('');
    const [savingsMinBalance, setSavingsMinBalance] = useState('');

    // Loan Specific State
    const [loanAmount, setLoanAmount] = useState('');
    const [loanInterestRate, setLoanInterestRate] = useState('');
    const [loanTenure, setLoanTenure] = useState('');
    const [loanEMI, setLoanEMI] = useState('');
    const [loanAccrualDay, setLoanAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);
    const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [loanEMIStartDate, setLoanEMIStartDate] = useState('');
    const [loanIsAutoDebit, setLoanIsAutoDebit] = useState(false);
    const [loanLinkedAccountId, setLoanLinkedAccountId] = useState('');

        // Recurring Deposit Specific State
    const [rdDepositAmount, setRdDepositAmount] = useState('');
    const [rdInterestRate, setRdInterestRate] = useState('');
    const [rdTenure, setRdTenure] = useState('');
    const [rdStartDate, setRdStartDate] = useState('');
    const [rdMaturityDate, setRdMaturityDate] = useState('');
    const [rdMaturityAmount, setRdMaturityAmount] = useState('');
    const [rdIsAutoDeposit, setRdIsAutoDeposit] = useState(false);
    const [rdLinkedAccountId, setRdLinkedAccountId] = useState('');
    const [rdDepositDay, setRdDepositDay] = useState(DEFAULT_ACCRUAL_DAY);

    // Fixed Deposit Specific State
    const [fdPrincipal, setFdPrincipal] = useState('');
    const [fdInterestRate, setFdInterestRate] = useState('');
    const [fdStartDate, setFdStartDate] = useState('');
    const [fdMaturityDate, setFdMaturityDate] = useState('');
    const [fdMaturityAmount, setFdMaturityAmount] = useState('');
    const [fdFundFromAccount, setFdFundFromAccount] = useState(false);
    const [fdLinkedAccount, setFdLinkedAccount] = useState('');

    useEffect(() => {
        if (accountType === ACCOUNT_TYPE.SAVINGS || accountType === ACCOUNT_TYPE.LOAN) {
            setIsInterestEnabled(false);
        } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT || accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) {
            setIsInterestEnabled(true);
        } else {
            setIsInterestEnabled(false);
        }
    }, [accountType]);

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
                // Quarterly compounding for FD
                const quarters = diffYears * 4;
                const maturity = P * Math.pow(1 + (R / 100) / 4, quarters);
                if (!document.activeElement?.getAttribute('placeholder')?.includes('0.00')) {
                    setFdMaturityAmount(maturity.toFixed(2));
                }
            }
        }
    }, [fdPrincipal, fdInterestRate, fdStartDate, fdMaturityDate, accountType]);


    useEffect(() => {
        if (accountType !== ACCOUNT_TYPE.RECURRING_DEPOSIT) return;
        if (rdStartDate && rdTenure) {
            const start = new Date(rdStartDate);
            start.setMonth(start.getMonth() + parseInt(rdTenure));
            if (!document.activeElement?.getAttribute('placeholder')?.includes('date')) {
                setRdMaturityDate(start.toISOString().split('T')[0]);
            }
        }
        
        const P = parseFloat(rdDepositAmount);
        const R = parseFloat(rdInterestRate) / 100;
        const n = parseInt(rdTenure);
        
        if (P && R && n) {
            // simple estimation of RD maturity: P * n + P * n * (n+1) / 24 * R
            const principal = P * n;
            const interest = P * n * (n + 1) / 24 * R;
            const maturity = principal + interest;
            if (!document.activeElement?.getAttribute('placeholder')?.includes('0.00')) {
                setRdMaturityAmount(maturity.toFixed(2));
            }
        }
    }, [rdDepositAmount, rdInterestRate, rdTenure, rdStartDate, accountType]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountName) {
            setIsSubmitting(true);
            
            const metadata: any = {};
            
            if (accountType === ACCOUNT_TYPE.SAVINGS) {
                metadata.interest_rate = savingsInterestRate ? parseFloat(savingsInterestRate) : null;
                metadata.min_balance = savingsMinBalance ? parseFloat(savingsMinBalance) : 0;
                metadata.interest_accrual_day = 1;
            } else if (accountType === ACCOUNT_TYPE.LOAN) {
                metadata.loan_amount = parseFloat(loanAmount);
                metadata.outstanding_amount = parseFloat(loanAmount);
                metadata.interest_rate = parseFloat(loanInterestRate);
                metadata.tenure_months = parseInt(loanTenure);
                metadata.emi_amount = parseFloat(loanEMI);
                metadata.start_date = loanStartDate;
                metadata.emi_start_date = loanEMIStartDate || null;
                metadata.interest_accrual_day = parseInt(loanAccrualDay);
                metadata.is_auto_debit = loanIsAutoDebit;
                metadata.linked_account_id = loanLinkedAccountId || null;
            } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {
                metadata.principal_amount = parseFloat(fdPrincipal);
                metadata.interest_rate = parseFloat(fdInterestRate);
                metadata.start_date = fdStartDate;
                metadata.maturity_date = fdMaturityDate;
                metadata.maturity_amount = parseFloat(fdMaturityAmount);
                if (fdFundFromAccount && fdLinkedAccount) {
                    metadata.linked_account_id = fdLinkedAccount;
                    metadata.fund_principal = true;
                }
                metadata.interest_accrual_day = fdStartDate ? parseInt(fdStartDate.split('-')[2], 10) : 1;
            } else if (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) {
                metadata.deposit_amount = parseFloat(rdDepositAmount);
                metadata.interest_rate = parseFloat(rdInterestRate);
                metadata.tenure_months = parseInt(rdTenure);
                metadata.start_date = rdStartDate;
                metadata.maturity_date = rdMaturityDate;
                metadata.maturity_amount = parseFloat(rdMaturityAmount);
                metadata.deposit_day = parseInt(rdDepositDay);
                metadata.is_auto_deposit = rdIsAutoDeposit;
                metadata.linked_account_id = rdLinkedAccountId || null;
            }

            const payload: any = {
                account_name: newAccountName,
                account_type: accountType,
                currency: currency,
                status: 'Active',
                is_interest_enabled: isInterestEnabled,
                metadata_: metadata
            };

            try {
                await dispatch(createAccount(payload)).unwrap();
                toast.success('Account created successfully!');
                dispatch(fetchSummary({
                    timeRange: summaryFilters.timeRange,
                    accountTypes: [...ACCOUNT_TYPES]
                }));
                dispatch(fetchAccounts());
                onSuccess();
            } catch (err) {
                handleApiError(err, 'Failed to create account');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const selectedTypeConfig = ACCOUNT_TYPE_CONFIG.find(c => c.id === accountType);
    const SelectedIcon = selectedTypeConfig?.icon;

    return (
        <form onSubmit={handleCreateAccount} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Details Column */}
                <div className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Type</label>
                            <Select
                                value={accountType}
                                onValueChange={(value) => setAccountType(value)}
                            >
                                <SelectTrigger className="w-full h-16 px-4 bg-background border-border/60 hover:bg-muted/20">
                                    <div className="flex items-center gap-3">
                                        {SelectedIcon && (
                                            <div className={cn("p-2 rounded-lg bg-muted/50", selectedTypeConfig?.color)}>
                                                <SelectedIcon className="w-5 h-5" />
                                            </div>
                                        )}
                                        <div className="flex flex-col items-start">
                                            <span className="font-bold text-foreground leading-tight">{selectedTypeConfig?.title}</span>
                                            <span className="text-xs text-muted-foreground font-normal">{selectedTypeConfig?.description}</span>
                                        </div>
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="w-[300px]">
                                    <SelectGroup>
                                        <SelectLabel>Select Type</SelectLabel>
                                        {ACCOUNT_TYPE_CONFIG.map((config) => {
                                            const Icon = config.icon;
                                            return (
                                                <SelectItem 
                                                    key={config.id} 
                                                    value={config.id}
                                                    className="py-3 px-4"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("p-2 rounded-lg bg-muted/50", config.color)}>
                                                            <Icon className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-foreground">{config.title}</span>
                                                            <span className="text-[10px] text-muted-foreground">{config.description}</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            )
                                        })}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Vacation Fund"
                                value={newAccountName}
                                onChange={(e) => setNewAccountName(e.target.value)}
                                className="w-full p-3.5 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none placeholder:text-muted-foreground/30 transition-shadow"
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Currency</label>
                            <Select
                                value={currency}
                                onValueChange={(value) => setCurrency(value)}
                            >
                                <SelectTrigger className="w-full h-12">
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
                </div>

                {/* Specific Details Column */}
                <div className="h-full">
                    <div className="h-full rounded-2xl border border-border/40 bg-muted/20 backdrop-blur-sm p-6 overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none opacity-50"></div>
                        
                        <div className="relative z-10 transition-all duration-300">
                            {accountType === ACCOUNT_TYPE.SAVINGS && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-emerald-500/10 rounded-lg">
                                            <PiggyBank className="w-5 h-5 text-emerald-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Savings Details</h4>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                        <span className="text-sm font-medium text-foreground">Enable Interest Calculation</span>
                                        <Switch
                                            checked={isInterestEnabled}
                                            onCheckedChange={setIsInterestEnabled}
                                        />
                                    </div>

                                    <div className={cn("space-y-5 transition-all duration-300", !isInterestEnabled && "opacity-40 pointer-events-none grayscale")}>
                                        <SavingsEditFields
                                            interestRate={savingsInterestRate}
                                            setInterestRate={setSavingsInterestRate}
                                        />
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Min Balance Required</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={savingsMinBalance}
                                                    onChange={(e) => setSavingsMinBalance(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.LOAN && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-rose-500/10 rounded-lg">
                                            <Landmark className="w-5 h-5 text-rose-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Loan Details</h4>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                        <span className="text-sm font-medium text-foreground">Enable Interest Calculation</span>
                                        <Switch
                                            checked={isInterestEnabled}
                                            onCheckedChange={setIsInterestEnabled}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Total Loan Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={loanAmount}
                                                onChange={(e) => setLoanAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className={cn("space-y-5 transition-all duration-300", !isInterestEnabled && "opacity-40 pointer-events-none grayscale")}>
                                        <LoanEditFields
                                            interestRate={loanInterestRate}
                                            setInterestRate={setLoanInterestRate}
                                            accrualDay={loanAccrualDay}
                                            setAccrualDay={setLoanAccrualDay}
                                            emiAmount={loanEMI}
                                            setEmiAmount={setLoanEMI}
                                            tenure={loanTenure}
                                            setTenure={setLoanTenure}
                                            startDate={loanStartDate}
                                            setStartDate={setLoanStartDate}
                                            emiStartDate={loanEMIStartDate}
                                            setEmiStartDate={setLoanEMIStartDate}
                                        />
                                        
                                        <div className="pt-4 border-t border-border/50">
                                            <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50 mb-4">
                                                <div className="space-y-0.5">
                                                    <span className="text-sm font-medium text-foreground">Auto Debit EMI</span>
                                                    <p className="text-[10px] text-muted-foreground">Automatically deduct EMI from another account</p>
                                                </div>
                                                <Switch
                                                    checked={loanIsAutoDebit}
                                                    onCheckedChange={setLoanIsAutoDebit}
                                                />
                                            </div>
                                            
                                            {loanIsAutoDebit && (
                                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Debit From Account</label>
                                                    <Select
                                                        value={loanLinkedAccountId}
                                                        onValueChange={setLoanLinkedAccountId}
                                                    >
                                                        <SelectTrigger className="w-full h-12">
                                                            <SelectValue placeholder="Select account" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectGroup>
                                                                <SelectLabel>Available Accounts</SelectLabel>
                                                                {accounts.filter(a => a.account_type === 'SAVINGS' && a.currency === currency).map(acc => (
                                                                    <SelectItem key={acc.account_id} value={acc.account_id}>
                                                                        {acc.account_name} ({currency} {acc.balance?.toLocaleString()})
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectGroup>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            
                            {accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                                            <Repeat className="w-5 h-5 text-indigo-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Recurring Deposit Details</h4>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Monthly Deposit</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                                <input
                                                    type="number"
                                                    placeholder="0.00"
                                                    value={rdDepositAmount}
                                                    onChange={(e) => setRdDepositAmount(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Tenure (Months)</label>
                                            <input
                                                type="number"
                                                placeholder="e.g. 12"
                                                value={rdTenure}
                                                onChange={(e) => setRdTenure(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (%)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="e.g. 6.5"
                                                value={rdInterestRate}
                                                onChange={(e) => setRdInterestRate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Deposit Day</label>
                                            <input
                                                type="number"
                                                min="1" max="31"
                                                placeholder="e.g. 5"
                                                value={rdDepositDay}
                                                onChange={(e) => setRdDepositDay(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={rdStartDate}
                                                onChange={(e) => setRdStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={rdMaturityDate}
                                                onChange={(e) => setRdMaturityDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Amount (Estimated)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={rdMaturityAmount}
                                                onChange={(e) => setRdMaturityAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                            <span className="text-sm font-medium text-foreground">Enable Auto Deposit</span>
                                            <Switch
                                                checked={rdIsAutoDeposit}
                                                onCheckedChange={setRdIsAutoDeposit}
                                            />
                                        </div>
                                        {rdIsAutoDeposit && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Linked Account (Source)</label>
                                                <Select
                                                    value={rdLinkedAccountId}
                                                    onValueChange={setRdLinkedAccountId}
                                                >
                                                    <SelectTrigger className="w-full h-12">
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Available Accounts</SelectLabel>
                                                            {accounts.filter(a => a.account_type === 'SAVINGS' && a.currency === currency).map(acc => (
                                                                <SelectItem key={acc.account_id} value={acc.account_id}>
                                                                    {acc.account_name} ({currency} {acc.balance?.toLocaleString()})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-amber-500/10 rounded-lg">
                                            <ShieldCheck className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <h4 className="text-sm font-bold text-foreground">Fixed Deposit Details</h4>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Principal Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                            <input
                                                type="number"
                                                placeholder="0.00"
                                                value={fdPrincipal}
                                                onChange={(e) => setFdPrincipal(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-semibold"
                                            />
                                        </div>
                                    </div>

                                    <FDEditFields
                                        interestRate={fdInterestRate}
                                        setInterestRate={setFdInterestRate}
                                    />

                                    <div className="grid gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={fdStartDate}
                                                onChange={(e) => setFdStartDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={fdMaturityDate}
                                                onChange={(e) => setFdMaturityDate(e.target.value)}
                                                className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Amount (Estimated)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                value={fdMaturityAmount}
                                                onChange={(e) => setFdMaturityAmount(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border/50">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <label className="text-sm font-bold text-foreground">Fund from Savings</label>
                                                <p className="text-xs text-muted-foreground">Automatically transfer principal from a savings account</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input 
                                                    type="checkbox" 
                                                    className="sr-only peer"
                                                    checked={fdFundFromAccount}
                                                    onChange={(e) => setFdFundFromAccount(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                            </label>
                                        </div>

                                        {fdFundFromAccount && (
                                            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Select Savings Account</label>
                                                <Select 
                                                    value={fdLinkedAccount} 
                                                    onValueChange={setFdLinkedAccount}
                                                >
                                                    <SelectTrigger className="w-full h-12">
                                                        <SelectValue placeholder="Select account" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectGroup>
                                                            <SelectLabel>Available Accounts</SelectLabel>
                                                            {accounts.filter(a => a.account_type === 'SAVINGS' && a.currency === currency).map(acc => (
                                                                <SelectItem key={acc.account_id} value={acc.account_id}>
                                                                    {acc.account_name} ({currency} {acc.balance?.toLocaleString()})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectGroup>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {accountType === ACCOUNT_TYPE.INVESTMENT && (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-4 bg-blue-500/10 rounded-full">
                                        <TrendingUp className="w-8 h-8 text-blue-500" />
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium text-center">Ready to track your portfolio.<br/>No additional details required yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-8 flex justify-end gap-4 border-t border-border/40 mt-8">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="px-6 rounded-xl"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    className="px-8 rounded-xl font-bold shadow-lg shadow-primary/20"
                    disabled={
                        isSubmitting ||
                        !newAccountName ||
                        (accountType === ACCOUNT_TYPE.LOAN && (!loanAmount || (isInterestEnabled && !loanInterestRate))) ||
                        (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount)) ||
                        (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && (!rdDepositAmount || !rdInterestRate || !rdTenure || !rdStartDate || (rdIsAutoDeposit && !rdLinkedAccountId)))
                    }
                >
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
            </div>
        </form>
    );
}

export default CreateAccountForm;
