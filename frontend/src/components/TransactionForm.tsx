import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Transaction } from '../types';
import { Button } from './ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { createTransaction, createTransfer, updateTransaction } from '../store/slices/transactionsSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';

interface TransactionFormProps {
    accountId?: string; // If provided, locks the account selection
    transactionToEdit?: Transaction | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function TransactionForm({ accountId, transactionToEdit, onSuccess, onCancel }: TransactionFormProps) {
    const dispatch = useAppDispatch();

    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    // Form State
    const [type, setType] = useState<'Debit' | 'Credit' | 'Transfer'>('Debit');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedAccountId, setSelectedAccountId] = useState<string>(accountId ? accountId.toString() : '');
    const [toAccountId, setToAccountId] = useState<string>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Load initial data if editing
    useEffect(() => {
        if (transactionToEdit) {
            setType(transactionToEdit.transaction_type);
            setAmount(transactionToEdit.amount.toString());
            setDescription(transactionToEdit.description || '');
            setSelectedAccountId(transactionToEdit.account_id.toString());
            setSelectedCategoryId(transactionToEdit.category_id ? transactionToEdit.category_id.toString() : '');
            // Format existing date to YYYY-MM-DD
            if (transactionToEdit.transaction_date) {
                setDate(new Date(transactionToEdit.transaction_date).toISOString().split('T')[0]);
            }
        } else if (accountId) {
            setSelectedAccountId(accountId.toString());
        }
    }, [transactionToEdit, accountId]);

    useEffect(() => {
        if (accounts.length === 0) dispatch(fetchAccounts());
        if (categories.length === 0) dispatch(fetchCategories());
    }, [dispatch, accounts.length, categories.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (transactionToEdit) {
                await dispatch(updateTransaction({
                    id: transactionToEdit.transaction_id,
                    data: {
                        amount: parseFloat(amount),
                        transaction_type: type,
                        description,
                        account_id: selectedAccountId,
                        category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
                        transaction_date: date ? new Date(date).toISOString() : undefined
                    }
                })).unwrap();
                toast.success('Transaction updated successfully');
            } else {
                if (type === 'Transfer') {
                    await dispatch(createTransfer({
                        from_account_id: selectedAccountId,
                        to_account_id: toAccountId,
                        amount: parseFloat(amount),
                        description,
                        category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
                        transaction_date: date ? new Date(date).toISOString() : undefined
                    })).unwrap();
                } else {
                    await dispatch(createTransaction({
                        account_id: selectedAccountId,
                        amount: parseFloat(amount),
                        transaction_type: type,
                        description,
                        category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null,
                        transaction_date: date ? new Date(date).toISOString() : undefined
                    })).unwrap();
                }
                toast.success('Transaction created successfully');
            }

            // Refresh accounts for balance updates
            dispatch(fetchAccounts());
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save transaction');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Transaction Type */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Transaction Type</label>
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    disabled={!!transactionToEdit} // Disable type change on edit for simplicity
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground disabled:opacity-50 transition"
                >
                    <option value="Debit">Debit</option>
                    <option value="Credit">Credit</option>
                    {!transactionToEdit && <option value="Transfer">Transfer</option>}
                </select>
            </div>

            {/* Account Selection Logic */}
            {type === 'Transfer' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">From Account</label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            disabled={!!accountId} // Lock if accountId passed
                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground disabled:opacity-50 transition"
                        >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>{acc.account_name} ({acc.account_type})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">To Account</label>
                        <select
                            value={toAccountId}
                            onChange={(e) => setToAccountId(e.target.value)}
                            className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground transition"
                        >
                            <option value="">Select Account</option>
                            {accounts.map(acc => (
                                <option key={acc.account_id} value={acc.account_id}>{acc.account_name} ({acc.account_type})</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account</label>
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        disabled={!!accountId}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground disabled:opacity-50 transition"
                    >
                        <option value="">Select Account</option>
                        {accounts.map(acc => (
                            <option key={acc.account_id} value={acc.account_id}>{acc.account_name} ({acc.account_type})</option>
                        ))}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground transition"
                    />
                </div>

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Amount</label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground tabular-nums transition placeholder:text-muted-foreground/30"
                        autoFocus
                    />
                </div>
            </div>

            {/* Category - For all types now */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground transition"
                >
                    <option value="">Select Category (Optional)</option>
                    {categories.map(category => (
                        <option key={category.category_id} value={category.category_id}>
                            {category.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                <input
                    type="text"
                    placeholder="Rent, Groceries, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground transition placeholder:text-muted-foreground/30"
                />
            </div>

            {/* Buttons */}
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
                    disabled={!amount || !selectedAccountId || (type === 'Transfer' && !toAccountId)}
                >
                    {transactionToEdit ? 'Update Transaction' : 'Create Transaction'}
                </Button>
            </div>
        </form>
    );
}
