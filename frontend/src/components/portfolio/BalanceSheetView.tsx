import { useState, memo } from 'react';
import { ChevronDown, ChevronRight, CircleSlash, ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { formatCurrency } from '../../lib/format';
import { useCurrencyFormat } from '../../hooks/useCurrencyFormat';

export interface SubHolding {
    id: string;
    name: string;
    symbol: string;
    value: number;
    weight: number;
}

export interface SubAccount {
    id: string;
    name: string;
    value: number;
    weight: number;
    holdings: SubHolding[];
}

export interface BalanceItem {
    id: string;
    name: string;
    value: number;
    weight: number;
    color: string;
    type: string;
    icon: React.ReactNode;
    accounts: SubAccount[];
}

export interface BalanceSection {
    title: string;
    total: number;
    items: BalanceItem[];
}

const HoldingRow = memo(({ h }: { h: SubHolding }) => {
    const { number } = useCurrencyFormat();

    return (
        <div className="grid grid-cols-12 p-1.5 px-4 items-center border-l border-primary/10 ml-4 group/h">
            <div className="col-span-8 flex items-center gap-2">
                <ArrowUpRight size={10} className="text-primary/40 group-hover/h:text-primary transition-colors" />
                <span className="text-[10px] font-bold text-primary tracking-wider">{h.symbol}</span>
                <span className="text-[9px] font-medium text-muted-foreground/40 truncate hidden sm:inline">{h.name}</span>
            </div>
            <div className="col-span-4 text-right">
                <span className="text-[10px] font-bold text-muted-foreground/70 tabular-nums" title={number(h.value, { decimals: 2 })}>
                    {number(h.value, { compact: true, decimals: 2 })}
                </span>
            </div>
        </div>
    );
});

const AccountRow = memo(({ acc }: { acc: SubAccount }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const { number } = useCurrencyFormat();
    const hasHoldings = acc.holdings.length > 0;

    return (
        <div key={acc.id}>
            <div
                className={cn(
                    "grid grid-cols-12 p-3 px-8 md:px-12 items-center hover:bg-accent/10 transition-colors group/acc",
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
                    <Link
                        to={`/accounts/${acc.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="group/link inline-flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                        title={`Open ${acc.name}`}
                        aria-label={`Open account ${acc.name}`}
                    >
                        <span className="truncate group-hover/link:underline">{acc.name}</span>
                        <ArrowUpRight size={12} className="shrink-0 opacity-50 transition-opacity group-hover/link:opacity-100" />
                    </Link>
                </div>
                <div className="col-span-6 md:col-span-5 text-right">
                    <span className="text-xs font-medium text-muted-foreground/80 tabular-nums" title={number(acc.value, { decimals: 2 })}>
                        {number(acc.value, { compact: true, decimals: 2 })}
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
    const { number } = useCurrencyFormat();

    return (
        <div key={item.id}>
            <div
                className={cn(
                    "grid grid-cols-12 p-4 items-center hover:bg-accent/30 transition-colors cursor-pointer group",
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
                    <span className="text-sm font-bold text-foreground tabular-nums" title={number(item.value, { decimals: 2 })}>
                        {number(item.value, { compact: true })}
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

export const BalanceSectionView = memo(({ section, isExpanded, onToggle, symbol }: {
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
                    <span className="text-xs font-bold text-muted-foreground tabular-nums opacity-60" title={formatCurrency(section.total, { symbol, decimals: 2 })}>
                        {formatCurrency(section.total, { symbol, compact: true })}
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
