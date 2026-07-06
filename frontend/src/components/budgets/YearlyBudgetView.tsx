import { memo, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, PiggyBank, X } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn, formatMonthLabel } from '../../lib/utils';
import { sumConverted } from '../../lib/currency';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchYearlyBudgets } from '../../store/slices/budgetsSlice';
import type { RootState } from '../../store';
import type { YearlyBudgetCategory, YearlyBudgetMonth } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';

interface YearlyBudgetViewProps {
    symbol: string;
    defaultCurrency: string;
    rates: Record<string, number>;
}

const MONTH_LETTERS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

const formatMoney = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 0 });

// Same thresholds as the monthly progress bars: red over, amber past 80%.
function cellColor(amount: number | null, spent: number): string {
    if (amount == null) return spent > 0 ? 'bg-muted-foreground/25' : 'bg-muted/60';
    if (spent > amount) return 'bg-rose-600';
    if (amount > 0 && spent / amount > 0.8) return 'bg-amber-500';
    return 'bg-emerald-600';
}

interface SelectedCell {
    category: YearlyBudgetCategory;
    month: YearlyBudgetMonth;
}

const LegendDot = ({ className, label }: { className: string; label: string }) => (
    <span className="flex items-center gap-1.5">
        <span className={cn('w-2.5 h-2.5 rounded-[3px] inline-block', className)} />
        {label}
    </span>
);

const YearlyBudgetView = memo(({ symbol, defaultCurrency, rates }: YearlyBudgetViewProps) => {
    const dispatch = useAppDispatch();
    const { yearly, yearlyLoading } = useAppSelector((state: RootState) => state.budgets);
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [selected, setSelected] = useState<SelectedCell | null>(null);

    useEffect(() => {
        dispatch(fetchYearlyBudgets(year));
    }, [dispatch, year]);

    const changeYear = (delta: number) => {
        setYear(y => y + delta);
        setSelected(null);
    };

    const now = new Date();
    const currentMonthIdx = year === now.getFullYear() ? now.getMonth() : -1;

    const categoryName = (c: YearlyBudgetCategory) => c.category_name || `Category ${c.category_id}`;

    const renderDetail = () => {
        if (!selected) return null;
        const { category, month } = selected;
        const spent = sumConverted(month.spent_by_currency, defaultCurrency, rates);
        const over = month.amount != null && spent > month.amount;
        return (
            <div className="rounded-xl bg-muted/40 border border-border px-4 py-3 flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-foreground">
                        {categoryName(category)} · {formatMonthLabel(month.period_month)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 tabular-nums">
                        Budgeted {month.amount != null ? `${symbol}${formatMoney(month.amount)}` : '—'}
                        {' · '}Spent {symbol}{formatMoney(spent)}
                        {' · '}
                        {month.amount == null ? (
                            'No budget set'
                        ) : over ? (
                            <span className="text-rose-600 font-bold">Over by {symbol}{formatMoney(spent - month.amount)}</span>
                        ) : (
                            <span className="text-emerald-600 font-bold">{symbol}{formatMoney(month.amount - spent)} left</span>
                        )}
                    </p>
                </div>
                <button
                    onClick={() => setSelected(null)}
                    className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                    title="Close details"
                >
                    <X size={14} />
                </button>
            </div>
        );
    };

    return (
        <Card>
            <div className="p-6 pb-2 flex justify-between items-center gap-4 flex-wrap">
                <CardTitle className="text-xl flex items-center gap-2">
                    <PiggyBank size={18} className="text-muted-foreground" />
                    Yearly Overview
                </CardTitle>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => changeYear(-1)}
                        title="Previous year"
                    >
                        <ChevronLeft size={16} />
                    </Button>
                    <span className="text-sm font-bold min-w-[3.5rem] text-center">{year}</span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                        onClick={() => changeYear(1)}
                        title="Next year"
                    >
                        <ChevronRight size={16} />
                    </Button>
                </div>
            </div>
            <CardContent className="pb-6 space-y-4">
                {yearlyLoading && yearly.length === 0 ? (
                    <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                ) : yearly.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        No budgets set for {year} yet.
                    </p>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full border-separate border-spacing-y-1.5">
                                <thead>
                                    <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                        <th className="text-left font-bold pr-2">Category</th>
                                        {MONTH_LETTERS.map((letter, idx) => (
                                            <th
                                                key={idx}
                                                className={cn(
                                                    'font-bold w-6 text-center',
                                                    idx === currentMonthIdx && 'text-foreground'
                                                )}
                                            >
                                                {letter}
                                            </th>
                                        ))}
                                        <th className="text-right font-bold pl-2">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {yearly.map(category => {
                                        const totalSpent = sumConverted(category.total_spent_by_currency, defaultCurrency, rates);
                                        const totalOver = totalSpent > category.total_amount;
                                        return (
                                            <tr key={category.category_id}>
                                                <td className="pr-2 max-w-[7rem]">
                                                    <span className="block text-sm font-semibold text-foreground truncate">
                                                        {categoryName(category)}
                                                    </span>
                                                </td>
                                                {category.months.map(month => {
                                                    const spent = sumConverted(month.spent_by_currency, defaultCurrency, rates);
                                                    const isSelected = selected?.category.category_id === category.category_id
                                                        && selected?.month.period_month === month.period_month;
                                                    return (
                                                        <td key={month.period_month} className="text-center">
                                                            <button
                                                                onClick={() => setSelected(isSelected ? null : { category, month })}
                                                                title={`${formatMonthLabel(month.period_month)} — budgeted ${month.amount != null ? symbol + formatMoney(month.amount) : 'nothing'}, spent ${symbol}${formatMoney(spent)}`}
                                                                className={cn(
                                                                    'w-4 h-4 rounded-[4px] inline-block align-middle transition-transform hover:scale-125',
                                                                    cellColor(month.amount, spent),
                                                                    isSelected && 'ring-2 ring-primary ring-offset-1 ring-offset-background'
                                                                )}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                                <td className="pl-2 text-right">
                                                    <span className={cn(
                                                        'text-xs font-bold tabular-nums whitespace-nowrap',
                                                        totalOver ? 'text-rose-600' : 'text-muted-foreground'
                                                    )}>
                                                        {symbol}{formatMoney(totalSpent)} / {symbol}{formatMoney(category.total_amount)}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {renderDetail()}

                        <div className="flex items-center gap-4 flex-wrap text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <LegendDot className="bg-emerald-600" label="Under" />
                            <LegendDot className="bg-amber-500" label="Near limit" />
                            <LegendDot className="bg-rose-600" label="Over" />
                            <LegendDot className="bg-muted-foreground/25" label="Spend, no budget" />
                            <LegendDot className="bg-muted/60" label="No budget" />
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
});

YearlyBudgetView.displayName = 'YearlyBudgetView';

export default YearlyBudgetView;
