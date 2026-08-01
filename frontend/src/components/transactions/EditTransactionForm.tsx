import { useState } from 'react';
import { toast } from 'sonner';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { useAppDispatch } from '../../store/hooks';
import { updateTransaction } from '../../store/slices/transactionsSlice';

interface EditTransactionFormProps {
    transaction: Transaction;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function EditTransactionForm({ transaction, onSuccess, onCancel }: EditTransactionFormProps) {
    const dispatch = useAppDispatch();
    const isTransferLeg = Boolean(transaction.transfer_id);

    const [amount, setAmount] = useState(String(transaction.amount));
    const [description, setDescription] = useState(transaction.description || '');
    const [date, setDate] = useState(transaction.transaction_date?.slice(0, 10) || '');
    const [isSaving, setIsSaving] = useState(false);

    const amountChanged = Number(amount) !== Number(transaction.amount);
    const dateChanged = date !== transaction.transaction_date?.slice(0, 10);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const parsedAmount = Number(amount);
        if (!isTransferLeg && (isNaN(parsedAmount) || parsedAmount === 0)) {
            toast.error('Amount must be a non-zero number');
            return;
        }

        const data: { amount?: number; description?: string; transaction_date?: string } = {};
        if (!isTransferLeg && amountChanged) data.amount = parsedAmount;
        if (description !== (transaction.description || '')) data.description = description;
        if (!isTransferLeg && dateChanged && date) data.transaction_date = new Date(date + 'T00:00:00').toISOString();

        if (Object.keys(data).length === 0) {
            onCancel();
            return;
        }

        setIsSaving(true);
        try {
            await dispatch(updateTransaction({ id: transaction.transaction_id, data })).unwrap();
            toast.success('Transaction updated');
            onSuccess();
        } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Failed to update transaction');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {(amountChanged || dateChanged) && !isTransferLeg && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-600 dark:text-amber-400 font-medium">
                    Changing the amount or date recalculates this account's balance history.
                </div>
            )}
            {isTransferLeg && (
                <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground">
                    This is one leg of a transfer — only the description can be edited.
                    To change the amount or date, delete the transfer and recreate it.
                </div>
            )}

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Amount (negative = debit)
                </label>
                <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={isTransferLeg}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground disabled:opacity-50"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Description
                </label>
                <input
                    type="text"
                    maxLength={255}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground"
                />
            </div>

            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Date
                </label>
                <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    disabled={isTransferLeg}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground disabled:opacity-50"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isSaving}>Save Changes</Button>
            </div>
        </form>
    );
}
