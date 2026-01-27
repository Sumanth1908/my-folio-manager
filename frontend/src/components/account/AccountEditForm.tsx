import React, { useState } from 'react';
import { useUpdateAccount } from '../../hooks/useAccounts';
import type { Account } from '../../types';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface AccountEditFormProps {
    account: Account;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AccountEditForm({ account, onSuccess, onCancel }: AccountEditFormProps) {
    const updateAccount = useUpdateAccount();
    const [name, setName] = useState(account.account_name || '');
    const [status, setStatus] = useState(account.status || 'Active');

    // Specific details
    const [interestRate, setInterestRate] = useState(
        account.account_type === 'Loan' ? account.loan_account?.interest_rate?.toString() || '' :
            account.account_type === 'Savings' ? account.savings_account?.interest_rate?.toString() || '' :
                account.account_type === 'Fixed Deposit' ? account.fixed_deposit_account?.interest_rate?.toString() || '' : ''
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

        if (account.account_type === 'Loan') {
            data.loan_account = {
                interest_rate: parseFloat(interestRate),
                emi_amount: parseFloat(emiAmount),
                tenure_months: parseInt(tenure),
                interest_accrual_day: parseInt(accrualDay)
            };
        } else if (account.account_type === 'Savings') {
            data.savings_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay)
            };
        } else if (account.account_type === 'Fixed Deposit') {
            data.fixed_deposit_account = {
                interest_rate: parseFloat(interestRate),
                interest_accrual_day: parseInt(accrualDay)
            };
        }

        try {
            await updateAccount.mutateAsync({ id: account.account_id, data });
            toast.success('Account updated successfully');
            onSuccess();
        } catch (error) {
            toast.error('Failed to update account');
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
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    <option value="Active">Active</option>
                    <option value="Closed">Closed</option>
                </select>
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

            {account.account_type === 'Loan' && (
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
                <Button type="submit" isLoading={updateAccount.isPending}>Save Changes</Button>
            </div>
        </form>
    );
}
