import { memo, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, Pencil, PiggyBank, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';
import { sumConverted } from '../../lib/currency';
import { addMonths, formatMonthLabel } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { deleteBudget, fetchBudgets, setSelectedMonth } from '../../store/slices/budgetsSlice';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import type { RootState } from '../../store';
import type { BudgetItem } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import BudgetFormModal from './BudgetFormModal';
import { formatNumber } from '../../lib/format';

interface BudgetsPanelProps {
    symbol: string;
    defaultCurrency: string;
    rates: Record<string, number>;
}

const BudgetsPanel = memo(({ symbol, defaultCurrency, rates }: BudgetsPanelProps) => {
    const dispatch = useAppDispatch();
    // Budget figures are round numbers by nature, so they read better consolidated
    // (`30L`, `1.2M`) — `formatExact` backs the tooltips with the full amount.
    const formatMoney = (value: number) => formatNumber(value, { currency: defaultCurrency, symbol, compact: true });
    const formatExact = (value: number) => formatNumber(value, { currency: defaultCurrency, symbol, decimals: 2 });
    const { items: budgets, loading, selectedMonth } = useAppSelector((state: RootState) => state.budgets);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<BudgetItem | null>(null);

    useEffect(() => {
        dispatch(fetchBudgets(selectedMonth));
        if (categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, selectedMonth]);

    // Budget amounts are entered in the default currency; spend is converted
    // per-currency (with today's rate — no historical FX data available) so
    // it can be compared against that amount.
    const spentByBudget = useMemo(() => {
        const map = new Map<number, number>();
        budgets.forEach(b => map.set(b.budget_id, sumConverted(b.spent_by_currency, defaultCurrency, rates)));
        return map;
    }, [budgets, defaultCurrency, rates]);

    const hasForeignSpend = useMemo(
        () => budgets.some(b => Object.keys(b.spent_by_currency).some(c => c !== defaultCurrency)),
        [budgets, defaultCurrency]
    );

    const sortedBudgets = useMemo(
        () => [...budgets].sort((a, b) => (a.category_name || '').localeCompare(b.category_name || '')),
        [budgets]
    );

    const totals = useMemo(() => {
        const budgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
        const spent = budgets.reduce((sum, b) => sum + (spentByBudget.get(b.budget_id) || 0), 0);
        return { budgeted, spent, remaining: budgeted - spent };
    }, [budgets, spentByBudget]);

    const openAdd = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (budget: BudgetItem) => {
        setEditing(budget);
        setFormOpen(true);
    };

    const handleDelete = async (budget: BudgetItem) => {
        const name = budget.category_name || `Category ${budget.category_id}`;
        if (!window.confirm(`Delete the ${name} budget for ${formatMonthLabel(selectedMonth)}? Other months are not affected.`)) return;
        try {
            await dispatch(deleteBudget(budget.budget_id)).unwrap();
            toast.success('Budget removed');
        } catch (err) {
            toast.error(typeof err === 'string' ? err : 'Failed to delete budget');
        }
    };

    return (
        <Card>
            <div className="p-6 pb-2 flex justify-between items-center gap-4 flex-wrap">
                <CardTitle className="text-xl flex items-center gap-2">
                    <PiggyBank size={18} className="text-muted-foreground" />
                    Monthly Budgets
                </CardTitle>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => dispatch(setSelectedMonth(addMonths(selectedMonth, -1)))}
                            title="Previous month"
                        >
                            <ChevronLeft size={16} />
                        </Button>
                        <span className="text-sm font-bold min-w-[9rem] text-center">{formatMonthLabel(selectedMonth)}</span>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                            onClick={() => dispatch(setSelectedMonth(addMonths(selectedMonth, 1)))}
                            title="Next month"
                        >
                            <ChevronRight size={16} />
                        </Button>
                    </div>
                    <Button
                        size="icon"
                        className="h-8 w-8 rounded-full shadow-md"
                        onClick={openAdd}
                        title="Add budget"
                    >
                        <Plus size={16} />
                    </Button>
                </div>
            </div>
            {hasForeignSpend && (
                <p className="px-6 -mt-1 pb-2 text-[11px] text-muted-foreground">
                    Spend in other currencies is converted to {defaultCurrency} using today's exchange rate.
                </p>
            )}
            <CardContent className="pb-6 space-y-5">
                {loading && budgets.length === 0 ? (
                    <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                ) : budgets.length === 0 ? (
                    <div className="py-8 text-center space-y-3">
                        <p className="text-sm text-muted-foreground">
                            No budgets for {formatMonthLabel(selectedMonth)} — set a limit per category to track spending against it.
                        </p>
                        <Button
                            variant="outline"
                            size="icon"
                            className="rounded-full h-10 w-10"
                            onClick={openAdd}
                            title="Add budget"
                        >
                            <Plus size={18} />
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-muted/40 border border-border p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Budgeted</p>
                                <p className="text-lg font-bold tabular-nums mt-0.5" title={`${symbol}${formatExact(totals.budgeted)}`}>{symbol}{formatMoney(totals.budgeted)}</p>
                            </div>
                            <div className="rounded-xl bg-muted/40 border border-border p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Spent</p>
                                <p className="text-lg font-bold tabular-nums mt-0.5" title={`${symbol}${formatExact(totals.spent)}`}>{symbol}{formatMoney(totals.spent)}</p>
                            </div>
                            <div className="rounded-xl bg-muted/40 border border-border p-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {totals.remaining >= 0 ? 'Remaining' : 'Over'}
                                </p>
                                <p className={cn(
                                    "text-lg font-bold tabular-nums mt-0.5",
                                    totals.remaining >= 0 ? "text-emerald-600" : "text-rose-600"
                                )} title={`${symbol}${formatExact(Math.abs(totals.remaining))}`}>
                                    {symbol}{formatMoney(Math.abs(totals.remaining))}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {sortedBudgets.map((budget) => {
                                const spent = spentByBudget.get(budget.budget_id) || 0;
                                const ratio = budget.amount > 0 ? Math.min(spent / budget.amount, 1) : 0;
                                const over = spent > budget.amount;
                                const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
                                return (
                                    <div key={budget.budget_id}>
                                        <div className="flex justify-between items-center mb-1.5 gap-2">
                                            <span className="text-sm font-semibold text-foreground truncate">
                                                {budget.category_name || `Category ${budget.category_id}`}
                                            </span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <span
                                                    className={cn(
                                                        "text-xs font-bold tabular-nums mr-1",
                                                        over ? "text-rose-600" : "text-muted-foreground"
                                                    )}
                                                    title={`Spent ${symbol}${formatExact(spent)} of ${symbol}${formatExact(budget.amount)}`}
                                                >
                                                    {symbol}{formatMoney(spent)} / {symbol}{formatMoney(budget.amount)}
                                                </span>
                                                <button
                                                    onClick={() => openEdit(budget)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                                                    title="Edit budget"
                                                >
                                                    <Pencil size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(budget)}
                                                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                                                    title="Delete budget"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    over ? "bg-rose-600" : ratio > 0.8 ? "bg-amber-500" : "bg-emerald-600"
                                                )}
                                                style={{ width: `${ratio * 100}%` }}
                                            />
                                        </div>
                                        <p className={cn(
                                            "text-[10px] font-bold mt-1",
                                            over ? "text-rose-600" : "text-muted-foreground"
                                        )}>
                                            {over
                                                ? `Over budget by ${symbol}${formatMoney(spent - budget.amount)}`
                                                : `${percent}% used · ${symbol}${formatMoney(budget.amount - spent)} left`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </CardContent>

            <BudgetFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                editing={editing}
                symbol={symbol}
            />
        </Card>
    );
});

BudgetsPanel.displayName = 'BudgetsPanel';

export default BudgetsPanel;
