import { useState, useMemo, useEffect } from 'react';
import SankeyChart from '../components/SankeyChart';
import SpendingBreakdown from '../components/SpendingBreakdown';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSummary, setSummaryTimeRange } from '../store/slices/summarySlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import type { RootState } from '../store';
import { ACCOUNT_TYPES, TIME_RANGES } from '../constants';

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const [isCashflowExpanded, setIsCashflowExpanded] = useState(true);

    const { data: summaryData, loading: isSummaryLoading, filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    const { rates, loading: isRatesLoading } = useAppSelector((state: RootState) => state.converter);

    const timeRange = summaryFilters.timeRange;
    const defaultCurrency = settings?.default_currency || 'USD';
    const currencySymbol = currencies?.find(c => c.code === defaultCurrency)?.symbol || defaultCurrency;

    useEffect(() => {
        dispatch(fetchCurrencies());
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchSummary({ timeRange, accountTypes: [...ACCOUNT_TYPES] }));
    }, [dispatch, timeRange]);

    useEffect(() => {
        if (defaultCurrency) {
            dispatch(fetchRates(defaultCurrency));
        }
    }, [dispatch, defaultCurrency]);

    const convert = useMemo(() => (amount: number, fromCurrencyCode: string): number => {
        if (fromCurrencyCode === defaultCurrency) return amount;
        const rate = rates[fromCurrencyCode];
        if (!rate) return amount;
        return amount / rate;
    }, [rates, defaultCurrency]);

    // Aggregate summary data for global charts
    const { globalInflows, globalOutflows } = useMemo(() => {
        const inflowsMap = new Map<string, number>();
        const outflowsMap = new Map<string, number>();

        if (summaryData) {
            summaryData.accounts.forEach((account) => {
                account.categories.forEach((cat) => {
                    const convertedAmount = convert(cat.total_amount, account.currency);
                    const map = cat.transaction_type === 'Credit' ? inflowsMap : outflowsMap;
                    map.set(cat.name, (map.get(cat.name) || 0) + convertedAmount);
                });
            });
        }

        const inflows = Array.from(inflowsMap.entries()).map(([name, amount]) => ({
            name, total_amount: amount, transaction_type: 'Credit' as const
        }));
        const outflows = Array.from(outflowsMap.entries()).map(([name, amount]) => ({
            name, total_amount: amount, transaction_type: 'Debit' as const
        }));

        return { globalInflows: inflows, globalOutflows: outflows };
    }, [summaryData, rates]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            {/* Minimal Header */}
            <Card className="p-6 bg-background/90 text-foreground">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Dashboard</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Sumanth'}</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                        <div className="flex bg-muted/50 p-1 rounded-xl border border-border self-start md:self-auto">
                            {TIME_RANGES.map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => dispatch(setSummaryTimeRange(range))}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-4 rounded-lg transition-colors duration-200 h-8",
                                        timeRange !== range && "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {range === 'thisMonth' ? '30D' : range === 'lastMonth' ? 'Last Month' : 'All'}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Cashflow Section */}
            <Card className="overflow-hidden">
                <div
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setIsCashflowExpanded(!isCashflowExpanded)}
                >
                    <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${isCashflowExpanded ? '' : '-rotate-90'}`}>
                            <ChevronDown className="text-muted-foreground" size={24} />
                        </div>
                        <CardTitle className="text-xl flex items-center gap-2">
                            Cashflow
                        </CardTitle>
                    </div>
                </div>

                {isCashflowExpanded && (
                    <CardContent className="pb-10">
                        {summaryData && !isRatesLoading && !isSummaryLoading ? (
                            <div className="transform transition-opacity duration-500 ease-out">
                                <SankeyChart
                                    inflows={globalInflows}
                                    outflows={globalOutflows}
                                    symbol={currencySymbol}
                                />
                            </div>
                        ) : (
                            <div className="h-[400px] flex items-center justify-center">
                                <Loader2 className="animate-spin text-primary" size={32} />
                            </div>
                        )}
                    </CardContent>
                )}
            </Card>

            {/* Spending Breakdown Section */}
            <SpendingBreakdown
                data={globalOutflows}
                symbol={currencySymbol}
            />
        </div>
    );
}
