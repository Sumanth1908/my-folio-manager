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

import SavingsEditFields from '../savings/SavingsEditFields';
import LoanEditFields from '../loan/LoanEditFields';
import FDEditFields from '../fixed-deposit/FDEditFields';

interface CreateAccountFormProps {
    onSuccess: () => void;
    onCancel: () => void;
}

const CreateAccountForm = ({ onSuccess, onCancel }: CreateAccountFormProps) => {
    const dispatch = useAppDispatch();
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);

    // Form State
    const [newAccountName, setNewAccountName] = useState('');
    const [accountType, setAccountType] = useState<string>(ACCOUNT_TYPE.SAVINGS);
    const [currency, setCurrency] = useState(DEFAULT_CURRENCY);
    const [isInterestEnabled, setIsInterestEnabled] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Savings Specific State
    const [savingsInterestRate, setSavingsInterestRate] = useState('');
    // Min Balance is not in SavingsEditFields, need to check if I should add it there or handle separately. 
    // SavingsEditFields has: interestRate, accrualDay. 
    // Accounts.tsx had: interestRate, minBalance, accrualDay.
    // I should probably update SavingsEditFields to include Min Balance to be consistent.
    const [savingsMinBalance, setSavingsMinBalance] = useState('');
    const [savingsAccrualDay, setSavingsAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);

    // Loan Specific State
    const [loanAmount, setLoanAmount] = useState('');
    const [loanInterestRate, setLoanInterestRate] = useState('');
    const [loanTenure, setLoanTenure] = useState('');
    const [loanEMI, setLoanEMI] = useState('');
    const [loanAccrualDay, setLoanAccrualDay] = useState(DEFAULT_ACCRUAL_DAY);
    const [loanStartDate, setLoanStartDate] = useState(new Date().toISOString().split('T')[0]);

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
            setIsSubmitting(true);
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
                    start_date: loanStartDate,
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

    return (
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
                                <SavingsEditFields
                                    interestRate={savingsInterestRate}
                                    setInterestRate={setSavingsInterestRate}
                                    accrualDay={savingsAccrualDay}
                                    setAccrualDay={setSavingsAccrualDay}
                                />
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Min Balance</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={savingsMinBalance}
                                        onChange={(e) => setSavingsMinBalance(e.target.value)}
                                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
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
                                />
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

                            <FDEditFields
                                interestRate={fdInterestRate}
                                setInterestRate={setFdInterestRate}
                                accrualDay={fdAccrualDay}
                                setAccrualDay={setFdAccrualDay}
                            />

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
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={
                        isSubmitting ||
                        !newAccountName ||
                        (accountType === ACCOUNT_TYPE.LOAN && (!loanAmount || (isInterestEnabled && !loanInterestRate))) ||
                        (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (!fdPrincipal || !fdInterestRate || !fdStartDate || !fdMaturityDate || !fdMaturityAmount))
                    }
                >
                    {isSubmitting ? 'Creating...' : 'Create Account'}
                </Button>
            </div>
        </form>
    );
}

export default CreateAccountForm;
