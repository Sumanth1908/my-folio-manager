import { useEffect } from 'react';
import BudgetsPanel from '../components/budgets/BudgetsPanel';
import YearlyBudgetView from '../components/budgets/YearlyBudgetView';
import { PageHeader } from '../components/ui/PageHeader';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import type { RootState } from '../store';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';

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
        <div className="page-shell">
            <PageHeader
                eyebrow="Plan"
                title="Planning"
                description="Manage budgets and see upcoming commitments in one place."
            />

            <UpcomingPayments symbol={currencySymbol} />

            <div className="grid gap-8 lg:grid-cols-2 items-start">
                <BudgetsPanel symbol={currencySymbol} defaultCurrency={defaultCurrency} rates={rates} />
                <YearlyBudgetView symbol={currencySymbol} defaultCurrency={defaultCurrency} rates={rates} />
            </div>
        </div>
    );
}
