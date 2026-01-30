import React, { useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { updateAccount } from '../../store/slices/accountsSlice';
import type { Account } from '../../types';
import { ACCOUNT_TYPE } from '../../constants';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/Select';

interface AccountEditFormProps {
    account: Account;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AccountEditForm({ account, onSuccess, onCancel }: AccountEditFormProps) {
    const dispatch = useAppDispatch();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [name, setName] = useState(account.account_name || '');
    const [status, setStatus] = useState(account.status || 'Active');

    // Specific details
    const [interestRate, setInterestRate] = useState(
        account.account_type === ACCOUNT_TYPE.LOAN ? account.loan_account?.interest_rate?.toString() || '' :
            account.account_type === ACCOUNT_TYPE.SAVINGS ? account.savings_account?.interest_rate?.toString() || '' :
                account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT ? account.fixed_deposit_account?.interest_rate?.toString() || '' : ''
    );

    const [emiAmount, setEmiAmount] = useState(account.loan_account?.emi_amount?.toString() || '');
    const [tenure, setTenure] = useState(account.loan_account?.tenure_months?.toString() || '');
    const [accrualDay, setAccrualDay] = useState(
        (account.loan_account?.interest_accrual_day ||
            account.savings_account?.interest_accrual_day ||
            account.fixed_deposit_account?.interest_accrual_day || 1).toString()
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            account_name: name,
            status: status
        };

        if (account.account_type === ACCOUNT_TYPE.LOAN) {
            data.loan_account = {
                interest_rate: parseFloat(interestRate),
                emi_amount: parseFloat(emiAmount),
                tenure_months: parseInt(tenure),
                interest_accrual_day: parseInt(accrualDay)
            };
        } else if (account.account_type === ACCOUNT_TYPE.SAVINGS) {
            data.savings_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay)
            };
        } else if (account.account_type === ACCOUNT_TYPE.FIXED_DEPOSIT) {
            data.fixed_deposit_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay)
            };
        }

        setIsSubmitting(true);
        try {
            await dispatch(updateAccount({ id: account.account_id, data })).unwrap();
            toast.success('Account updated successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to update account');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Account Name</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                    required
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Status</label>
                <Select
                    value={status}
                    onValueChange={(value) => setStatus(value)}
                >
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

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Accrual Day</label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={accrualDay}
                        onChange={(e) => setAccrualDay(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
            </div>

            {account.account_type === ACCOUNT_TYPE.LOAN && (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">EMI Amount</label>
                        <input
                            type="number"
                            step="0.01"
                            value={emiAmount}
                            onChange={(e) => setEmiAmount(e.target.value)}
                            className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Tenure (Months)</label>
                        <input
                            type="number"
                            value={tenure}
                            onChange={(e) => setTenure(e.target.value)}
                            className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                            required
                        />
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSubmitting}>Save Changes</Button>
            </div>
        </form>
    );
}
