import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/Select';
import Modal from '../common/Modal';
import { addMonths, formatMonthLabel, getCurrentYearMonth } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { upsertBudget } from '../../store/slices/budgetsSlice';
import type { RootState } from '../../store';
import type { BudgetItem } from '../../types';

interface BudgetFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** null = add mode; a budget = edit that month's amount */
    editing: BudgetItem | null;
    symbol: string;
}

const REPEAT_OPTIONS = Array.from({ length: 12 }, (_, i) => i);

function FieldLabel({ children }: { children: React.ReactNode }) {
    return (
        <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {children}
        </label>
    );
}

export function BudgetFormContent({ isOpen, onClose, editing, symbol }: BudgetFormModalProps) {
    const dispatch = useAppDispatch();
    const { items: budgets, selectedMonth } = useAppSelector((state: RootState) => state.budgets);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    const [categoryId, setCategoryId] = useState('');
    const [amount, setAmount] = useState('');
    const [formMonth, setFormMonth] = useState(selectedMonth);
    const [repeatMonths, setRepeatMonths] = useState('0');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        setCategoryId(editing ? String(editing.category_id) : '');
        setAmount(editing ? String(editing.amount) : '');
        setFormMonth(editing ? editing.period_month : selectedMonth);
        setRepeatMonths('0');
    }, [isOpen, editing, selectedMonth]);

    const monthOptions = useMemo(() => {
        const options = Array.from({ length: 12 }, (_, i) => addMonths(getCurrentYearMonth(), i));
        // Allow adding to the currently viewed month even when it's in the past
        if (!options.includes(selectedMonth)) options.unshift(selectedMonth);
        return options;
    }, [selectedMonth]);

    // Categories already budgeted in the viewed month are edited via their row,
    // not re-added. For other months we don't have the data loaded, and the
    // backend upserts anyway, so no filter is applied there.
    const availableCategories = useMemo(() => {
        if (editing || formMonth !== selectedMonth) return categories;
        return categories.filter(c => !budgets.some(b => b.category_id === c.category_id));
    }, [categories, budgets, editing, formMonth, selectedMonth]);

    const repeatCount = Number(repeatMonths) || 0;

    const handleSave = async () => {
        const parsed = Number(amount);
        if (!categoryId || isNaN(parsed) || parsed <= 0) {
            toast.error('Pick a category and a positive amount');
            return;
        }
        setIsSaving(true);
        try {
            await dispatch(upsertBudget({
                categoryId: Number(categoryId),
                amount: parsed,
                periodMonth: formMonth,
                applyToFutureMonths: repeatCount,
            })).unwrap();
            toast.success(editing ? 'Budget updated' : 'Budget added');
            onClose();
        } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Failed to save budget');
        } finally {
            setIsSaving(false);
        }
    };

    return (
            <div className="space-y-4">
                {!editing && (
                    <div className="space-y-1.5">
                        <FieldLabel>Category</FieldLabel>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger className="h-9 w-full">
                                <SelectValue placeholder="Pick a category" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableCategories.map(c => (
                                    <SelectItem key={c.category_id} value={c.category_id.toString()}>{c.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                <div className="space-y-1.5">
                    <FieldLabel>Monthly limit</FieldLabel>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{symbol}</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            autoFocus={!!editing}
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="h-9 w-full pl-8 pr-3 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <FieldLabel>Month</FieldLabel>
                    {editing ? (
                        <p className="h-9 flex items-center px-3 bg-muted/40 border border-border rounded-lg text-sm text-muted-foreground">
                            {formatMonthLabel(editing.period_month)}
                        </p>
                    ) : (
                        <Select value={formMonth} onValueChange={setFormMonth}>
                            <SelectTrigger className="h-9 w-full">
                                <SelectValue placeholder="Month" />
                            </SelectTrigger>
                            <SelectContent>
                                {monthOptions.map(m => (
                                    <SelectItem key={m} value={m}>{formatMonthLabel(m)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                <div className="space-y-1.5">
                    <FieldLabel>Repeat</FieldLabel>
                    <Select value={repeatMonths} onValueChange={setRepeatMonths}>
                        <SelectTrigger className="h-9 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {REPEAT_OPTIONS.map(n => (
                                <SelectItem key={n} value={n.toString()}>
                                    {n === 0 ? 'This month only' : `Also the next ${n} month${n > 1 ? 's' : ''}`}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                        {repeatCount === 0
                            ? 'Budgets copy forward automatically each month — repeat only to pre-set specific months.'
                            : `The same amount will be set for ${formatMonthLabel(formMonth)} through ${formatMonthLabel(addMonths(formMonth, repeatCount))}.`}
                    </p>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                    <Button variant="ghost" size="sm" className="h-9" onClick={onClose}>Cancel</Button>
                    <Button size="sm" className="h-9 px-5" onClick={handleSave} isLoading={isSaving}>
                        {editing ? 'Save changes' : 'Add budget'}
                    </Button>
                </div>
            </div>
    );
}

export default function BudgetFormModal(props: BudgetFormModalProps) {
    return (
        <Modal
            isOpen={props.isOpen}
            onClose={props.onClose}
            title={props.editing ? `Edit budget · ${props.editing.category_name || `Category ${props.editing.category_id}`}` : 'Add budget'}
            description="Set a monthly spending limit for a category."
            maxWidth="max-w-sm"
        >
            <BudgetFormContent {...props} />
        </Modal>
    );
}
