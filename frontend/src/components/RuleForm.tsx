import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../api';
import { type Category, type CreateRuleDTO, type Rule, RuleType, Frequency, type Account } from '../types';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface RuleFormProps {
    accountId: string;
    ruleToEdit?: Rule | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function RuleForm({ accountId, ruleToEdit, onSuccess, onCancel }: RuleFormProps) {
    const queryClient = useQueryClient();

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
        } else {
            // Reset logic if needed or handled by key/unmount
        }
    }, [ruleToEdit]);

    // Fetch Categories
    const { data: categories } = useQuery<Category[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories/');
            return res.data;
        }
    });

    // Fetch Accounts (for Transfer)
    const { data: accounts } = useQuery<Account[]>({
        queryKey: ['accounts'],
        queryFn: async () => {
            const res = await api.get('/accounts/');
            return res.data;
        },
        enabled: ruleType === RuleType.TRANSACTION && txType === 'Transfer'
    });

    const createRuleMutation = useMutation({
        mutationFn: async (data: CreateRuleDTO) => {
            await api.post('/rules/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', accountId] });
            onSuccess();
        }
    });

    const updateRuleMutation = useMutation({
        mutationFn: async (data: any) => {
            await api.put(`/rules/${ruleToEdit!.rule_id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', accountId] });
            onSuccess();
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload: any = {
            account_id: accountId,
            name,
            rule_type: ruleType,
            is_active: isActive
        };

        if (ruleType === RuleType.CATEGORIZATION) {
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
            if (txType === 'Transfer') payload.target_account_id = targetAccountId;
        }

        const promise = ruleToEdit
            ? updateRuleMutation.mutateAsync(payload)
            : createRuleMutation.mutateAsync(payload);

        await toast.promise(promise, {
            loading: ruleToEdit ? 'Updating rule...' : 'Creating rule...',
            success: () => ruleToEdit ? 'Rule updated successfully!' : 'Rule created successfully!',
            error: (err) => handleApiError(err, ruleToEdit ? 'Failed to update rule' : 'Failed to create rule')
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">

            {/* Rule Type Selector */}
            <div className="flex bg-muted p-1 rounded-2xl mb-6">
                <button
                    type="button"
                    onClick={() => setRuleType(RuleType.CATEGORIZATION)}
                    className={cn(
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
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
                        "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all",
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
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold appearance-none cursor-pointer"
                            required
                        >
                            <option value="">Select Category</option>
                            {categories?.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            ) : (
                // Automation Fields
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Frequency</label>
                            <select
                                value={frequency}
                                onChange={(e) => setFrequency(e.target.value as Frequency)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold appearance-none cursor-pointer"
                            >
                                {Object.values(Frequency).map(f => (
                                    <option key={f} value={f}>{f}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direction</label>
                            <select
                                value={txType}
                                onChange={(e) => setTxType(e.target.value as any)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold appearance-none cursor-pointer"
                            >
                                <option value="Debit">Debit</option>
                                <option value="Credit">Credit</option>
                                <option value="Transfer">Transfer</option>
                            </select>
                        </div>
                    </div>

                    {txType === 'Transfer' && (
                        <div className="space-y-2">
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Destination</label>
                            <select
                                value={targetAccountId}
                                onChange={(e) => setTargetAccountId(e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Select Account</option>
                                {accounts?.filter(a => a.account_id !== accountId).map(acc => (
                                    <option key={acc.account_id} value={acc.account_id}>{acc.account_name}</option>
                                ))}
                            </select>
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
                        <select
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold appearance-none cursor-pointer"
                        >
                            <option value="">N/A</option>
                            {categories?.map(cat => (
                                <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                            ))}
                        </select>
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
                    disabled={createRuleMutation.isPending || updateRuleMutation.isPending || !name}
                >
                    {createRuleMutation.isPending || updateRuleMutation.isPending ? 'Syncing...' : 'Save Configuration'}
                </Button>
            </div>
        </form>
    );
}
