import { useEffect } from 'react';
import BudgetsPanel from '../components/budgets/BudgetsPanel';
import YearlyBudgetView from '../components/budgets/YearlyBudgetView';
import { Card, CardTitle } from '../components/ui/Card';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import type { RootState } from '../store';

export default function Budgets() {
    const dispatch = useAppDispatch();
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    const { rates } = useAppSelector((state: RootState) => state.converter);

    const defaultCurrency = settings?.default_currency || 'USD';
    const currencySymbol = currencies?.find((c) => c.code === defaultCurrency)?.symbol || defaultCurrency;

    useEffect(() => {
        dispatch(fetchCurrencies());
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        if (defaultCurrency) {
            dispatch(fetchRates(defaultCurrency));
        }
    }, [dispatch, defaultCurrency]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Card className="p-6 bg-background/90 text-foreground">
                <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Budgets</CardTitle>
                <p className="text-muted-foreground text-sm mt-1">Set monthly limits per category and track spend against them.</p>
            </Card>

            <div className="grid gap-8 lg:grid-cols-2 items-start">
                <BudgetsPanel symbol={currencySymbol} defaultCurrency={defaultCurrency} rates={rates} />
                <YearlyBudgetView symbol={currencySymbol} defaultCurrency={defaultCurrency} rates={rates} />
            </div>
        </div>
    );
}
