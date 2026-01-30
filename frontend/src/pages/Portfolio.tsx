import { useState, useMemo, memo, useEffect } from 'react';
import type { Account } from '../types';
import {
    ChevronDown,
    ChevronRight,
    PieChart,
    TrendingUp,
    TrendingDown,
    Wallet,
    Building2,
    Loader2,
    CircleSlash,
    ArrowUpRight,
    LayoutGrid,
    BarChart3
} from 'lucide-react';
import { Card, CardTitle } from '../components/ui/Card';
import { cn } from '../lib/utils';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchRates } from '../store/slices/converterSlice';
import type { RootState } from '../store';

// --- Types for Balance Sheet View ---
interface SubHolding {
    id: string;
    name: string;
    symbol: string;
    value: number;
    weight: number;
}

interface SubAccount {
    id: string;
    name: string;
    value: number;
    weight: number;
    holdings: SubHolding[];
}

interface BalanceItem {
    id: string;
    name: string;
    value: number;
    weight: number;
    color: string;
    type: string;
    icon: React.ReactNode;
    accounts: SubAccount[];
}

interface BalanceSection {
    title: string;
    total: number;
    items: BalanceItem[];
}

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

    useEffect(() => {
        dispatch(fetchAccounts());
        dispatch(fetchSettings());
        dispatch(fetchCurrencies());
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
            'Savings': { total: 0, accounts: [], color: '#8b5cf6', icon: <Wallet size={16} /> },
            'Fixed Deposit': { total: 0, accounts: [], color: '#06b6d4', icon: <Building2 size={16} /> },
            'Investment': { total: 0, accounts: [], color: '#3b82f6', icon: <TrendingUp size={16} /> },
        };

        const liabilityItems: Record<string, { total: number, accounts: Account[], color: string, icon: React.ReactNode }> = {
            'Loan': { total: 0, accounts: [], color: '#f43f5e', icon: <TrendingDown size={16} /> },
        };

        accounts.forEach(account => {
            let balance = 0;
            if (account.account_type === 'Savings' && account.savings_account) {
                balance = Number(account.savings_account.balance);
            } else if (account.account_type === 'Fixed Deposit' && account.fixed_deposit_account) {
                balance = Number(account.fixed_deposit_account.principal_amount);
            } else if (account.account_type === 'Investment' && account.investment_holdings) {
                balance = account.investment_holdings.reduce((sum, h) => sum + (Number(h.quantity) * (Number(h.current_price) || Number(h.average_price))), 0);
            } else if (account.account_type === 'Loan' && account.loan_account) {
                balance = Number(account.loan_account.outstanding_amount);
            }

            const convertedValue = convert(balance, account.currency);

            if (account.account_type === 'Loan') {
                liabilityItems['Loan'].total += convertedValue;
                liabilityItems['Loan'].accounts.push(account);
            } else if (assetItems[account.account_type]) {
                assetItems[account.account_type].total += convertedValue;
                assetItems[account.account_type].accounts.push(account);
            }
        });

        const assetTotal = Object.values(assetItems).reduce((sum, item) => sum + item.total, 0);
        const liabilityTotal = Object.values(liabilityItems).reduce((sum, item) => sum + item.total, 0);

        const mapToBalanceItem = (name: string, item: { total: number, accounts: Account[], color: string, icon: React.ReactNode }, totalValue: number, type: string): BalanceItem => {
            const subAccounts = item.accounts.map(acc => {
                let bal = 0;
                let hds: SubHolding[] = [];

                if (acc.account_type === 'Savings' && acc.savings_account) bal = Number(acc.savings_account.balance);
                else if (acc.account_type === 'Fixed Deposit' && acc.fixed_deposit_account) bal = Number(acc.fixed_deposit_account.principal_amount);
                else if (acc.account_type === 'Investment' && acc.investment_holdings) {
                    bal = acc.investment_holdings.reduce((sum, h) => sum + (Number(h.quantity) * (Number(h.current_price) || Number(h.average_price))), 0);
                    const accountTotalVal = bal;
                    hds = acc.investment_holdings.map(h => {
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
                else if (acc.account_type === 'Loan' && acc.loan_account) bal = Number(acc.loan_account.outstanding_amount);

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
                name,
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
                .filter(([_, item]) => item.total > 0)
                .map(([name, item]) => mapToBalanceItem(name, item, assetTotal, 'asset'))
                .sort((a, b) => b.value - a.value)
        };

        const finalizedLiabilities: BalanceSection = {
            title: 'Liabilities',
            total: liabilityTotal,
            items: Object.entries(liabilityItems)
                .filter(([_, item]) => item.total > 0)
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

        accounts.forEach(account => {
            if (account.investment_holdings) {
                account.investment_holdings.forEach(holding => {
                    const currentPrice = holding.current_price || holding.average_price;
                    const valueInOriginalCurrency = holding.quantity * currentPrice;
                    const costInOriginalCurrency = holding.quantity * holding.average_price;

                    const valueInLocal = convert(valueInOriginalCurrency, holding.currency);
                    const costInLocal = convert(costInOriginalCurrency, holding.currency);

                    const existing = holdingsMap.get(holding.symbol);
                    if (existing) {
                        existing.totalQuantity += holding.quantity;
                        existing.totalValue += valueInLocal;
                        existing.totalCost += costInLocal;
                        existing.profit = existing.totalValue - existing.totalCost;
                        existing.profitPercent = (existing.profit / existing.totalCost) * 100;
                    } else {
                        holdingsMap.set(holding.symbol, {
                            symbol: holding.symbol,
                            name: holding.name,
                            totalQuantity: holding.quantity,
                            averagePrice: holding.average_price,
                            currentPrice: currentPrice,
                            totalValue: valueInLocal,
                            totalCost: costInLocal,
                            profit: valueInLocal - costInLocal,
                            profitPercent: costInLocal > 0 ? ((valueInLocal - costInLocal) / costInLocal) * 100 : 0,
                            currency: holding.currency
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

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            {/* Standard Header - matching Dashboard styling */}
            <Card className="p-6 backdrop-blur-xl bg-background/60 shadow-none border-border/50">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground">Portfolio</CardTitle>
                        <p className="text-muted-foreground text-sm mt-1">Real-time breakdown of your financial position</p>
                    </div>

                    <div className="text-right">
                        <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold mb-1 opacity-70">Total Net Worth</p>
                        <div className="text-3xl font-bold text-foreground tabular-nums tracking-tight">
                            {currencySymbol}{netWorth.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Allocation Overview Bar */}
            <Card className="p-6 md:p-8 space-y-6 bg-background/40 backdrop-blur-md">
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
                                title={`${item.name}: ${item.value.toLocaleString()}`}
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
                    <Card className="overflow-hidden border-border/50 bg-background/50 backdrop-blur-xl p-0 shadow-lg rounded-2xl">
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-muted/5">
                                        <th className="px-8 py-4">Symbol</th>
                                        <th className="px-6 py-4 text-right">Qty</th>
                                        <th className="px-6 py-4 text-right">Value ({currencySymbol})</th>
                                        <th className="px-6 py-4 text-right">P/L %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/20">
                                    {aggregatedHoldings.map((holding) => (
                                        <tr key={holding.symbol} className="hover:bg-accent/20 transition-colors group">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{holding.symbol}</span>
                                                    <span className="text-[10px] text-muted-foreground/60 truncate max-w-[120px]">{holding.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums font-medium text-xs">
                                                {holding.totalQuantity.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-5 text-right tabular-nums font-bold text-sm text-foreground">
                                                {holding.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-6 py-5 text-right">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1 font-bold text-[10px] px-2 py-0.5 rounded-md",
                                                    holding.profit >= 0 ? "text-green-500 bg-green-500/10" : "text-red-500 bg-green-500/10"
                                                )}>
                                                    {holding.profitPercent.toFixed(1)}%
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {aggregatedHoldings.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-8 py-12 text-center text-muted-foreground italic text-sm bg-muted/5">
                                                No active investment holdings found. Add an investment account with holdings to see analysis.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
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
                                )}>
                                    {totalInvestmentProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                    {currencySymbol}{Math.abs(totalInvestmentProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

// --- Internal View Components ---

const HoldingRow = memo(({ h }: { h: SubHolding }) => (
    <div className="grid grid-cols-12 p-1.5 px-4 items-center border-l border-primary/10 ml-4 group/h">
        <div className="col-span-8 flex items-center gap-2">
            <ArrowUpRight size={10} className="text-primary/40 group-hover/h:text-primary transition-colors" />
            <span className="text-[10px] font-bold text-primary tracking-wider">{h.symbol}</span>
            <span className="text-[9px] font-medium text-muted-foreground/40 truncate hidden sm:inline">{h.name}</span>
        </div>
        <div className="col-span-4 text-right">
            <span className="text-[10px] font-bold text-muted-foreground/70 tabular-nums">
                {h.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
        </div>
    </div>
));

const AccountRow = memo(({ acc }: { acc: SubAccount }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const hasHoldings = acc.holdings.length > 0;

    return (
        <div key={acc.id}>
            <div
                className={cn(
                    "grid grid-cols-12 p-3 px-8 md:px-12 items-center hover:bg-accent/10 transition-all group/acc",
                    hasHoldings ? "cursor-pointer" : "cursor-default"
                )}
                onClick={(e) => {
                    if (hasHoldings) {
                        e.stopPropagation();
                        setIsExpanded(!isExpanded);
                    }
                }}
            >
                <div className="col-span-1 flex justify-center">
                    {hasHoldings ? (
                        <div className={cn(
                            "text-muted-foreground/30 transition-transform duration-300",
                            isExpanded ? "rotate-90 text-primary" : ""
                        )}>
                            <ChevronRight size={14} />
                        </div>
                    ) : (
                        <CircleSlash size={10} className="text-muted-foreground/10" />
                    )}
                </div>
                <div className="col-span-5 md:col-span-6 flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground group-hover/acc:text-foreground transition-colors">{acc.name}</span>
                </div>
                <div className="col-span-6 md:col-span-5 text-right">
                    <span className="text-xs font-medium text-muted-foreground/80 tabular-nums">
                        {acc.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {isExpanded && hasHoldings && (
                <div className="bg-primary/[0.02] py-2 px-12 md:px-20 animate-in fade-in slide-in-from-left-2 duration-300">
                    {acc.holdings.map((h) => (
                        <HoldingRow key={h.id} h={h} />
                    ))}
                </div>
            )}
        </div>
    );
});

const CategoryRow = memo(({ item }: { item: BalanceItem }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div key={item.id}>
            <div
                className={cn(
                    "grid grid-cols-12 p-4 items-center hover:bg-accent/30 transition-all cursor-pointer group",
                    isExpanded && "bg-accent/10"
                )}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                }}
            >
                <div className="col-span-1 flex justify-center">
                    <div className={cn(
                        "text-muted-foreground transition-transform duration-300",
                        isExpanded ? "rotate-0 text-primary" : "-rotate-90"
                    )}>
                        <ChevronDown size={16} />
                    </div>
                </div>
                <div className="col-span-6 md:col-span-7 flex items-center gap-3">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}15`, color: item.color }}
                    >
                        {item.icon}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">{item.name}</span>
                        <span className="text-[10px] font-medium text-muted-foreground/50">{item.accounts.length} accounts</span>
                    </div>
                </div>
                <div className="col-span-5 md:col-span-4 text-right">
                    <span className="text-sm font-bold text-foreground tabular-nums">
                        {item.value.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-muted/5 divide-y divide-border/5 animate-in slide-in-from-top-1 duration-300">
                    {item.accounts.map((acc) => (
                        <AccountRow key={acc.id} acc={acc} />
                    ))}
                </div>
            )}
        </div>
    );
});

const BalanceSectionView = memo(({ section, isExpanded, onToggle, symbol }: {
    section: BalanceSection,
    isExpanded: boolean,
    onToggle: () => void,
    symbol: string
}) => {
    return (
        <div className="p-4 md:p-6">
            <div
                className="flex items-center gap-4 cursor-pointer group mb-6 md:mb-8"
                onClick={onToggle}
            >
                <div className={cn(
                    "transition-transform duration-300",
                    isExpanded ? "rotate-0 text-primary" : "-rotate-90 text-muted-foreground"
                )}>
                    <ChevronDown size={20} />
                </div>
                <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-3">
                    {section.title}
                    <span className="text-xs font-bold text-muted-foreground tabular-nums opacity-60">
                        {symbol}{section.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                </h2>
            </div>

            {isExpanded && (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-muted/10 rounded-xl border border-border/30 overflow-hidden">
                        <div className="grid grid-cols-12 p-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border/20 bg-muted/10">
                            <div className="col-span-1"></div>
                            <div className="col-span-6 md:col-span-7">Category</div>
                            <div className="col-span-5 md:col-span-4 text-right">Value ({symbol})</div>
                        </div>

                        <div className="divide-y divide-border/10">
                            {section.items.map((item) => (
                                <CategoryRow key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
