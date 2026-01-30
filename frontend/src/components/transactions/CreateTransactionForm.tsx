import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { Button } from '../ui/Button';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { type RootState } from '../../store';
import { createTransaction, createTransfer } from '../../store/slices/transactionsSlice';
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

interface CreateTransactionFormProps {
    accountId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

type TransactionTypeValue = typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT | typeof TRANSACTION_TYPE.TRANSFER;

interface CreateFormData {
    type: TransactionTypeValue;
    amount: string;
    description: string;
    selectedAccountId: string;
    toAccountId: string;
    selectedCategoryId: string;
    date: string;
}

const todayString = () => new Date().toISOString().split('T')[0];

const CreateTransactionForm = ({ accountId, onSuccess, onCancel }: CreateTransactionFormProps) => {
    const dispatch = useAppDispatch();
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    const [formData, setFormData] = useState<CreateFormData>(() => ({
        type: TRANSACTION_TYPE.DEBIT,
        amount: '',
        description: '',
        selectedAccountId: accountId ?? '',
        toAccountId: '',
        selectedCategoryId: '',
        date: todayString()
    }));

    // Memoized update handler
    const updateField = useCallback(<K extends keyof CreateFormData>(field: K, value: CreateFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Fetch data if needed
    useEffect(() => {
        if (!accounts.length) dispatch(fetchAccounts());
        if (!categories.length) dispatch(fetchCategories());
    }, [dispatch, accounts.length, categories.length]);

    // Sync accountId prop changes
    useEffect(() => {
        if (accountId) {
            updateField('selectedAccountId', accountId);
        } else if (accounts.length && !formData.selectedAccountId) {
            updateField('selectedAccountId', accounts[0].account_id.toString());
        }
    }, [accountId, accounts, formData.selectedAccountId, updateField]);

    // Derived state
    const isTransfer = formData.type === TRANSACTION_TYPE.TRANSFER;
    const isAccountLocked = !!accountId;

    const isValid = useMemo(() => {
        if (!formData.amount || !formData.selectedAccountId) return false;
        if (isTransfer && !formData.toAccountId) return false;
        return true;
    }, [formData.amount, formData.selectedAccountId, formData.toAccountId, isTransfer]);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const { type, amount, description, selectedAccountId, toAccountId, selectedCategoryId, date } = formData;
        const today = todayString();
        const txDate = date !== today ? new Date(date).toISOString() : undefined;
        const categoryId = selectedCategoryId && selectedCategoryId !== 'none'
            ? parseInt(selectedCategoryId, 10)
            : null;

        try {
            if (type === TRANSACTION_TYPE.TRANSFER) {
                await dispatch(createTransfer({
                    from_account_id: selectedAccountId,
                    to_account_id: toAccountId,
                    amount: parseFloat(amount),
                    description,
                    category_id: categoryId,
                    transaction_date: txDate
                })).unwrap();
            } else {
                await dispatch(createTransaction({
                    account_id: selectedAccountId,
                    amount: parseFloat(amount),
                    transaction_type: type,
                    description,
                    category_id: categoryId,
                    transaction_date: txDate
                })).unwrap();
            }

            toast.success('Transaction created!');
            dispatch(fetchAccounts());
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to create transaction');
        }
    }, [formData, dispatch, onSuccess]);

    // Render account select
    const renderAccountSelect = (
        label: string,
        value: string,
        field: 'selectedAccountId' | 'toAccountId',
        disabled = false
    ) => (
        <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {label}
            </label>
            <Select value={value} onValueChange={v => updateField(field, v)} disabled={disabled}>
                <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Accounts</SelectLabel>
                        {accounts.map(({ account_id, account_name, account_type }) => (
                            <SelectItem key={account_id} value={account_id.toString()}>
                                {account_name} ({account_type})
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {/* Transaction Type */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Transaction Type
                </label>
                <Select value={formData.type} onValueChange={v => updateField('type', v as TransactionTypeValue)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectLabel>Type</SelectLabel>
                            <SelectItem value={TRANSACTION_TYPE.DEBIT}>DEBIT</SelectItem>
                            <SelectItem value={TRANSACTION_TYPE.CREDIT}>CREDIT</SelectItem>
                            <SelectItem value={TRANSACTION_TYPE.TRANSFER}>TRANSFER</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>

            {/* Account Selection */}
            {isTransfer ? (
                <div className="grid grid-cols-2 gap-4">
                    {renderAccountSelect('From Account', formData.selectedAccountId, 'selectedAccountId', isAccountLocked)}
                    {renderAccountSelect('To Account', formData.toAccountId, 'toAccountId')}
                </div>
            ) : (
                renderAccountSelect('Account', formData.selectedAccountId, 'selectedAccountId', isAccountLocked)
            )}

            <div className="grid grid-cols-2 gap-4">
                {/* Date */}
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

                {/* Amount */}
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Amount
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={e => updateField('amount', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground tabular-nums placeholder:text-muted-foreground/30"
                        autoFocus
                    />
                </div>
            </div>

            {/* Category */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Category
                </label>
                <Select value={formData.selectedCategoryId || 'none'} onValueChange={v => updateField('selectedCategoryId', v === 'none' ? '' : v)}>
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Category (Optional)" />
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
                    Create Transaction
                </Button>
            </div>
        </form>
    );
};

export default CreateTransactionForm;
