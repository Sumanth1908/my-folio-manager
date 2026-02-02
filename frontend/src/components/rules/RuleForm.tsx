import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { type Rule, type RuleType, type Frequency } from '../../types';
import { RULE_TYPE, FREQUENCY, TRANSACTION_TYPE } from '../../constants';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { cn } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { type RootState } from '../../store';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import { createRule, updateRule } from '../../store/slices/rulesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/Select';

interface RuleFormProps {
    accountId: string;
    ruleToEdit?: Rule | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface RuleFormData {
    name: string;
    ruleType: RuleType;
    isActive: boolean;
    descriptionContains: string;
    categoryId: string;
    frequency: Frequency;
    amount: string;
    txType: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT | typeof TRANSACTION_TYPE.TRANSFER;
    nextRunAt: string;
    targetAccountId: string;
}

// Normalize transaction type
const normalizeTransactionType = (rawType?: string) => {
    const normalized = rawType?.toString().trim().toUpperCase();
    if (normalized === 'CREDIT') return TRANSACTION_TYPE.CREDIT;
    if (normalized === 'TRANSFER') return TRANSACTION_TYPE.TRANSFER;
    return TRANSACTION_TYPE.DEBIT;
};

// Create initial form data from rule
const createInitialFormData = (rule?: Rule | null): RuleFormData => ({
    name: rule?.name ?? '',
    ruleType: rule?.rule_type ?? RULE_TYPE.TRANSACTION,
    isActive: rule?.is_active ?? true,
    descriptionContains: rule?.description_contains ?? '',
    categoryId: rule?.category_id?.toString() ?? '',
    frequency: (rule?.frequency as Frequency) ?? FREQUENCY.MONTHLY,
    amount: rule?.transaction_amount?.toString() ?? '',
    txType: normalizeTransactionType(rule?.transaction_type),
    nextRunAt: rule?.next_run_at
        ? new Date(rule.next_run_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
    targetAccountId: rule?.target_account_id ?? ''
});

const RuleForm = ({ accountId, ruleToEdit, onSuccess, onCancel }: RuleFormProps) => {
    const dispatch = useAppDispatch();
    const { items: categories } = useAppSelector((state: RootState) => state.categories);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    const [formData, setFormData] = useState<RuleFormData>(() => createInitialFormData(ruleToEdit));

    // Memoized update handler
    const updateField = useCallback(<K extends keyof RuleFormData>(field: K, value: RuleFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Filter accounts excluding current
    const availableTargetAccounts = useMemo(
        () => accounts.filter(a => a.account_id !== accountId),
        [accounts, accountId]
    );

    // Fetch data on mount if needed
    useEffect(() => {
        if (!categories.length) dispatch(fetchCategories());
        if (!accounts.length) dispatch(fetchAccounts());
    }, [dispatch, categories.length, accounts.length]);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        const { name, ruleType, isActive, descriptionContains, categoryId, frequency, amount, txType, nextRunAt, targetAccountId } = formData;

        const payload: Record<string, unknown> = {
            account_id: accountId,
            name,
            rule_type: ruleType,
            is_active: isActive
        };

        if (ruleType === RULE_TYPE.CATEGORIZATION) {
            if (!descriptionContains || !categoryId) return;
            payload.description_contains = descriptionContains;
            payload.category_id = Number(categoryId);
        } else {
            if (!amount || !nextRunAt) return;
            payload.frequency = frequency;
            payload.transaction_amount = parseFloat(amount);
            payload.transaction_type = txType;
            payload.next_run_at = new Date(nextRunAt).toISOString();
            if (categoryId) payload.category_id = Number(categoryId);
            if (txType === TRANSACTION_TYPE.TRANSFER) payload.target_account_id = targetAccountId;
        }

        try {
            if (ruleToEdit) {
                await dispatch(updateRule({ id: ruleToEdit.rule_id, data: payload, accountId })).unwrap();
                toast.success('Rule updated!');
            } else {
                await dispatch(createRule(payload)).unwrap();
                toast.success('Rule created!');
            }
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to save rule');
        }
    }, [formData, accountId, ruleToEdit, dispatch, onSuccess]);

    const isCategorization = formData.ruleType === RULE_TYPE.CATEGORIZATION;
    const isTransfer = formData.txType === TRANSACTION_TYPE.TRANSFER;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rule Type Toggle */}
            <div className="flex bg-muted p-1 rounded-2xl mb-6">
                {[
                    { type: RULE_TYPE.CATEGORIZATION, label: 'Categorization' },
                    { type: RULE_TYPE.TRANSACTION, label: 'Automation' }
                ].map(({ type, label }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => updateField('ruleType', type)}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                            formData.ruleType === type
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Rule Name */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Rule Identifier
                </label>
                <input
                    type="text"
                    placeholder="e.g. Monthly Rent"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                    required
                />
            </div>

            {isCategorization ? (
                /* Categorization Fields */
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            If Description Contains
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. NETFLIX"
                            value={formData.descriptionContains}
                            onChange={e => updateField('descriptionContains', e.target.value)}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                            required
                        />
                        <p className="text-[9px] font-bold text-muted-foreground/50 ml-1 uppercase tracking-tighter italic">
                            Matched case-insensitively during ingestion
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Target Category
                        </label>
                        <Select value={formData.categoryId} onValueChange={v => updateField('categoryId', v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    {categories.map(({ category_id, name }) => (
                                        <SelectItem key={category_id} value={category_id.toString()}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                /* Automation Fields */
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Frequency
                            </label>
                            <Select value={formData.frequency} onValueChange={v => updateField('frequency', v as Frequency)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Frequency</SelectLabel>
                                        {Object.values(FREQUENCY).map(f => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Direction
                            </label>
                            <Select value={formData.txType} onValueChange={v => updateField('txType', v as typeof formData.txType)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Direction" />
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
                    </div>

                    {isTransfer && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Destination
                            </label>
                            <Select value={formData.targetAccountId} onValueChange={v => updateField('targetAccountId', v)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Accounts</SelectLabel>
                                        {availableTargetAccounts.map(({ account_id, account_name }) => (
                                            <SelectItem key={account_id} value={account_id}>{account_name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Amount
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => updateField('amount', e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                Execution Day
                            </label>
                            <input
                                type="date"
                                value={formData.nextRunAt}
                                onChange={e => updateField('nextRunAt', e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Category (Optional)
                        </label>
                        <Select
                            value={formData.categoryId || 'none'}
                            onValueChange={v => updateField('categoryId', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="N/A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    <SelectItem value="none">N/A</SelectItem>
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

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-2 ml-1">
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked => updateField('isActive', checked)}
                />
                <label
                    htmlFor="isActive"
                    className="text-xs font-black uppercase tracking-widest text-foreground/70 cursor-pointer select-none"
                >
                    Enable Rule
                </label>
            </div>

            {/* Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Dismiss
                </Button>
                <Button type="submit">
                    Save Configuration
                </Button>
            </div>
        </form>
    );
};

export default RuleForm;
