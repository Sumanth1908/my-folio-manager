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
    toAmount: string; // New field for received amount in target currency
    selectedCategoryId: string;
    date: string;
    additionalInfo: string;
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
        toAmount: '',
        selectedCategoryId: '',
        date: todayString(),
        additionalInfo: ''
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

    const sourceAccount = accounts.find(a => a.account_id === formData.selectedAccountId);
    const targetAccount = accounts.find(a => a.account_id === formData.toAccountId);
    const isMultiCurrencyTransfer = isTransfer && sourceAccount && targetAccount && sourceAccount.currency !== targetAccount.currency;

    const isValid = useMemo(() => {
        if (!formData.amount || !formData.selectedAccountId) return false;
        if (isTransfer && !formData.toAccountId) return false;
        if (isMultiCurrencyTransfer && !formData.toAmount) return false;
        return true;
    }, [formData.amount, formData.selectedAccountId, formData.toAccountId, isTransfer, isMultiCurrencyTransfer, formData.toAmount]);

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
                    to_amount: isMultiCurrencyTransfer ? parseFloat(formData.toAmount) : undefined,
                    description,
                    additional_info: formData.additionalInfo,
                    category_id: categoryId,
                    transaction_date: txDate
                })).unwrap();
            } else {
                await dispatch(createTransaction({
                    account_id: selectedAccountId,
                    amount: parseFloat(amount),
                    transaction_type: type,
                    description,
                    additional_info: formData.additionalInfo,
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
            {/* Transaction Type & Date */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Type
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

            {/* Account Selection */}
            {isTransfer ? (
                <div className="grid grid-cols-2 gap-4">
                    {renderAccountSelect('From Account', formData.selectedAccountId, 'selectedAccountId', isAccountLocked)}
                    {renderAccountSelect('To Account', formData.toAccountId, 'toAccountId')}
                </div>
            ) : (
                renderAccountSelect('Account', formData.selectedAccountId, 'selectedAccountId', isAccountLocked)
            )}

            {/* Amount(s) & Category */}
            <div className="space-y-4">
                {isMultiCurrencyTransfer ? (
                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-4 animate-in fade-in slide-in-from-top-2 duration-500">
                        <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 pl-1">
                                    Sent Amount ({sourceAccount?.currency})
                                </label>
                                <div className="relative">
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
                            </div>

                            <div className="flex items-center mt-6 text-primary/40">
                                <div className="w-8 h-[2px] bg-primary/20 rounded-full" />
                            </div>

                            <div className="flex-1">
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-primary mb-1.5 pl-1">
                                    Received Amount ({targetAccount?.currency})
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={formData.toAmount}
                                        onChange={e => updateField('toAmount', e.target.value)}
                                        className="w-full p-3 bg-background border-primary/30 border-2 rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold tabular-nums shadow-sm shadow-primary/10"
                                    />
                                </div>
                            </div>
                        </div>

                        {formData.amount && formData.toAmount && (
                            <div className="text-center">
                                <span className="text-[10px] font-bold text-muted-foreground/60 bg-background/50 px-2 py-1 rounded-md">
                                    Exchange Rate: 1 {sourceAccount?.currency} = {(parseFloat(formData.toAmount) / parseFloat(formData.amount)).toFixed(4)} {targetAccount?.currency}
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                Amount {sourceAccount ? `(${sourceAccount.currency})` : ''}
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
                            <Select value={formData.selectedCategoryId || 'none'} onValueChange={v => updateField('selectedCategoryId', v === 'none' ? '' : v)}>
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
                )}
            </div>

            {!isMultiCurrencyTransfer && (
                <div className="h-px" /> // Spacer to maintain consistent vertical flow
            )}

            {isMultiCurrencyTransfer && (
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
            )}

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

            {/* Additional Info */}
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                    Additional Info
                </label>
                <input
                    type="text"
                    placeholder="Reference, Bank note, etc."
                    value={formData.additionalInfo}
                    onChange={e => updateField('additionalInfo', e.target.value)}
                    className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none text-foreground placeholder:text-muted-foreground/30 italic"
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
