import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { type Rule, RuleType, Frequency } from '../types';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { createRule, updateRule } from '../store/slices/rulesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from './ui/Select';

interface RuleFormProps {
    accountId: string;
    ruleToEdit?: Rule | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RuleForm({ accountId, ruleToEdit, onSuccess, onCancel }: RuleFormProps) {
    const dispatch = useAppDispatch();

    const { items: categories } = useAppSelector((state: RootState) => state.categories);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    // Common State
    const [name, setName] = useState('');
    const [ruleType, setRuleType] = useState<RuleType>(RuleType.TRANSACTION);
    const [isActive, setIsActive] = useState(true);

    // Categorization State
    const [descriptionContains, setDescriptionContains] = useState('');
    const [categoryId, setCategoryId] = useState<number | ''>('');

    // Automation State
    const [frequency, setFrequency] = useState<Frequency>(Frequency.MONTHLY);
    const [amount, setAmount] = useState('');
    const [txType, setTxType] = useState<'Debit' | 'Credit' | 'Transfer'>('Debit');
    const [nextRunAt, setNextRunAt] = useState<string>(new Date().toISOString().split('T')[0]);
    const [targetAccountId, setTargetAccountId] = useState('');

    // Initialize form when ruleToEdit changes
    useEffect(() => {
        if (ruleToEdit) {
            setName(ruleToEdit.name);
            setRuleType(ruleToEdit.rule_type);
            setIsActive(ruleToEdit.is_active);

            if (ruleToEdit.rule_type === RuleType.CATEGORIZATION) {
                setDescriptionContains(ruleToEdit.description_contains || '');
                setCategoryId(ruleToEdit.category_id || '');
            } else {
                setFrequency(ruleToEdit.frequency as Frequency || Frequency.MONTHLY);
                setAmount(ruleToEdit.transaction_amount?.toString() || '');
                setTxType(ruleToEdit.transaction_type as any || 'Debit');
                if (ruleToEdit.next_run_at) {
                    setNextRunAt(new Date(ruleToEdit.next_run_at).toISOString().split('T')[0]);
                }
                setCategoryId(ruleToEdit.category_id || '');
                setTargetAccountId(ruleToEdit.target_account_id || '');
            }
        }
    }, [ruleToEdit]);

    useEffect(() => {
        if (categories.length === 0) dispatch(fetchCategories());
        if (accounts.length === 0) dispatch(fetchAccounts());
    }, [dispatch, categories.length, accounts.length]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            account_id: accountId,
            name,
            rule_type: ruleType,
            is_active: isActive
        };

        if (ruleType === RuleType.CATEGORIZATION) {
            if (!descriptionContains || !categoryId) return;
            data.description_contains = descriptionContains;
            data.category_id = Number(categoryId);
        } else {
            if (!amount || !nextRunAt) return;
            data.frequency = frequency;
            data.transaction_amount = parseFloat(amount);
            data.transaction_type = txType;
            data.next_run_at = new Date(nextRunAt).toISOString();
            if (categoryId) data.category_id = Number(categoryId);
            if (txType === 'Transfer') data.target_account_id = targetAccountId;
        }

        try {
            if (ruleToEdit) {
                await dispatch(updateRule({ id: ruleToEdit.rule_id, data, accountId })).unwrap();
                toast.success('Rule updated successfully!');
            } else {
                await dispatch(createRule({ ...data, account_id: accountId })).unwrap();
                toast.success('Rule created successfully!');
            }
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save rule');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Rule Type Selector */}
            <div className="flex bg-muted p-1 rounded-2xl mb-6">
                <button
                    type="button"
                    onClick={() => setRuleType(RuleType.CATEGORIZATION)}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                        ruleType === RuleType.CATEGORIZATION
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Categorization
                </button>
                <button
                    type="button"
                    onClick={() => setRuleType(RuleType.TRANSACTION)}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                        ruleType === RuleType.TRANSACTION
                            ? "bg-background text-primary shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    Automation
                </button>
            </div>

            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Rule Identifier</label>
                <input
                    type="text"
                    placeholder="e.g. Monthly Rent"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                    required
                />
            </div>

            {ruleType === RuleType.CATEGORIZATION ? (
                // Categorization Fields
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">If Description Contains</label>
                        <input
                            type="text"
                            placeholder="e.g. NETFLIX"
                            value={descriptionContains}
                            onChange={(e) => setDescriptionContains(e.target.value)}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                            required
                        />
                        <p className="text-[9px] font-bold text-muted-foreground/50 ml-1 uppercase tracking-tighter italic">Matched case-insensitively during ingestion</p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Target Category</label>
                        <Select
                            value={categoryId.toString()}
                            onValueChange={(value) => setCategoryId(value ? Number(value) : '')}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.category_id} value={cat.category_id.toString()}>{cat.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                // Automation Fields
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frequency</label>
                            <Select
                                value={frequency}
                                onValueChange={(value) => setFrequency(value as Frequency)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Frequency" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Frequency</SelectLabel>
                                        {Object.values(Frequency).map(f => (
                                            <SelectItem key={f} value={f}>{f}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direction</label>
                            <Select
                                value={txType}
                                onValueChange={(value: any) => setTxType(value)}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Direction" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Type</SelectLabel>
                                        <SelectItem value="Debit">Debit</SelectItem>
                                        <SelectItem value="Credit">Credit</SelectItem>
                                        <SelectItem value="Transfer">Transfer</SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {txType === 'Transfer' && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destination</label>
                            <Select
                                value={targetAccountId}
                                onValueChange={setTargetAccountId}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select Account" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Accounts</SelectLabel>
                                        {accounts.filter(a => a.account_id !== accountId).map(acc => (
                                            <SelectItem key={acc.account_id} value={acc.account_id}>{acc.account_name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Amount</label>
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Execution Day</label>
                            <input
                                type="date"
                                value={nextRunAt}
                                onChange={(e) => setNextRunAt(e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Category (Optional)</label>
                        <Select
                            value={categoryId.toString()}
                            onValueChange={(value) => setCategoryId(value === 'none' ? '' : Number(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="N/A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    <SelectItem value="none">N/A</SelectItem>
                                    {categories.map(cat => (
                                        <SelectItem key={cat.category_id} value={cat.category_id.toString()}>{cat.name}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3 p-2 ml-1">
                <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-5 h-5 text-primary rounded-lg border-border focus:ring-primary bg-background transition-all"
                />
                <label htmlFor="isActive" className="text-xs font-black uppercase tracking-widest text-foreground/70 cursor-pointer">Propagate automation</label>
            </div>

            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                >
                    Dismiss
                </Button>
                <Button
                    type="submit"
                >
                    Save Configuration
                </Button>
            </div>
        </form>
    );
}
