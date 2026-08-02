import { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { createAccount, fetchAccounts, fetchAccountTypes } from '../../../store/slices/accountsSlice';
import { fetchSummary } from '../../../store/slices/summarySlice';
import api, { handleApiError } from '../../../api';
import type { InterestPreview } from '../../../types';
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
import { cn, formatDate } from '../../../lib/utils';
import { formatNumber } from '../../../lib/format';
import { DEFAULT_CURRENCY, ACCOUNT_TYPE, HOLDING_ACCOUNT_TYPES, INTEREST_TREATMENT } from '../../../constants';
import { toast } from 'sonner';
import { PiggyBank, TrendingUp, Landmark, ShieldCheck, Repeat, WalletCards, Gem, Bitcoin, Building2, Boxes } from 'lucide-react';

import LoanEditFields from '../loan/LoanEditFields';
import InterestPolicyFields, {
    SELF_PAYOUT_ACCOUNT,
    type InterestPolicyFormState,
} from './InterestPolicyFields';
import {
    addMonthsClamped,
    calculateLoanEmi,
    calculateLoanProjection,
    calculateLoanTenure,
    type LoanCalculationSource,
} from '../../../lib/loans';

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
    },
    {
        id: ACCOUNT_TYPE.CASH,
        title: 'Cash Account',
        description: 'Track cash, wallets, and liquid balances.',
        icon: WalletCards,
        color: 'text-teal-500'
    },
    {
        id: ACCOUNT_TYPE.COMMODITY,
        title: 'Commodity / Gold',
        description: 'Track gold, silver, and other commodities by unit.',
        icon: Gem,
        color: 'text-yellow-500'
    },
    {
        id: ACCOUNT_TYPE.CRYPTO,
        title: 'Crypto Assets',
        description: 'Track digital assets with manual or market pricing.',
        icon: Bitcoin,
        color: 'text-orange-500'
    },
    {
        id: ACCOUNT_TYPE.REAL_ESTATE,
        title: 'Real Estate',
        description: 'Track property cost and current valuation.',
        icon: Building2,
        color: 'text-cyan-500'
    },
    {
        id: ACCOUNT_TYPE.OTHER_ASSET,
        title: 'Other Asset',
        description: 'Track collectibles, private assets, and anything else.',
        icon: Boxes,
        color: 'text-violet-500'
    }
];

