import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import type { Transaction } from '../types';
import { Button } from './ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { createTransaction, createTransfer, updateTransaction } from '../store/slices/transactionsSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from './ui/Select';

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
                        category_id: (selectedCategoryId && selectedCategoryId !== 'none') ? parseInt(selectedCategoryId) : null,
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
                        category_id: (selectedCategoryId && selectedCategoryId !== 'none') ? parseInt(selectedCategoryId) : null,
                        transaction_date: date ? new Date(date).toISOString() : undefined
                    })).unwrap();
                } else {
                    await dispatch(createTransaction({
                        account_id: selectedAccountId,
                        amount: parseFloat(amount),
                        transaction_type: type,
                        description,
                        category_id: (selectedCategoryId && selectedCategoryId !== 'none') ? parseInt(selectedCategoryId) : null,
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
                <Select
                    value={type}
                    onValueChange={(value: any) => setType(value)}
                    disabled={!!transactionToEdit}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
                            <SelectItem value="Debit">Debit</SelectItem>
                            <SelectItem value="Credit">Credit</SelectItem>
                            {!transactionToEdit && <SelectItem value="Transfer">Transfer</SelectItem>}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Account Selection Logic */}
            {type === 'Transfer' ? (
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">From Account</label>
                        <Select
                            value={selectedAccountId}
                            onValueChange={setSelectedAccountId}
                            disabled={!!accountId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Accounts</SelectLabel>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.account_id} value={acc.account_id.toString()}>
                                            {acc.account_name} ({acc.account_type})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">To Account</label>
                        <Select
                            value={toAccountId}
                            onValueChange={setToAccountId}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Account" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Accounts</SelectLabel>
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.account_id} value={acc.account_id.toString()}>
                                            {acc.account_name} ({acc.account_type})
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Account</label>
                    <Select
                        value={selectedAccountId}
                        onValueChange={setSelectedAccountId}
                        disabled={!!accountId}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Accounts</SelectLabel>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.account_id} value={acc.account_id.toString()}>
                                        {acc.account_name} ({acc.account_type})
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
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
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/30"
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
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground tabular-nums placeholder:text-muted-foreground/30"
                        autoFocus
                    />
                </div>
            </div>

            {/* Category - For all types now */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Category</label>
                <Select
                    value={selectedCategoryId}
                    onValueChange={setSelectedCategoryId}
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category (Optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Categories</SelectLabel>
                            <SelectItem value="none">None</SelectItem>
                            {categories.map(category => (
                                <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                    {category.name}
                                </SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Description */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Description</label>
                <input
                    type="text"
                    placeholder="Rent, Groceries, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/30"
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
