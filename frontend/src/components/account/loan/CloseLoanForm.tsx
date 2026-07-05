import { useState, useCallback } from 'react';
import { Button } from '../../ui/Button';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../../ui/Select';
import type { Account } from '../../../types';
import { ACCOUNT_TYPE } from '../../../constants';

interface CloseLoanFormProps {
    account: Account;
    outstanding: number;
    accounts: Account[];
    symbol: string;
    onSubmit: (sourceAccountId?: string) => void | Promise<void>;
    onCancel: () => void;
}

const CASH_VALUE = 'cash';

const CloseLoanForm = ({ account, outstanding, accounts, symbol, onSubmit, onCancel }: CloseLoanFormProps) => {
    const [sourceAccountId, setSourceAccountId] = useState<string>(CASH_VALUE);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only savings accounts in the same currency can settle a loan payoff (matches backend validation)
    const eligibleAccounts = accounts.filter(
        a => a.account_type === ACCOUNT_TYPE.SAVINGS && a.status !== 'Closed' && a.currency === account.currency
    );

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit(sourceAccountId === CASH_VALUE ? undefined : sourceAccountId);
        } finally {
            setIsSubmitting(false);
        }
    }, [sourceAccountId, onSubmit]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
                    Pending Amount
                </p>
                <p className="text-2xl font-black text-destructive tabular-nums">
                    {symbol}{outstanding.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Settle From
                </label>
                <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Other</SelectLabel>
                            <SelectItem value={CASH_VALUE}>Cash / Other (Not Tracked)</SelectItem>
                        </SelectGroup>
                        {eligibleAccounts.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Savings Accounts</SelectLabel>
                                {eligibleAccounts.map(({ account_id, account_name, currency }) => (
                                    <SelectItem key={account_id} value={account_id}>
                                        {account_name || 'Unnamed Account'} ({currency})
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        )}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">
                    {sourceAccountId === CASH_VALUE
                        ? 'The pending amount will be recorded as settled without debiting a tracked account.'
                        : 'The pending amount will be transferred from the selected account to close out this loan.'}
                </p>
                {eligibleAccounts.length === 0 && (
                    <p className="text-xs text-muted-foreground/70 mt-1">
                        No open savings account in {account.currency} found to settle from — you can still close using Cash / Other.
                    </p>
                )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" isLoading={isSubmitting}>
                    Close Loan
                </Button>
            </div>
        </form>
    );
};

export default CloseLoanForm;