const deriveMaturityDate = (startDate: string, tenureMonths: string): string => {
    const months = Number.parseInt(tenureMonths, 10);
    const [year, month, day] = startDate.split('-').map(Number);
    if (!year || !month || !day || !Number.isFinite(months) || months <= 0) return '';

    const targetMonthIndex = month - 1 + months;
    const targetYear = year + Math.floor(targetMonthIndex / 12);
    const targetMonth = targetMonthIndex % 12;
    const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
    const targetDay = Math.min(day, lastDay);
    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(targetDay).padStart(2, '0')}`;
};

const CreateAccountForm = ({ onSuccess, onCancel }: CreateAccountFormProps) => {
    const dispatch = useAppDispatch();
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);
    const { accountTypes: accountTypeDefinitions } = useAppSelector((state: RootState) => state.accounts);
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
    const initialLoanStartDate = new Date().toISOString().split('T')[0];
    const [loanStartDate, setLoanStartDate] = useState(initialLoanStartDate);
    const [loanEMIStartDate, setLoanEMIStartDate] = useState(addMonthsClamped(initialLoanStartDate, 1));
    const [loanIsAutoDebit, setLoanIsAutoDebit] = useState(false);
    const [loanLinkedAccountId, setLoanLinkedAccountId] = useState('');
    const [loanCalculationSource, setLoanCalculationSource] = useState<LoanCalculationSource>('TENURE');

        // Recurring Deposit Specific State
    const [rdDepositAmount, setRdDepositAmount] = useState('');
    const [rdInterestRate, setRdInterestRate] = useState('');
    const [rdTenure, setRdTenure] = useState('');
    const [rdStartDate, setRdStartDate] = useState('');
    const [rdMaturityAmount, setRdMaturityAmount] = useState('');
    const [rdEstimatedInterest, setRdEstimatedInterest] = useState('');
    const [rdIsAutoDeposit, setRdIsAutoDeposit] = useState(false);
    const [rdLinkedAccountId, setRdLinkedAccountId] = useState('');

    // Fixed Deposit Specific State
    const [fdPrincipal, setFdPrincipal] = useState('');
    const [fdInterestRate, setFdInterestRate] = useState('');
    const [fdStartDate, setFdStartDate] = useState('');
    const [fdMaturityDate, setFdMaturityDate] = useState('');
    const [fdMaturityAmount, setFdMaturityAmount] = useState('');
    const [fdEstimatedInterest, setFdEstimatedInterest] = useState('');
    const [fdFundFromAccount, setFdFundFromAccount] = useState(false);
    const [fdLinkedAccount, setFdLinkedAccount] = useState('');
    const [interestTreatment, setInterestTreatment] = useState<InterestPolicyFormState['treatment']>('CAPITALIZE');
    const [interestSettlementFrequency, setInterestSettlementFrequency] = useState('MONTHLY');
    const [interestDayCount, setInterestDayCount] = useState<InterestPolicyFormState['dayCount']>('ACTUAL_365');
    const [interestPayoutAccountId, setInterestPayoutAccountId] = useState('');
    const [interestCategoryId, setInterestCategoryId] = useState('');
    const rdMaturityDate = useMemo(
        () => deriveMaturityDate(rdStartDate, rdTenure),
        [rdStartDate, rdTenure],
    );
    const loanPayoffDate = useMemo(
        () => addMonthsClamped(loanEMIStartDate, Math.max(0, Number.parseInt(loanTenure, 10) - 1)),
        [loanEMIStartDate, loanTenure],
    );
    const loanProjection = useMemo(
        () => calculateLoanProjection(loanAmount, loanInterestRate, loanEMI, loanTenure),
        [loanAmount, loanInterestRate, loanEMI, loanTenure],
    );

    useEffect(() => {
        if (accountTypeDefinitions.length === 0) {
            dispatch(fetchAccountTypes());
        }
    }, [accountTypeDefinitions.length, dispatch]);

    const accountTypeConfigs = useMemo(() => {
        if (accountTypeDefinitions.length === 0) return ACCOUNT_TYPE_CONFIG;
        return accountTypeDefinitions.map((definition) => {
            const configured = ACCOUNT_TYPE_CONFIG.find((item) => item.id === definition.key);
            return configured || {
                id: definition.key,
                title: definition.label,
                description: definition.supports_holdings
                    ? 'Track individually valued holdings in this account.'
                    : 'Track this account through its transaction ledger.',
                icon: definition.supports_holdings ? Boxes : WalletCards,
                color: 'text-primary',
            };
        });
    }, [accountTypeDefinitions]);

    useEffect(() => {
        if (accountType === ACCOUNT_TYPE.SAVINGS) {
            setIsInterestEnabled(false);
        } else if ([ACCOUNT_TYPE.LOAN, ACCOUNT_TYPE.FIXED_DEPOSIT, ACCOUNT_TYPE.RECURRING_DEPOSIT].includes(accountType as never)) {
            setIsInterestEnabled(true);
        } else {
            setIsInterestEnabled(false);
        }
        setInterestTreatment('CAPITALIZE');
        setInterestDayCount('ACTUAL_365');
        setInterestSettlementFrequency(
            accountType === ACCOUNT_TYPE.FIXED_DEPOSIT || accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT
                ? 'QUARTERLY'
                : 'MONTHLY'
        );
        setInterestPayoutAccountId(
            accountType === ACCOUNT_TYPE.FIXED_DEPOSIT ? SELF_PAYOUT_ACCOUNT : ''
        );
        setInterestCategoryId('');
    }, [accountType]);

    const selectedInterestRate = accountType === ACCOUNT_TYPE.LOAN
        ? loanInterestRate
        : accountType === ACCOUNT_TYPE.FIXED_DEPOSIT
            ? fdInterestRate
            : accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT
                ? rdInterestRate
                : savingsInterestRate;

    const handleInterestPolicyChange = (next: InterestPolicyFormState) => {
        setIsInterestEnabled(next.enabled);
        setInterestTreatment(next.treatment);
        setInterestSettlementFrequency(next.settlementFrequency);
        setInterestDayCount(next.dayCount);
        setInterestPayoutAccountId(next.payoutAccountId);
        setInterestCategoryId(next.categoryId);
        if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) setFdInterestRate(next.rate);
        else if (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) setRdInterestRate(next.rate);
        else setSavingsInterestRate(next.rate);
    };

    useEffect(() => {
        if (accountType !== ACCOUNT_TYPE.LOAN) return;

        if (loanCalculationSource === 'TENURE') {
            const emi = calculateLoanEmi(loanAmount, loanInterestRate, loanTenure);
            if (emi != null) setLoanEMI(emi.toFixed(2));
        } else {
            const tenure = calculateLoanTenure(loanAmount, loanInterestRate, loanEMI);
            if (tenure != null) setLoanTenure(String(tenure));
        }
    }, [loanAmount, loanInterestRate, loanTenure, loanEMI, loanCalculationSource, accountType]);

    useEffect(() => {
        const isFd = accountType === ACCOUNT_TYPE.FIXED_DEPOSIT;
        const isRd = accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT;
        if (!isFd && !isRd) return;

        const startDate = isFd ? fdStartDate : rdStartDate;
        const maturityDate = isFd ? fdMaturityDate : rdMaturityDate;
        const amount = isFd ? fdPrincipal : rdDepositAmount;
        const clearProjection = () => {
            if (isFd) {
                setFdMaturityAmount('');
                setFdEstimatedInterest('');
            } else {
                setRdMaturityAmount('');
                setRdEstimatedInterest('');
            }
        };
        if (
            !isInterestEnabled
            || !selectedInterestRate
            || !startDate
            || !maturityDate
            || !amount
            || maturityDate <= startDate
        ) {
            clearProjection();
            return;
        }

        clearProjection();

        const timeout = window.setTimeout(async () => {
            try {
                const response = await api.post<InterestPreview>('/accounts/interest-preview', {
                    account_type: accountType,
                    currency,
                    metadata_: isFd
                        ? { principal_amount: parseFloat(fdPrincipal) }
                        : { deposit_amount: parseFloat(rdDepositAmount) },
                    policy: {
                        enabled: true,
                        direction: 'EARNED',
                        annual_rate: parseFloat(selectedInterestRate),
                        balance_basis: isFd && interestTreatment === INTEREST_TREATMENT.PAYOUT
                            ? 'FIXED_PRINCIPAL'
                            : 'LEDGER_BALANCE',
                        day_count: interestDayCount,
                        treatment: interestTreatment,
                        settlement_frequency: interestSettlementFrequency,
                        payout_account_id: interestTreatment === INTEREST_TREATMENT.PAYOUT
                            && interestPayoutAccountId !== SELF_PAYOUT_ACCOUNT
                            ? interestPayoutAccountId || null
                            : null,
                        effective_from: new Date(`${startDate}T00:00:00Z`).toISOString(),
                        end_date: new Date(`${maturityDate}T00:00:00Z`).toISOString(),
                    },
                });
                const projected = Number(response.data.projected_maturity_amount);
                const estimatedInterest = Number(response.data.estimated_interest);
                if (Number.isFinite(projected)) {
                    if (isFd) setFdMaturityAmount(projected.toFixed(2));
                    else setRdMaturityAmount(projected.toFixed(2));
                }
                if (isFd && Number.isFinite(estimatedInterest)) {
                    setFdEstimatedInterest(estimatedInterest.toFixed(2));
                } else if (isRd && Number.isFinite(estimatedInterest)) {
                    setRdEstimatedInterest(estimatedInterest.toFixed(2));
                }
            } catch {
                // Creation remains possible if preview is temporarily unavailable;
                // the backend validates the policy again on submit.
            }
        }, 350);
        return () => window.clearTimeout(timeout);
    }, [
        accountType,
        currency,
        fdMaturityDate,
        fdPrincipal,
        fdStartDate,
        interestDayCount,
        interestPayoutAccountId,
        interestSettlementFrequency,
        interestTreatment,
        isInterestEnabled,
        rdDepositAmount,
        rdMaturityDate,
        rdStartDate,
        selectedInterestRate,
    ]);

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newAccountName) {
            setIsSubmitting(true);
            
            const metadata: Record<string, unknown> = {};
            
            if (accountType === ACCOUNT_TYPE.SAVINGS) {
                metadata.min_balance = savingsMinBalance ? parseFloat(savingsMinBalance) : 0;
            } else if (accountType === ACCOUNT_TYPE.LOAN) {
                metadata.loan_amount = parseFloat(loanAmount);
                metadata.interest_rate = parseFloat(loanInterestRate);
                metadata.tenure_months = parseInt(loanTenure);
                metadata.emi_amount = parseFloat(loanEMI);
                metadata.start_date = loanStartDate;
                metadata.emi_start_date = loanEMIStartDate || null;
                metadata.is_auto_debit = loanIsAutoDebit;
                metadata.linked_account_id = loanLinkedAccountId || null;
            } else if (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT) {
                metadata.principal_amount = parseFloat(fdPrincipal);
                metadata.start_date = fdStartDate;
                metadata.maturity_date = fdMaturityDate;
                if (fdMaturityAmount) {
                    metadata.maturity_amount = parseFloat(fdMaturityAmount);
                }
                if (fdFundFromAccount && fdLinkedAccount) {
                    metadata.linked_account_id = fdLinkedAccount;
                    metadata.fund_principal = true;
                }
            } else if (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT) {
                metadata.deposit_amount = parseFloat(rdDepositAmount);
                metadata.start_date = rdStartDate;
                metadata.maturity_date = rdMaturityDate;
                if (rdMaturityAmount) {
                    metadata.maturity_amount = parseFloat(rdMaturityAmount);
                }
                metadata.is_auto_deposit = rdIsAutoDeposit;
                metadata.linked_account_id = rdLinkedAccountId || null;
            }

            const payload = {
                account_name: newAccountName,
                account_type: accountType,
                currency: currency,
                status: 'Active',
                is_interest_enabled: accountType === ACCOUNT_TYPE.LOAN ? true : isInterestEnabled,
                metadata_: metadata,
                ...(accountType !== ACCOUNT_TYPE.LOAN && isInterestEnabled && selectedInterestRate ? {
                    interest_policy: {
                        enabled: true,
                        direction: 'EARNED',
                        annual_rate: parseFloat(selectedInterestRate),
                        balance_basis: accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && interestTreatment === INTEREST_TREATMENT.PAYOUT
                            ? 'FIXED_PRINCIPAL'
                            : 'LEDGER_BALANCE',
                        day_count: interestDayCount,
                        treatment: interestTreatment,
                        settlement_frequency: interestSettlementFrequency,
                        payout_account_id: interestTreatment === INTEREST_TREATMENT.PAYOUT
                            && interestPayoutAccountId !== SELF_PAYOUT_ACCOUNT
                            ? interestPayoutAccountId || null
                            : null,
                        category_id: interestCategoryId ? parseInt(interestCategoryId, 10) : null,
                        effective_from: new Date(
                            `${accountType === ACCOUNT_TYPE.FIXED_DEPOSIT ? fdStartDate : accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT ? rdStartDate : new Date().toISOString().split('T')[0]}T00:00:00Z`
                        ).toISOString(),
                        end_date: accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && fdMaturityDate
                            ? new Date(`${fdMaturityDate}T00:00:00Z`).toISOString()
                            : accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && rdMaturityDate
                                ? new Date(`${rdMaturityDate}T00:00:00Z`).toISOString()
                                : null,
                    }
                } : {})
            };

            try {
                await dispatch(createAccount(payload)).unwrap();
                toast.success('Account created successfully!');
                dispatch(fetchSummary({ timeRange: summaryFilters.timeRange }));
                dispatch(fetchAccounts());
                onSuccess();
            } catch (err) {
                handleApiError(err, 'Failed to create account');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const selectedTypeConfig = accountTypeConfigs.find(c => c.id === accountType);
    const SelectedIcon = selectedTypeConfig?.icon;
    const selectedTypeDefinition = accountTypeDefinitions.find((definition) => definition.key === accountType);
    const supportsHoldings = selectedTypeDefinition?.supports_holdings
        ?? HOLDING_ACCOUNT_TYPES.some((type) => type === accountType);
    const supportsInterest = selectedTypeDefinition?.supports_interest
        ?? [ACCOUNT_TYPE.SAVINGS, ACCOUNT_TYPE.LOAN, ACCOUNT_TYPE.FIXED_DEPOSIT, ACCOUNT_TYPE.RECURRING_DEPOSIT].includes(accountType as never);
    const hasInvalidFdDates = accountType === ACCOUNT_TYPE.FIXED_DEPOSIT
        && Boolean(fdStartDate && fdMaturityDate && fdMaturityDate <= fdStartDate);

    return (
        <form onSubmit={handleCreateAccount} className="space-y-6">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.5fr)]">
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
                                        {accountTypeConfigs.map((config) => {
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

                                    <div className="space-y-5">
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

                                    <div className="space-y-5">
                                        <LoanEditFields
                                            interestRate={loanInterestRate}
                                            setInterestRate={setLoanInterestRate}
                                            emiAmount={loanEMI}
                                            setEmiAmount={value => {
                                                setLoanCalculationSource('EMI');
                                                setLoanEMI(value);
                                            }}
                                            tenure={loanTenure}
                                            setTenure={value => {
                                                setLoanCalculationSource('TENURE');
                                                setLoanTenure(value);
                                            }}
                                            startDate={loanStartDate}
                                            setStartDate={value => {
                                                const previousDefault = addMonthsClamped(loanStartDate, 1);
                                                setLoanStartDate(value);
                                                if (!loanEMIStartDate || loanEMIStartDate === previousDefault) {
                                                    setLoanEMIStartDate(addMonthsClamped(value, 1));
                                                }
                                            }}
                                            emiStartDate={loanEMIStartDate}
                                            setEmiStartDate={setLoanEMIStartDate}
                                            calculatedField={loanCalculationSource === 'TENURE' ? 'EMI' : 'TENURE'}
                                        />

                                        {loanProjection && (
                                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-primary/15 bg-primary/[0.03] p-4 text-sm">
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total interest</p>
                                                    <p className="mt-1 font-bold tabular-nums">{currency} {formatNumber(loanProjection.totalInterest, { currency, decimals: 2 })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Total payable</p>
                                                    <p className="mt-1 font-bold tabular-nums">{currency} {formatNumber(loanProjection.totalPayable, { currency, decimals: 2 })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Final EMI</p>
                                                    <p className="mt-1 font-bold tabular-nums">{currency} {formatNumber(loanProjection.finalPayment, { currency, decimals: 2 })}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Expected payoff</p>
                                                    <p className="mt-1 font-bold">{loanPayoffDate ? formatDate(loanPayoffDate) : '—'}</p>
                                                </div>
                                            </div>
                                        )}
                                        
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
                                                                        {acc.account_name} ({currency} {formatNumber(acc.balance, { currency, decimals: 2 })})
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

                                    <div className="border-t border-border/50 pt-2">
                                        <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            1. Deposit plan
                                        </h5>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Monthly Deposit</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
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
                                                min="1"
                                                step="1"
                                                placeholder="e.g. 12"
                                                value={rdTenure}
                                                onChange={(e) => setRdTenure(e.target.value)}
                                                className="date-time-field"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={rdStartDate}
                                                onChange={(e) => setRdStartDate(e.target.value)}
                                                className="date-time-field"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Calculated maturity date</p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">Derived from the start date and tenure.</p>
                                        </div>
                                        <p className="text-sm font-bold text-foreground">
                                            {rdMaturityDate ? formatDate(rdMaturityDate) : '—'}
                                        </p>
                                    </div>

                                    <InterestPolicyFields
                                        title="2. Interest terms"
                                        value={{
                                            enabled: isInterestEnabled,
                                            rate: selectedInterestRate,
                                            treatment: interestTreatment,
                                            settlementFrequency: interestSettlementFrequency,
                                            dayCount: interestDayCount,
                                            payoutAccountId: interestPayoutAccountId,
                                            categoryId: interestCategoryId,
                                        }}
                                        onChange={handleInterestPolicyChange}
                                        accounts={accounts}
                                        categories={categories}
                                        currency={currency}
                                        allowsMaturitySettlement
                                        canDisable={false}
                                        advancedTerms
                                    />

                                    <div className={cn(
                                        'grid grid-cols-1 gap-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-4',
                                        interestTreatment === INTEREST_TREATMENT.PAYOUT && 'sm:grid-cols-2',
                                    )}>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                {interestTreatment === INTEREST_TREATMENT.PAYOUT
                                                    ? 'Deposits at maturity'
                                                    : 'Projected maturity balance'}
                                            </p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">Calculated by the backend interest engine.</p>
                                            <p className="mt-2 text-lg font-bold tabular-nums text-primary">
                                                {rdMaturityAmount
                                                    ? `${currency} ${formatNumber(Number(rdMaturityAmount), { currency, decimals: 2 })}`
                                                    : '—'}
                                            </p>
                                        </div>
                                        {interestTreatment === INTEREST_TREATMENT.PAYOUT && (
                                            <div className="border-t border-border/60 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Projected interest payouts</p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">Total interest paid separately over the term.</p>
                                                <p className="mt-2 text-lg font-bold tabular-nums text-income">
                                                    {rdEstimatedInterest
                                                        ? `${currency} ${formatNumber(Number(rdEstimatedInterest), { currency, decimals: 2 })}`
                                                        : '—'}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 pt-4 border-t border-border/50">
                                        <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">3. Funding</h5>
                                        <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border/50">
                                            <div>
                                                <span className="text-sm font-medium text-foreground">Enable auto deposit</span>
                                                <p className="text-[11px] text-muted-foreground">Transfer each monthly installment from a savings account.</p>
                                            </div>
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
                                                                    {acc.account_name} ({currency} {formatNumber(acc.balance, { currency, decimals: 2 })})
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

                                    <InterestPolicyFields
                                        title="1. Interest handling"
                                        value={{
                                            enabled: isInterestEnabled,
                                            rate: selectedInterestRate,
                                            treatment: interestTreatment,
                                            settlementFrequency: interestSettlementFrequency,
                                            dayCount: interestDayCount,
                                            payoutAccountId: interestPayoutAccountId,
                                            categoryId: interestCategoryId,
                                        }}
                                        onChange={handleInterestPolicyChange}
                                        accounts={accounts}
                                        categories={categories}
                                        currency={currency}
                                        allowsMaturitySettlement
                                        allowSelfPayout
                                        selfPayoutLabel="This fixed deposit account (default)"
                                        canDisable={false}
                                        showDayCount={false}
                                    />

                                    <div className="border-t border-border/50 pt-2">
                                        <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            2. Deposit terms
                                        </h5>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Principal Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">{currency}</span>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    value={fdPrincipal}
                                                    onChange={(e) => setFdPrincipal(e.target.value)}
                                                    className="w-full pl-12 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/30 font-semibold"
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                value={fdStartDate}
                                                onChange={(e) => setFdStartDate(e.target.value)}
                                                className="date-time-field"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Maturity Date</label>
                                            <input
                                                type="date"
                                                value={fdMaturityDate}
                                                onChange={(e) => setFdMaturityDate(e.target.value)}
                                                className="date-time-field"
                                            />
                                        </div>
                                    </div>

                                    {hasInvalidFdDates && (
                                        <p className="text-xs font-medium text-destructive">
                                            Maturity date must be after the start date.
                                        </p>
                                    )}

                                    <div className="grid grid-cols-1 gap-4 rounded-xl border border-primary/15 bg-primary/[0.03] p-4 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                {interestTreatment === INTEREST_TREATMENT.PAYOUT
                                                    ? 'Principal at maturity'
                                                    : 'Projected maturity balance'}
                                            </p>
                                            <p className="mt-1 text-[11px] text-muted-foreground">
                                                {fdMaturityAmount
                                                    ? 'Calculated by the backend interest engine.'
                                                    : 'Enter the principal, rate, and dates to calculate.'}
                                            </p>
                                            <p className="mt-2 text-lg font-bold tabular-nums text-primary">
                                                {fdMaturityAmount
                                                    ? `${currency} ${formatNumber(Number(fdMaturityAmount), { currency, decimals: 2 })}`
                                                    : '—'}
                                            </p>
                                        </div>
                                        {interestTreatment === INTEREST_TREATMENT.PAYOUT && (
                                            <div className="border-t border-border/60 pt-4 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                                                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                                    Projected interest payouts
                                                </p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    Total interest paid separately over the full term.
                                                </p>
                                                <p className="mt-2 text-lg font-bold tabular-nums text-income">
                                                    {fdEstimatedInterest
                                                        ? `${currency} ${formatNumber(Number(fdEstimatedInterest), { currency, decimals: 2 })}`
                                                        : '—'}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="pt-4 border-t border-border/50">
                                        <h5 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                            3. Funding
                                        </h5>
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
                                                                    {acc.account_name} ({currency} {formatNumber(acc.balance, { currency, decimals: 2 })})
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

                            {supportsHoldings && (
                                <div className="flex flex-col items-center justify-center h-48 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                    <div className="p-4 bg-primary/10 rounded-full">
                                        {SelectedIcon ? <SelectedIcon className="w-8 h-8 text-primary" /> : <TrendingUp className="w-8 h-8 text-primary" />}
                                    </div>
                                    <p className="text-muted-foreground text-sm font-medium text-center">
                                        Create the account first, then add assets with quantities,<br />units, acquisition prices, and current values.
                                    </p>
                                </div>
                            )}

                            {supportsInterest
                                && accountType !== ACCOUNT_TYPE.LOAN
                                && accountType !== ACCOUNT_TYPE.FIXED_DEPOSIT
                                && accountType !== ACCOUNT_TYPE.RECURRING_DEPOSIT
                                && (
                                <div className="mt-6">
                                    <InterestPolicyFields
                                        value={{
                                            enabled: isInterestEnabled,
                                            rate: selectedInterestRate,
                                            treatment: interestTreatment,
                                            settlementFrequency: interestSettlementFrequency,
                                            dayCount: interestDayCount,
                                            payoutAccountId: interestPayoutAccountId,
                                            categoryId: interestCategoryId,
                                        }}
                                        onChange={handleInterestPolicyChange}
                                        accounts={accounts}
                                        categories={categories}
                                        currency={currency}
                                        allowsMaturitySettlement={accountType === ACCOUNT_TYPE.FIXED_DEPOSIT || accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT}
                                    />
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
                        (supportsInterest && isInterestEnabled && (
                            !selectedInterestRate
                            || (interestTreatment === INTEREST_TREATMENT.PAYOUT
                                && accountType !== ACCOUNT_TYPE.FIXED_DEPOSIT
                                && !interestPayoutAccountId)
                        )) ||
                        (accountType === ACCOUNT_TYPE.LOAN && (
                            !loanAmount
                            || !loanInterestRate
                            || !loanTenure
                            || !loanEMI
                            || !loanStartDate
                            || !loanEMIStartDate
                            || (loanIsAutoDebit && !loanLinkedAccountId)
                        )) ||
                        (accountType === ACCOUNT_TYPE.FIXED_DEPOSIT && (
                            !fdPrincipal
                            || !fdInterestRate
                            || !fdStartDate
                            || !fdMaturityDate
                            || hasInvalidFdDates
                            || (fdFundFromAccount && !fdLinkedAccount)
                        )) ||
                        (accountType === ACCOUNT_TYPE.RECURRING_DEPOSIT && (!rdDepositAmount || !rdInterestRate || !rdTenure || !rdStartDate || (rdIsAutoDeposit && !rdLinkedAccountId)))
                    }
                >
                    {isSubmitting ? 'Creating...' : 'Create account'}
                </Button>
            </div>
        </form>
    );
}

export default CreateAccountForm;
