import { useState, useMemo, useEffect } from 'react';
import type { Account } from '../types';
import { ACCOUNT_TYPE } from '../constants';
import {
    PieChart,
    TrendingUp,
    TrendingDown,
    Wallet,
    Building2,
    Loader2,
    LayoutGrid,
    BarChart3,
    Repeat,
    Gem,
    Bitcoin,
    Boxes,
    Banknote,
} from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { cn } from '../lib/utils';
import { formatCurrency, formatNumber } from '../lib/format';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchRates } from '../store/slices/converterSlice';
import { fetchPortfolioSummary } from '../store/slices/portfolioSlice';
import type { RootState } from '../store';
import type { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { formatAccountType, getAccountDisplayValue, getAccountHoldings } from '../lib/accounts';

import { BalanceSectionView, type BalanceItem, type BalanceSection, type SubHolding } from '../components/portfolio/BalanceSheetView';

// --- Types for Investments View ---
interface AggregatedHolding {
    symbol: string;
    name: string;
    totalQuantity: number;
    averagePrice: number;
    currentPrice: number;
    totalValue: number;
    totalCost: number;
    profit: number;
    profitPercent: number;
    currency: string;
    assetType: string;
    unit: string;
}

export default function Portfolio() {
    const dispatch = useAppDispatch();
    const [isAssetsExpanded, setIsAssetsExpanded] = useState(true);
    const [isLiabilitiesExpanded, setIsLiabilitiesExpanded] = useState(true);

    const { items: accounts, loading: isAccountsLoading } = useAppSelector((state: RootState) => state.accounts);
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { rates, loading: isRatesLoading } = useAppSelector((state: RootState) => state.converter);

    const defaultCurrency = settings?.default_currency || 'USD';
    const currencySymbol = currencies?.find(c => c.code === defaultCurrency)?.symbol || defaultCurrency;

    const money = (value: number) => formatCurrency(value, { currency: defaultCurrency, symbol: currencySymbol, decimals: 2 });
    const compactMoney = (value: number) => formatCurrency(value, { currency: defaultCurrency, symbol: currencySymbol, compact: true, decimals: 2 });

    useEffect(() => {
        dispatch(fetchAccounts());
        dispatch(fetchSettings());
        dispatch(fetchCurrencies());
        dispatch(fetchPortfolioSummary());
    }, [dispatch]);

    useEffect(() => {
        if (defaultCurrency) {
            dispatch(fetchRates(defaultCurrency));
        }
    }, [dispatch, defaultCurrency]);

    const convert = useMemo(() => (amount: number, fromCurrency: string) => {
        if (fromCurrency === defaultCurrency) return amount;
        const rate = rates[fromCurrency];
        if (!rate) return amount;
        return amount / rate;
    }, [rates, defaultCurrency]);

    // --- Compute Balance Sheet Data ---
    const { assets, liabilities } = useMemo(() => {
        if (!accounts || accounts.length === 0 || Object.keys(rates).length === 0) {
            return {
                assets: { title: 'Assets', total: 0, items: [] },
                liabilities: { title: 'Liabilities', total: 0, items: [] }
            };
        }

        const assetItems: Record<string, { total: number, accounts: Account[], color: string, icon: React.ReactNode }> = {
            [ACCOUNT_TYPE.SAVINGS]: { total: 0, accounts: [], color: '#8b5cf6', icon: <Wallet size={16} /> },
            [ACCOUNT_TYPE.FIXED_DEPOSIT]: { total: 0, accounts: [], color: '#06b6d4', icon: <Building2 size={16} /> },
            [ACCOUNT_TYPE.RECURRING_DEPOSIT]: { total: 0, accounts: [], color: '#6366f1', icon: <Repeat size={16} /> },
            [ACCOUNT_TYPE.INVESTMENT]: { total: 0, accounts: [], color: '#3b82f6', icon: <TrendingUp size={16} /> },
            [ACCOUNT_TYPE.CASH]: { total: 0, accounts: [], color: '#14b8a6', icon: <Banknote size={16} /> },
            [ACCOUNT_TYPE.COMMODITY]: { total: 0, accounts: [], color: '#eab308', icon: <Gem size={16} /> },
            [ACCOUNT_TYPE.CRYPTO]: { total: 0, accounts: [], color: '#f97316', icon: <Bitcoin size={16} /> },
            [ACCOUNT_TYPE.REAL_ESTATE]: { total: 0, accounts: [], color: '#0891b2', icon: <Building2 size={16} /> },
            [ACCOUNT_TYPE.OTHER_ASSET]: { total: 0, accounts: [], color: '#a855f7', icon: <Boxes size={16} /> },
        };

        const liabilityItems: Record<string, { total: number, accounts: Account[], color: string, icon: React.ReactNode }> = {
            [ACCOUNT_TYPE.LOAN]: { total: 0, accounts: [], color: '#f43f5e', icon: <TrendingDown size={16} /> },
        };

        accounts.filter(account => account.status !== 'Closed').forEach(account => {
            const balance = getAccountDisplayValue(account);
            const convertedValue = convert(balance, account.currency);
            const isLiability = account.account_nature === 'LIABILITY' || account.account_type === ACCOUNT_TYPE.LOAN;

            if (isLiability) {
                if (!liabilityItems[account.account_type]) {
                    liabilityItems[account.account_type] = { total: 0, accounts: [], color: '#f43f5e', icon: <TrendingDown size={16} /> };
                }
                // Use absolute value for liabilities so they sum correctly as positive debt values
                liabilityItems[account.account_type].total += Math.abs(convertedValue);
                liabilityItems[account.account_type].accounts.push({
                    ...account,
                    balance: Math.abs(Number(account.balance || 0)),
                    net_value: Math.abs(Number(account.net_value ?? account.balance ?? 0)),
                });
            } else {
                if (!assetItems[account.account_type]) {
                    assetItems[account.account_type] = { total: 0, accounts: [], color: '#64748b', icon: <Boxes size={16} /> };
                }
                assetItems[account.account_type].total += convertedValue;
                assetItems[account.account_type].accounts.push(account);
            }
        });

        const assetTotal = Object.values(assetItems).reduce((sum, item) => sum + item.total, 0);
        const liabilityTotal = Object.values(liabilityItems).reduce((sum, item) => sum + item.total, 0);

        const mapToBalanceItem = (name: string, item: { total: number, accounts: Account[], color: string, icon: React.ReactNode }, totalValue: number, type: string): BalanceItem => {
            const subAccounts = item.accounts.map(acc => {
                const bal = getAccountDisplayValue(acc);
                let hds: SubHolding[] = [];
                const accountHoldings = getAccountHoldings(acc);

                if (accountHoldings.length > 0) {
                    const accountTotalVal = bal;
                    hds = accountHoldings.map(h => {
                        const valOriginal = Number(h.quantity) * (Number(h.current_price) || Number(h.average_price));
                        const valLocal = convert(valOriginal, h.currency);
                        return {
                            id: h.holding_id.toString(),
                            name: h.name,
                            symbol: h.symbol,
                            value: valLocal,
                            weight: accountTotalVal > 0 ? (valOriginal / accountTotalVal) * 100 : 0
                        };
                    }).sort((a, b) => b.value - a.value);
                }

                const convertedAccountTotal = convert(bal, acc.currency);
                return {
                    id: acc.account_id,
                    name: acc.account_name || 'Unnamed Account',
                    value: convertedAccountTotal,
                    weight: item.total > 0 ? (convertedAccountTotal / item.total) * 100 : 0,
                    holdings: hds
                };
            }).sort((a, b) => b.value - a.value);

            return {
                id: name,
                name: formatAccountType(name),
                value: item.total,
                weight: totalValue > 0 ? (item.total / totalValue) * 100 : 0,
                color: item.color,
                type,
                icon: item.icon,
                accounts: subAccounts
            };
        };

        const finalizedAssets: BalanceSection = {
            title: 'Assets',
            total: assetTotal,
            items: Object.entries(assetItems)
                .filter((entry) => entry[1].total > 0)
                .map(([name, item]) => mapToBalanceItem(name, item, assetTotal, 'asset'))
                .sort((a, b) => b.value - a.value)
        };

        const finalizedLiabilities: BalanceSection = {
            title: 'Liabilities',
            total: liabilityTotal,
            items: Object.entries(liabilityItems)
                .filter((entry) => entry[1].total > 0)
                .map(([name, item]) => mapToBalanceItem(name, item, liabilityTotal, 'liability'))
                .sort((a, b) => b.value - a.value)
        };

        return { assets: finalizedAssets, liabilities: finalizedLiabilities };
    }, [accounts, convert, rates]);

    // --- Compute Investments Data ---
    const { aggregatedHoldings, totalInvestmentValue, totalInvestmentProfit } = useMemo(() => {
        if (!accounts || accounts.length === 0 || Object.keys(rates).length === 0) {
            return { aggregatedHoldings: [], totalInvestmentValue: 0, totalInvestmentProfit: 0 };
        }

        const holdingsMap = new Map<string, AggregatedHolding>();

        accounts.filter(account => account.status !== 'Closed').forEach(account => {
            const accountHoldings = getAccountHoldings(account);
            if (accountHoldings.length > 0) {
                accountHoldings.forEach(holding => {
                    const currentPrice = holding.current_price || holding.average_price;
                    const valueInOriginalCurrency = holding.quantity * currentPrice;
                    const costInOriginalCurrency = holding.quantity * holding.average_price;

                    const valueInLocal = convert(valueInOriginalCurrency, holding.currency);
                    const costInLocal = convert(costInOriginalCurrency, holding.currency);

                    const holdingKey = `${holding.asset_type}:${holding.symbol}:${holding.currency}:${holding.unit}`;
                    const existing = holdingsMap.get(holdingKey);
                    if (existing) {
                        existing.totalQuantity += holding.quantity;
                        existing.totalValue += valueInLocal;
                        existing.totalCost += costInLocal;
                        existing.profit = existing.totalValue - existing.totalCost;
                        existing.profitPercent = (existing.profit / existing.totalCost) * 100;
                    } else {
                        holdingsMap.set(holdingKey, {
                            symbol: holding.symbol,
                            name: holding.name,
                            totalQuantity: holding.quantity,
                            averagePrice: holding.average_price,
                            currentPrice: currentPrice,
                            totalValue: valueInLocal,
                            totalCost: costInLocal,
                            profit: valueInLocal - costInLocal,
                            profitPercent: costInLocal > 0 ? ((valueInLocal - costInLocal) / costInLocal) * 100 : 0,
                            currency: holding.currency,
                            assetType: holding.asset_type,
                            unit: holding.unit,
                        });
                    }
                });
            }
        });

        const holdings = Array.from(holdingsMap.values()).sort((a, b) => b.totalValue - a.totalValue);
        const v = holdings.reduce((sum, h) => sum + h.totalValue, 0);
        const c = holdings.reduce((sum, h) => sum + h.totalCost, 0);
        const p = v - c;

        return { aggregatedHoldings: holdings, totalInvestmentValue: v, totalInvestmentProfit: p };
    }, [accounts, convert, rates]);

    if (isAccountsLoading || isRatesLoading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    const netWorth = assets.total - liabilities.total;
    const holdingColumns: ColumnDef<AggregatedHolding, unknown>[] = [
        {
            accessorKey: 'symbol',
            header: 'Holding',
            cell: ({ row }) => (
                <div className="min-w-0">
                    <div className="font-semibold text-foreground">{row.original.symbol}</div>
                    <div className="max-w-44 truncate text-xs text-muted-foreground">{row.original.name}</div>
                    <div className="mt-0.5 text-[10px] font-semibold uppercase text-primary">{formatAccountType(row.original.assetType)}</div>
                </div>
            ),
        },
        {
            accessorKey: 'totalQuantity',
            header: 'Quantity',
            cell: ({ row, getValue }) => <div className="amount text-right">{formatNumber(Number(getValue()), { currency: defaultCurrency, maxDecimals: 4 })} {row.original.unit}</div>,
        },
        {
            accessorKey: 'totalValue',
            header: `Value (${currencySymbol})`,
            cell: ({ getValue }) => {
                const value = Number(getValue());
                return <div className="amount text-right" title={formatNumber(value, { currency: defaultCurrency, decimals: 2 })}>{formatNumber(value, { currency: defaultCurrency, compact: true, decimals: 2 })}</div>;
            },
        },
        {
            accessorKey: 'profitPercent',
            header: 'Return',
            cell: ({ row, getValue }) => {
                const profit = row.original.profit;
                return (
                    <div className="text-right">
                        <Badge variant={profit >= 0 ? 'income' : 'expense'}>
                            {profit >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {Number(getValue()).toFixed(1)}%
                        </Badge>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="page-shell">
            <PageHeader
                eyebrow="Assets and liabilities"
                title="Wealth"
                description="A consolidated view of assets, liabilities, holdings, and performance."
                actions={
                    <div className="min-w-40 rounded-md border border-border bg-card px-4 py-3 text-right">
                        <p className="text-xs font-medium text-muted-foreground">Total net worth</p>
                        <div className="amount mt-0.5 text-2xl" title={money(netWorth)}>{compactMoney(netWorth)}</div>
                    </div>
                }
            />

            {/* Allocation Overview Bar */}
            <Card className="p-6 md:p-8 space-y-6 bg-background/80">
                <div className="flex items-center gap-2 mb-2">
                    <LayoutGrid size={20} className="text-primary" />
                    <h3 className="text-lg font-bold">Wealth Distribution</h3>
                </div>

                <div className="space-y-4">
                    <div className="h-4 w-full flex rounded-full overflow-hidden bg-muted/20 p-0.5 shadow-inner">
                        {[...assets.items, ...liabilities.items].map((item) => (
                            <div
                                key={item.id}
                                style={{
                                    width: `${(item.value / (assets.total + liabilities.total)) * 100}%`,
                                    backgroundColor: item.color
                                }}
                                className="h-full border-r border-background/10 last:border-0 first:rounded-l-full last:rounded-r-full shadow-sm"
                                title={`${item.name}: ${money(item.value)}`}
                            />
                        ))}
                    </div>

                    {/* Unified Legend */}
                    <div className="flex flex-wrap gap-x-6 gap-y-3 pt-2">
                        {[...assets.items, ...liabilities.items].map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-xs font-bold text-foreground opacity-80">{item.name}</span>
                                <span className="text-[10px] font-bold tabular-nums text-muted-foreground">
                                    {Math.round((item.value / (assets.total + liabilities.total)) * 100)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content Column */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Balance Sheet Hierarchy */}
                    <Card className="overflow-hidden border-border/50 bg-background/90 p-0 shadow-lg rounded-2xl">
                        <div className="divide-y divide-border/50">
                            <BalanceSectionView
                                section={assets}
                                isExpanded={isAssetsExpanded}
                                onToggle={() => setIsAssetsExpanded(!isAssetsExpanded)}
                                symbol={currencySymbol}
                            />

                            <BalanceSectionView
                                section={liabilities}
                                isExpanded={isLiabilitiesExpanded}
                                onToggle={() => setIsLiabilitiesExpanded(!isLiabilitiesExpanded)}
                                symbol={currencySymbol}
                            />
                        </div>
                    </Card>

                    {/* Global Asset Analysis */}
                    <Card className="overflow-hidden border-border/40 rounded-2xl shadow-lg">
                        <div className="p-6 border-b border-border/40 flex justify-between items-center bg-muted/20">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={20} className="text-primary" />
                                <span className="font-bold text-lg uppercase tracking-tight">Active Holdings Analysis</span>
                            </div>
                            <span className="text-[10px] font-bold bg-muted px-3 py-1.5 rounded-lg uppercase tracking-wider text-muted-foreground">
                                {aggregatedHoldings.length} Positions
                            </span>
                        </div>
                        <DataTable
                            columns={holdingColumns}
                            data={aggregatedHoldings}
                            label="Active investment holdings"
                            emptyMessage="No active investment holdings found. Add an investment account with holdings to see analysis."
                        />
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Performance Summary Card */}
                    <Card className="p-6 space-y-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10 rounded-2xl shadow-md">
                        <div className="flex items-center gap-2">
                            <TrendingUp size={20} className="text-primary" />
                            <h4 className="font-bold text-sm uppercase tracking-wider text-primary/80">Investment Performance</h4>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Unrealized Profit/Loss</p>
                                <div className={cn(
                                    "text-2xl font-bold tabular-nums flex items-center gap-2",
                                    totalInvestmentProfit >= 0 ? "text-green-500" : "text-red-500"
                                )} title={money(Math.abs(totalInvestmentProfit))}>
                                    {totalInvestmentProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                    {compactMoney(Math.abs(totalInvestmentProfit))}
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Portfolio Allocation %</p>
                                <div className="space-y-4 pt-2">
                                    {aggregatedHoldings.slice(0, 5).map((holding) => {
                                        const weight = totalInvestmentValue > 0 ? (holding.totalValue / totalInvestmentValue) * 100 : 0;
                                        return (
                                            <div key={holding.symbol} className="space-y-1">
                                                <div className="flex justify-between items-end">
                                                    <span className="text-[10px] font-bold text-foreground">{holding.symbol}</span>
                                                    <span className="text-[10px] font-bold text-muted-foreground tabular-nums">{weight.toFixed(1)}%</span>
                                                </div>
                                                <div className="h-1 w-full bg-muted/40 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${weight}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Quick Insight Card */}
                    <Card className="p-6 border-border/40 rounded-2xl bg-muted/5 shadow-sm">
                        <CardTitle className="text-sm font-bold flex items-center gap-2 mb-4">
                            <PieChart size={16} className="text-muted-foreground" />
                            Macro Summary
                        </CardTitle>
                        <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                            <p>
                                Assets account for <span className="text-foreground font-bold">{assets.total + liabilities.total > 0 ? Math.round((assets.total / (assets.total + liabilities.total)) * 100) : 0}%</span> of your gross balance.
                                Your debt ratio is <span className="text-foreground font-bold">{assets.total > 0 ? Math.round((liabilities.total / assets.total) * 100) : 0}%</span> relative to your assets.
                            </p>
                            <p>
                                {totalInvestmentProfit >= 0 ? 'Your market positions are performing well with ' : 'Market conditions have decreased your asset value by '}
                                <span className={cn("font-bold font-mono", totalInvestmentProfit >= 0 ? "text-green-500" : "text-red-500")}>
                                    {totalInvestmentValue > 0 ? Math.abs(totalInvestmentProfit / totalInvestmentValue * 100).toFixed(1) : 0}%
                                </span>
                                overall.
                            </p>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
