import { useState, useCallback, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { updateAccount } from '../../../store/slices/accountsSlice';
import { fetchCategories } from '../../../store/slices/categoriesSlice';
import type { Account } from '../../../types';
import { ACCOUNT_TYPE } from '../../../constants';
import { Button } from '../../ui/Button';
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../../ui/Select';
import LoanEditFields from '../loan/LoanEditFields';
import InterestPolicyFields, {
    SELF_PAYOUT_ACCOUNT,
    type InterestPolicyFormState,
} from './InterestPolicyFields';
import {
    calculateLoanEmi,
    calculateLoanTenure,
    type LoanCalculationSource,
} from '../../../lib/loans';

interface AccountEditFormProps {
    account: Account;
    onSuccess: () => void;
    onCancel: () => void;
}

interface AccountEditFormData {
    name: string;
    status: string;
    interestRate: string;
    emiAmount: string;
    tenure: string;
    startDate: string;
    emiStartDate: string;
}

const createInitialFormData = (account: Account): AccountEditFormData => ({
    name: account.account_name ?? '',
    status: account.status ?? 'Active',
    interestRate: account.metadata_?.interest_rate?.toString() ?? '',
    emiAmount: account.metadata_?.emi_amount?.toString() ?? '',
    tenure: account.metadata_?.tenure_months?.toString() ?? '',
    startDate: account.metadata_?.start_date
        ? account.metadata_.start_date.substring(0, 10)
        : '',
    emiStartDate: account.metadata_?.emi_start_date
        ? account.metadata_.emi_start_date.substring(0, 10)
        : ''
});

const AccountEditForm = ({ account, onSuccess, onCancel }: AccountEditFormProps) => {
    const dispatch = useAppDispatch();
    const accounts = useAppSelector((state: RootState) => state.accounts.items);
    const categories = useAppSelector((state: RootState) => state.categories.items);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<AccountEditFormData>(() => createInitialFormData(account));
    const [interestPolicy, setInterestPolicy] = useState<InterestPolicyFormState>(() => ({
        enabled: account.interest_policy?.enabled ?? account.is_interest_enabled,
        rate: account.interest_policy?.annual_rate?.toString() ?? '',
        treatment: account.interest_policy?.treatment
            ?? 'CAPITALIZE',
        settlementFrequency: account.interest_policy?.settlement_frequency
            ?? 'MONTHLY',
        dayCount: account.interest_policy?.day_count ?? 'ACTUAL_365',
        payoutAccountId: account.interest_policy?.payout_account_id
            ?? (account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT
                && account.interest_policy?.treatment === 'PAYOUT'
                ? SELF_PAYOUT_ACCOUNT
                : ''),
        categoryId: account.interest_policy?.category_id?.toString() ?? '',
    }));
    const [loanCalculationSource, setLoanCalculationSource] = useState<LoanCalculationSource>('TENURE');
    const supportsInterest = Boolean(
        account.interest_policy
        || account.metadata_?.supports_interest
        || [ACCOUNT_TYPE.SAVINGS, ACCOUNT_TYPE.LOAN, ACCOUNT_TYPE.FIXED_DEPOSIT, ACCOUNT_TYPE.RECURRING_DEPOSIT].includes(account.account_type as never)
    );

    useEffect(() => {
        if (categories.length === 0) dispatch(fetchCategories());
    }, [categories.length, dispatch]);

    useEffect(() => {
        if (account.account_type !== ACCOUNT_TYPE.LOAN) return;
        const principal = account.metadata_?.loan_amount;
        if (loanCalculationSource === 'TENURE') {
            const emi = calculateLoanEmi(principal, formData.interestRate, formData.tenure);
            if (emi != null && formData.emiAmount !== emi.toFixed(2)) {
                setFormData(previous => ({ ...previous, emiAmount: emi.toFixed(2) }));
            }
        } else {
            const tenure = calculateLoanTenure(principal, formData.interestRate, formData.emiAmount);
            if (tenure != null && formData.tenure !== String(tenure)) {
                setFormData(previous => ({ ...previous, tenure: String(tenure) }));
            }
        }
    }, [
        account.account_type,
        account.metadata_,
        formData.emiAmount,
        formData.interestRate,
        formData.tenure,
        loanCalculationSource,
    ]);

    // Memoized update handler
    const updateField = useCallback(<K extends keyof AccountEditFormData>(field: K, value: AccountEditFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const { name, status, interestRate, emiAmount, tenure, startDate, emiStartDate } = formData;

        const data: Record<string, unknown> = {
            account_name: name,
            status
        };

        if (account.account_type === ACCOUNT_TYPE.LOAN) {
            data.metadata_ = {
                ...(account.metadata_ || {}),
                interest_rate: parseFloat(interestRate),
                emi_amount: parseFloat(emiAmount),
                tenure_months: parseInt(tenure, 10),
                start_date: startDate || undefined,
                emi_start_date: emiStartDate || undefined
            };
        }

        if (account.account_type === ACCOUNT_TYPE.LOAN) {
            data.is_interest_enabled = true;
        } else if (supportsInterest) {
            data.is_interest_enabled = interestPolicy.enabled;
            data.interest_policy = {
                enabled: interestPolicy.enabled,
                direction: 'EARNED',
                annual_rate: parseFloat(interestPolicy.rate || '0'),
                balance_basis: account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT && interestPolicy.treatment === 'PAYOUT'
                    ? 'FIXED_PRINCIPAL'
                    : 'LEDGER_BALANCE',
                day_count: interestPolicy.dayCount,
                treatment: interestPolicy.treatment,
                settlement_frequency: interestPolicy.settlementFrequency,
                payout_account_id: interestPolicy.treatment === 'PAYOUT'
                    && interestPolicy.payoutAccountId !== SELF_PAYOUT_ACCOUNT
                    ? interestPolicy.payoutAccountId || null
                    : null,
                category_id: interestPolicy.categoryId
                    ? parseInt(interestPolicy.categoryId, 10)
                    : null,
                // For updates this is the effective date of the new terms, not
                // the original policy start date.
                effective_from: `${new Date().toISOString().split('T')[0]}T00:00:00.000Z`,
                end_date: account.interest_policy?.end_date
                    ?? (account.metadata_?.maturity_date
                        ? new Date(`${account.metadata_.maturity_date}T00:00:00Z`).toISOString()
                        : null),
            };
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateAccount({ id: account.account_id, data })).unwrap();
            toast.success('Account updated!');
            onSuccess();
        } catch {
            toast.error('Failed to update account');
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, account, dispatch, interestPolicy, onSuccess, supportsInterest]);

    // Render type-specific fields
    const typeSpecificFields = useMemo(() => {
        switch (account.account_type) {
            case ACCOUNT_TYPE.FIXED_DEPOSIT:
            case ACCOUNT_TYPE.RECURRING_DEPOSIT:
            case ACCOUNT_TYPE.SAVINGS:
                return null;
            case ACCOUNT_TYPE.LOAN:
                return (
                    <LoanEditFields
                        interestRate={formData.interestRate}
                        setInterestRate={v => updateField('interestRate', v)}
                        emiAmount={formData.emiAmount}
                        setEmiAmount={v => {
                            setLoanCalculationSource('EMI');
                            updateField('emiAmount', v);
                        }}
                        tenure={formData.tenure}
                        setTenure={v => {
                            setLoanCalculationSource('TENURE');
                            updateField('tenure', v);
                        }}
                        startDate={formData.startDate}
                        setStartDate={v => updateField('startDate', v)}
                        emiStartDate={formData.emiStartDate}
                        setEmiStartDate={v => updateField('emiStartDate', v)}
                        calculatedField={loanCalculationSource === 'TENURE' ? 'EMI' : 'TENURE'}
                    />
                );
            default:
                return null;
        }
    }, [account.account_type, formData, loanCalculationSource, updateField]);

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Account Name
                </label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Status
                </label>
                <Select value={formData.status} onValueChange={v => updateField('status', v)}>
                    <SelectTrigger className="w-full bg-muted border border-border rounded-lg h-10">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Status</SelectLabel>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Closed">Closed</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {typeSpecificFields}

            {supportsInterest && account.account_type !== ACCOUNT_TYPE.LOAN && (
                <InterestPolicyFields
                    value={interestPolicy}
                    onChange={setInterestPolicy}
                    accounts={accounts}
                    categories={categories}
                    currency={account.currency}
                    excludeAccountId={account.account_id}
                    allowsMaturitySettlement={Boolean(account.metadata_?.maturity_date)}
                    allowSelfPayout={account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT}
                    selfPayoutLabel="This fixed deposit account (default)"
                    advancedTerms={account.account_type === ACCOUNT_TYPE.RECURRING_DEPOSIT}
                />
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    Save Changes
                </Button>
            </div>
        </form>
    );
};

export default AccountEditForm;
