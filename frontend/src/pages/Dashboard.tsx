import { useState, useMemo, useEffect } from 'react';
import SankeyChart from '../components/dashboard/SankeyChart';
import SpendingBreakdown from '../components/dashboard/SpendingBreakdown';
import UpcomingPayments from '../components/dashboard/UpcomingPayments';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { convertAmount } from '../lib/currency';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSummary, setSummaryTimeRange } from '../store/slices/summarySlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import type { RootState } from '../store';
import type { Account, AccountSummary, CategorySummary } from '../types';
import { TIME_RANGES, TRANSACTION_TYPE } from '../constants';
import { fetchAccounts } from '../store/slices/accountsSlice';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../components/ui/Select";

export default function Dashboard() {
    const dispatch = useAppDispatch();
    const { user } = useAuth();
    const [isCashflowExpanded, setIsCashflowExpanded] = useState(true);
    const [selectedAccountId, setSelectedAccountId] = useState<string>(() => {
        return localStorage.getItem('dashboard_selected_account_id') || 'all';
    });

    useEffect(() => {
        localStorage.setItem('dashboard_selected_account_id', selectedAccountId);
    }, [selectedAccountId]);

    const { data: summaryData, loading: isSummaryLoading, error: summaryError, filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    const { rates, loading: isRatesLoading } = useAppSelector((state: RootState) => state.converter);

    const timeRange = summaryFilters.timeRange;
    const defaultCurrency = settings?.default_currency || 'USD';
    const currencySymbol = currencies?.find((currency) => currency.code === defaultCurrency)?.symbol || defaultCurrency;

    useEffect(() => {
        dispatch(fetchAccounts());
        dispatch(fetchCurrencies());
        dispatch(fetchSettings());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchSummary({ timeRange }));
    }, [dispatch, timeRange]);

    useEffect(() => {
        if (defaultCurrency) {
            dispatch(fetchRates(defaultCurrency));
        }
    }, [dispatch, defaultCurrency]);

    const convert = useMemo(() => (amount: number, fromCurrencyCode: string): number =>
        convertAmount(amount, fromCurrencyCode, defaultCurrency, rates), [rates, defaultCurrency]);

    const selectedAccount = useMemo(() => {
        return accounts.find((a: Account) => a.account_id.toString() === selectedAccountId.toString());
    }, [accounts, selectedAccountId]);

    // Aggregate summary data for charts
    const { globalOutflows, savingsInflows, savingsOutflows } = useMemo(() => {
        const inflowsMap = new Map<string, number>();
        const outflowsMap = new Map<string, number>();
        const savingsInflowsMap = new Map<string, number>();
        const savingsOutflowsMap = new Map<string, number>();

        if (summaryData) {
            summaryData.accounts
                .filter((account: AccountSummary) => selectedAccountId === 'all' || account.account_id === selectedAccountId)
                .forEach((account: AccountSummary) => {
                    account.categories.forEach((cat: CategorySummary) => {
                        const convertedAmount = convert(cat.total_amount, account.currency);
                        const isCredit = cat.transaction_type === TRANSACTION_TYPE.CREDIT;

                        // Global maps (Total portfolio inflows/outflows)
                        const gMap = isCredit ? inflowsMap : outflowsMap;
                        gMap.set(cat.name, (gMap.get(cat.name) || 0) + convertedAmount);

                        // Sankey maps
                        const sMap = isCredit ? savingsInflowsMap : savingsOutflowsMap;
                        sMap.set(cat.name, (sMap.get(cat.name) || 0) + convertedAmount);
                    });
                });
        }

        const outflows = Array.from(outflowsMap.entries()).map(([name, amount]) => ({
            name, total_amount: amount, transaction_type: TRANSACTION_TYPE.DEBIT
        }));

        const sInflows = Array.from(savingsInflowsMap.entries()).map(([name, amount]) => ({
            name, total_amount: amount, transaction_type: TRANSACTION_TYPE.CREDIT
        }));
        const sOutflows = Array.from(savingsOutflowsMap.entries()).map(([name, amount]) => ({
            name, total_amount: amount, transaction_type: TRANSACTION_TYPE.DEBIT
        }));

        return {
            globalOutflows: outflows,
            savingsInflows: sInflows,
            savingsOutflows: sOutflows
        };
    }, [summaryData, convert, selectedAccountId]);

    return (
        <div className="page-shell">
            <PageHeader
                eyebrow="Overview"
                title="Your financial picture"
                description={`Welcome back, ${user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'}. Review cash flow, upcoming payments, and spending in one place.`}
                actions={
                    <>
                        <div className="w-full md:w-64">
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger className="h-10 bg-muted/50 border-border/50 hover:bg-muted transition-colors">
                                    <SelectValue placeholder="All Accounts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Accounts</SelectItem>
                                    {accounts.map((account: Account) => (
                                        <SelectItem key={account.account_id} value={account.account_id}>
                                            {account.account_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <SegmentedControl
                            value={timeRange}
                            onValueChange={(range) => dispatch(setSummaryTimeRange(range))}
                            label="Summary period"
                            options={TIME_RANGES.map((range) => ({
                                value: range,
                                label: range === 'last30Days' ? '30 days' : range === 'currentMonth' ? 'This month' : range === 'lastMonth' ? 'Last month' : 'All time',
                            }))}
                        />
                    </>
                }
            />

            {summaryError && (
                <ErrorBanner
                    message={summaryError}
                    onRetry={() => dispatch(fetchSummary({ timeRange }))}
                />
            )}

            {/* Upcoming payments */}
            <UpcomingPayments symbol={currencySymbol} />

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
                                    inflows={savingsInflows}
                                    outflows={savingsOutflows}
                                    symbol={currencySymbol}
                                    accountType={selectedAccount?.account_type}
                                    accountName={selectedAccount?.account_name}
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
