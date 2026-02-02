import { useState } from 'react';
import { Plus, Search, Filter, X } from 'lucide-react';
import type { Transaction, Currency, Category } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { cn } from '../../lib/utils';
import AccountTransactions from '../account/common/AccountTransactions';
import LoadingSpinner from '../common/LoadingSpinner';

interface TransactionsPanelProps {
    transactions: Transaction[];
    isLoading: boolean;
    // Pagination
    onLoadMore?: () => void;
    hasMore?: boolean;
    isFetchingNextPage?: boolean;
    // Filters
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategoryId: string; // 'all' or categoryId
    onCategoryChange: (categoryId: string) => void;
    startDate?: string;
    endDate?: string;
    onDateChange?: (start: string, end: string) => void;
    categories: Category[];
    // Config
    currencies?: Currency[];
    defaultCurrencySymbol?: string;
    onEdit?: (tx: Transaction) => void;
    onDelete?: (id: number) => void;
    onNew?: () => void;
    showAccountName?: boolean;
    title?: string;
    description?: string;
}

export default function TransactionsPanel({
    transactions,
    isLoading,
    onLoadMore,
    hasMore,
    isFetchingNextPage,
    searchQuery,
    onSearchChange,
    selectedCategoryId,
    onCategoryChange,
    startDate,
    endDate,
    onDateChange,
    categories,
    currencies,
    defaultCurrencySymbol = '$',
    onEdit,
    onDelete,
    onNew,
    showAccountName = false,
    title,
    description
}: TransactionsPanelProps) {
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <Card className="bg-muted/30 border border-border overflow-hidden rounded-2xl">
            {/* Header Section */}
            <div className="p-6 md:p-8 space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    {/* Title */}
                    <div>
                        {title && <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>}
                        {description && <p className="text-sm text-muted-foreground">{description}</p>}
                    </div>

                    {/* Actions: Search & New */}
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className={cn(
                            "flex items-center bg-background border border-border/50 rounded-xl px-3 transition-[width,background-color] duration-300 overflow-hidden",
                            isSearchOpen ? "w-full md:w-64" : "w-10 h-10 md:w-11 md:h-11 justify-center p-0 hover:bg-muted/50"
                        )}>
                            <Search
                                size={18}
                                className={cn(
                                    "text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors",
                                    isSearchOpen ? "mr-2" : ""
                                )}
                                onClick={() => {
                                    if (!isSearchOpen) setIsSearchOpen(true);
                                }}
                            />
                            {isSearchOpen && (
                                <div className="flex items-center flex-1">
                                    <input
                                        type="text"
                                        placeholder="Search transactions..."
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="bg-transparent border-none outline-none text-sm w-full py-2.5 placeholder:text-muted-foreground/50"
                                        autoFocus
                                    />
                                    <button
                                        onClick={() => {
                                            if (searchQuery) onSearchChange('');
                                            else setIsSearchOpen(false);
                                        }}
                                        className="ml-2 text-muted-foreground hover:text-foreground"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {!isSearchOpen && (
                            <Button
                                onClick={() => isSearchOpen ? {} : setIsSearchOpen(true)}
                                variant="ghost"
                                size="icon"
                                className="md:hidden text-muted-foreground"
                            >
                                <Search size={20} />
                            </Button>
                        )}

                        {onNew && (
                            <Button
                                onClick={onNew}
                                className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 shadow-lg shadow-primary/20 shrink-0"
                                title="New Transaction"
                            >
                                <Plus size={20} className="md:w-6 md:h-6" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                {(categories && categories.length > 0 || onDateChange) && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                        <div className="flex items-center gap-2 pr-4 text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">
                            <Filter size={12} />
                            <span>Filter:</span>
                        </div>
                        <button
                            onClick={() => onCategoryChange('all')}
                            className={cn(
                                "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border",
                                selectedCategoryId === 'all'
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-background text-muted-foreground border-border hover:border-primary/50"
                            )}
                        >
                            All
                        </button>
                        {onDateChange && (
                            <div className="flex items-center gap-2 ml-2 border-l border-border/50 pl-4">
                                <input
                                    type="date"
                                    value={startDate || ''}
                                    onChange={(e) => onDateChange(e.target.value, endDate || '')}
                                    className="bg-background border border-border rounded-lg px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <span className="text-muted-foreground/50 text-[10px] font-bold">-</span>
                                <input
                                    type="date"
                                    value={endDate || ''}
                                    onChange={(e) => onDateChange(startDate || '', e.target.value)}
                                    className="bg-background border border-border rounded-lg px-2 py-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                        )}
                        {categories.map(cat => (
                            <button
                                key={cat.category_id}
                                onClick={() => onCategoryChange(cat.category_id.toString())}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border",
                                    selectedCategoryId === cat.category_id.toString()
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* List Content */}
            <div className="border-t border-border bg-background/30 min-h-[300px]">
                <AccountTransactions
                    transactions={transactions}
                    isLoading={isLoading}
                    symbol={defaultCurrencySymbol}
                    currencies={currencies}
                    showAccountName={showAccountName}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />

                {/* Load More Button */}
                {hasMore && (
                    <div className="p-4 flex justify-center border-t border-border/50">
                        <Button
                            variant="ghost"
                            onClick={onLoadMore}
                            disabled={isFetchingNextPage}
                            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                        >
                            {isFetchingNextPage ? <span className="flex items-center gap-2"><LoadingSpinner size="small" /> Loading...</span> : "Load More"}
                        </Button>
                    </div>
                )}
            </div>
        </Card>
    );
}
