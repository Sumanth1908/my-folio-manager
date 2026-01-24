import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';
import type { Currency } from '../types';
import SankeyChart from '../components/SankeyChart';
import SpendingBreakdown from '../components/SpendingBreakdown';
import AccountSummaryPanel from '../components/AccountSummaryPanel';
import { useSettings } from '../hooks/useSettings';
import { useCurrencyConverter } from '../hooks/useCurrencyConverter';
import { useAccounts } from '../hooks/useAccounts';
import { useSummary } from '../hooks/useSummary';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../lib/utils';

type TimeRange = 'thisMonth' | 'lastMonth' | 'allTime';

export default function Dashboard() {
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState<TimeRange>('thisMonth');
    const [isCashflowExpanded, setIsCashflowExpanded] = useState(true);

    // Fetch account summary from backend using the new hook
    const { data: summaryData, isLoading: isSummaryLoading } = useSummary({
        timeRange,
        accountTypes: ['Savings', 'Investment', 'Fixed Deposit']
    });

    const { data: accounts } = useAccounts();
    const { data: currencies } = useQuery<Currency[]>({
        queryKey: ['currencies'],
        queryFn: async () => {
            const res = await api.get('/currencies/');
            return res.data;
        }
    });

    const { settings } = useSettings();
    const defaultCurrency = settings?.default_currency || 'USD';
    const { convert, isLoading: isRatesLoading } = useCurrencyConverter(defaultCurrency);

    const totalNetWorth = accounts?.items.reduce((acc, account) => {
        let balance = 0;
        if (account.account_type === 'Savings' && account.savings_account) {
            balance = Number(account.savings_account.balance);
        } else if (account.account_type === 'Loan' && account.loan_account) {
            balance = -Number(account.loan_account.outstanding_amount);
        } else if (account.account_type === 'Fixed Deposit' && account.fixed_deposit_account) {
            balance = Number(account.fixed_deposit_account.principal_amount);
        } else if (account.account_type === 'Investment' && account.investment_holdings) {
            balance = account.investment_holdings.reduce((sum, h) => sum + (Number(h.quantity) * (Number(h.current_price) || Number(h.average_price))), 0);
        }
        return acc + convert(balance, account.currency);
    }, 0) || 0;

    const currencySymbol = currencies?.find(c => c.code === defaultCurrency)?.symbol || defaultCurrency;

    // Aggregate summary data for global charts
    const { globalInflows, globalOutflows } = useMemo(() => {
        const inflowsMap = new Map<string, number>();
        const outflowsMap = new Map<string, number>();

        if (summaryData && !isRatesLoading) {
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
    }, [summaryData, convert, isRatesLoading]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            {/* Minimal Header */}
            <Card className="p-6 backdrop-blur-xl bg-background/60">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Portfolio</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">Welcome back, {user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Sumanth'}</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-8 w-full md:w-auto">
                        <div className="text-right">
                            <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Total Net Worth</p>
                            <div className="text-3xl font-black text-foreground drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                                {isRatesLoading ? (
                                    <div className="animate-pulse h-8 w-32 bg-muted rounded-lg ml-auto" />
                                ) : (
                                    <span className="tabular-nums">{currencySymbol}{totalNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                )}
                            </div>
                        </div>

                        <div className="flex bg-muted/50 p-1 rounded-xl border border-border self-start md:self-auto">
                            {(['thisMonth', 'lastMonth', 'allTime'] as const).map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => setTimeRange(range)}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-4 rounded-lg transition-all duration-200 h-8",
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

            {/* Account Summary from New API */}
            {isSummaryLoading ? (
                <div className="flex items-center justify-center p-12 bg-card rounded-2xl border border-border/50">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : summaryData && (
                <AccountSummaryPanel data={summaryData} />
            )}

            {/* Cashflow Section */}
            <Card className="overflow-hidden">
                <div
                    className="p-6 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition"
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
                        {summaryData && !isRatesLoading ? (
                            <div className="transform transition-all duration-500 ease-out">
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
