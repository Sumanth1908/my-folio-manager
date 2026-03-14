import { useState, useCallback, useMemo } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { updateAccount } from '../../../store/slices/accountsSlice';
import type { Account } from '../../../types';
import { ACCOUNT_TYPE } from '../../../constants';
import { Button } from '../../ui/Button';
import toast from 'react-hot-toast';
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
import SavingsEditFields from '../savings/SavingsEditFields';
import FDEditFields from '../fixed-deposit/FDEditFields';

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
    accrualDay: string;
    startDate: string;
    emiStartDate: string;
}

// Get initial interest rate based on account type
const getInitialInterestRate = (account: Account): string => {
    switch (account.account_type) {
        case ACCOUNT_TYPE.LOAN:
            return account.loan_account?.interest_rate?.toString() ?? '';
        case ACCOUNT_TYPE.SAVINGS:
            return account.savings_account?.interest_rate?.toString() ?? '';
        case ACCOUNT_TYPE.FIXED_DEPOSIT:
            return account.fixed_deposit_account?.interest_rate?.toString() ?? '';
        default:
            return '';
    }
};

// Get initial accrual day based on account type
const getInitialAccrualDay = (account: Account): string => {
    const day = account.loan_account?.interest_accrual_day
        ?? account.savings_account?.interest_accrual_day
        ?? account.fixed_deposit_account?.interest_accrual_day
        ?? 1;
    return day.toString();
};

const createInitialFormData = (account: Account): AccountEditFormData => ({
    name: account.account_name ?? '',
    status: account.status ?? 'Active',
    interestRate: getInitialInterestRate(account),
    emiAmount: account.loan_account?.emi_amount?.toString() ?? '',
    tenure: account.loan_account?.tenure_months?.toString() ?? '',
    accrualDay: getInitialAccrualDay(account),
    startDate: account.loan_account?.start_date
        ? account.loan_account.start_date.substring(0, 10)
        : '',
    emiStartDate: account.loan_account?.emi_start_date
        ? account.loan_account.emi_start_date.substring(0, 10)
        : ''
});

const AccountEditForm = ({ account, onSuccess, onCancel }: AccountEditFormProps) => {
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState<AccountEditFormData>(() => createInitialFormData(account));

    // Memoized update handler
    const updateField = useCallback(<K extends keyof AccountEditFormData>(field: K, value: AccountEditFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const { name, status, interestRate, emiAmount, tenure, accrualDay, startDate, emiStartDate } = formData;

        const data: Record<string, unknown> = {
            account_name: name,
            status
        };

        if (account.account_type === ACCOUNT_TYPE.LOAN) {
            data.loan_account = {
                interest_rate: parseFloat(interestRate),
                emi_amount: parseFloat(emiAmount),
                tenure_months: parseInt(tenure, 10),
                interest_accrual_day: parseInt(accrualDay, 10),
                start_date: startDate || undefined,
                emi_start_date: emiStartDate || undefined
            };
        } else if (account.account_type === ACCOUNT_TYPE.SAVINGS) {
            data.savings_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay, 10)
            };
        } else if (account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT) {
            data.fixed_deposit_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay, 10)
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
    }, [formData, account, dispatch, onSuccess]);

    // Render type-specific fields
    const typeSpecificFields = useMemo(() => {
        switch (account.account_type) {
            case ACCOUNT_TYPE.SAVINGS:
                return (
                    <SavingsEditFields
                        interestRate={formData.interestRate}
                        setInterestRate={v => updateField('interestRate', v)}
                    />
                );
            case ACCOUNT_TYPE.FIXED_DEPOSIT:
                return (
                    <FDEditFields
                        interestRate={formData.interestRate}
                        setInterestRate={v => updateField('interestRate', v)}
                    />
                );
            case ACCOUNT_TYPE.LOAN:
                return (
                    <LoanEditFields
                        interestRate={formData.interestRate}
                        setInterestRate={v => updateField('interestRate', v)}
                        accrualDay={formData.accrualDay}
                        setAccrualDay={v => updateField('accrualDay', v)}
                        emiAmount={formData.emiAmount}
                        setEmiAmount={v => updateField('emiAmount', v)}
                        tenure={formData.tenure}
                        setTenure={v => updateField('tenure', v)}
                        startDate={formData.startDate}
                        setStartDate={v => updateField('startDate', v)}
                        emiStartDate={formData.emiStartDate}
                        setEmiStartDate={v => updateField('emiStartDate', v)}
                    />
                );
            default:
                return null;
        }
    }, [account.account_type, formData, updateField]);

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
