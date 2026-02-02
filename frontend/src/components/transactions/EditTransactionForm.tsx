import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import type { Transaction } from '../../types';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { type RootState } from '../../store';
import { updateTransaction } from '../../store/slices/transactionsSlice';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/Select';
import { TRANSACTION_TYPE } from '../../constants';

interface EditTransactionFormProps {
    transaction: Transaction;
    onSuccess: () => void;
    onCancel: () => void;
}

interface EditFormData {
    type: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT;
    amount: string;
    description: string;
    selectedAccountId: string;
    selectedCategoryId: string;
    date: string;
}

// Normalize transaction type
const normalizeTransactionType = (rawType?: string): typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT => {
    const normalized = rawType?.toString().trim().toUpperCase();
    return normalized === 'CREDIT' ? TRANSACTION_TYPE.CREDIT : TRANSACTION_TYPE.DEBIT;
};

// Initialize form data from transaction
const createInitialFormData = (transaction: Transaction): EditFormData => ({
    type: normalizeTransactionType(transaction.transaction_type),
    amount: transaction.amount.toString(),
    description: transaction.description ?? '',
    selectedAccountId: transaction.account_id.toString(),
    selectedCategoryId: transaction.category_id?.toString() ?? 'none',
    date: transaction.transaction_date
        ? new Date(transaction.transaction_date).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0]
});

const EditTransactionForm = ({ transaction, onSuccess, onCancel }: EditTransactionFormProps) => {
    const dispatch = useAppDispatch();
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    const [formData, setFormData] = useState<EditFormData>(() => createInitialFormData(transaction));

    // Memoized update handler
    const updateField = useCallback(<K extends keyof EditFormData>(field: K, value: EditFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Memoized account name lookup
    const accountName = useMemo(
        () => accounts.find(a => a.account_id.toString() === formData.selectedAccountId)?.account_name ?? 'Loading...',
        [accounts, formData.selectedAccountId]
    );

    // Fetch data if needed
    useEffect(() => {
        if (!accounts.length) dispatch(fetchAccounts());
        if (!categories.length) dispatch(fetchCategories());
    }, [dispatch, accounts.length, categories.length]);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const { type, amount, description, selectedCategoryId, date } = formData;

        const originalDate = transaction.transaction_date
            ? new Date(transaction.transaction_date).toISOString().split('T')[0]
            : null;
        const hasDateChanged = originalDate !== date;

        try {
            await dispatch(updateTransaction({
                id: transaction.transaction_id,
                data: {
                    amount: parseFloat(amount),
                    transaction_type: type,
                    description,
                    category_id: selectedCategoryId && selectedCategoryId !== 'none'
                        ? parseInt(selectedCategoryId, 10)
                        : null,
                    transaction_date: hasDateChanged && date ? new Date(date).toISOString() : undefined
                }
            })).unwrap();

            toast.success('Transaction updated!');
            dispatch(fetchAccounts());
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to update transaction');
        }
    }, [formData, transaction, dispatch, onSuccess]);

    const isValid = !!formData.amount;

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Transaction Type & Date */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Type
                    </label>
                    <Select value={formData.type} onValueChange={v => updateField('type', v as EditFormData['type'])}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Type</SelectLabel>
                                <SelectItem value={TRANSACTION_TYPE.DEBIT}>DEBIT</SelectItem>
                                <SelectItem value={TRANSACTION_TYPE.CREDIT}>CREDIT</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Date
                    </label>
                    <input
                        type="date"
                        value={formData.date}
                        onChange={e => updateField('date', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/30"
                    />
                </div>
            </div>

            {/* Account - Read Only */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Account
                </label>
                <div className="w-full p-3 bg-muted/30 border border-border rounded-xl text-foreground opacity-70">
                    {accountName}
                </div>
            </div>

            {/* Amount & Category */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Amount ({transaction.currency})
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => updateField('amount', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold tabular-nums"
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Category
                    </label>
                    <Select value={formData.selectedCategoryId} onValueChange={v => updateField('selectedCategoryId', v)}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Categories</SelectLabel>
                                <SelectItem value="none">None</SelectItem>
                                {categories.map(({ category_id, name }) => (
                                    <SelectItem key={category_id} value={category_id.toString()}>
                                        {name.toUpperCase()}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            </div>


            {/* Description */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Description
                </label>
                <input
                    type="text"
                    placeholder="Rent, Groceries, etc."
                    value={formData.description}
                    onChange={e => updateField('description', e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/30"
                />
            </div>

            {/* Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={!isValid}>
                    Update Transaction
                </Button>
            </div>
        </form>
    );
};

export default EditTransactionForm;
