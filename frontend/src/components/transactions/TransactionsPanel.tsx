import { useState } from 'react';
import { CalendarDays, Plus, Search, X } from 'lucide-react';
import type { Transaction, Currency, Category } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { PageToolbar } from '../ui/PageToolbar';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/Select';
import { getCurrentMonthRange } from '../../lib/utils';
import AccountTransactions from '../account/common/AccountTransactions';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import EditTransactionForm from './EditTransactionForm';

interface TransactionsPanelProps {
    transactions: Transaction[];
    isLoading: boolean;
    onLoadMore?: () => void;
    hasMore?: boolean;
    isFetchingNextPage?: boolean;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    selectedCategoryId: string;
    onCategoryChange: (categoryId: string) => void;
    startDate?: string;
    endDate?: string;
    onDateChange?: (start: string, end: string) => void;
    categories: Category[];
    currencies?: Currency[];
    defaultCurrencySymbol?: string;
    onDelete?: (id: number) => void;
    onNew?: () => void;
    showAccountName?: boolean;
    title?: string;
    description?: string;
    stickyToolbar?: boolean;
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
    onDelete,
    onNew,
    showAccountName = false,
    title,
    description,
    stickyToolbar = false,
}: TransactionsPanelProps) {
    const [editingTx, setEditingTx] = useState<Transaction | null>(null);
    const currentMonth = getCurrentMonthRange();
    const isCurrentMonth = startDate === currentMonth.start && endDate === currentMonth.end;
    const selectedCategory = categories.find((category) => category.category_id.toString() === selectedCategoryId);
    const hasCustomDates = Boolean((startDate || endDate) && !isCurrentMonth);

    return (
        <div className="space-y-4">
            {(title || description) && (
                <div>
                    {title && <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>}
                    {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
                </div>
            )}

            <PageToolbar sticky={stickyToolbar} label="Transaction filters">
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                    <div className="min-w-0 flex-1 xl:max-w-sm">
                        <Input
                            type="search"
                            placeholder="Search transactions"
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            leadingIcon={<Search />}
                            aria-label="Search transactions"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:flex xl:items-center">
                        <div className="min-w-44">
                            <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
                                <SelectTrigger aria-label="Transaction category">
                                    <SelectValue placeholder="All categories" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All categories</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {onDateChange && (
                            <>
                                <Input
                                    type="date"
                                    value={startDate || ''}
                                    onChange={(event) => onDateChange(event.target.value, endDate || '')}
                                    aria-label="Activity start date"
                                    containerClassName="xl:w-40"
                                />
                                <Input
                                    type="date"
                                    value={endDate || ''}
                                    onChange={(event) => onDateChange(startDate || '', event.target.value)}
                                    aria-label="Activity end date"
                                    containerClassName="xl:w-40"
                                />
                                <Button
                                    type="button"
                                    variant={isCurrentMonth ? 'secondary' : 'outline'}
                                    onClick={() => onDateChange(currentMonth.start, currentMonth.end)}
                                >
                                    <CalendarDays /> This month
                                </Button>
                            </>
                        )}

                        {onNew && (
                            <Button type="button" onClick={onNew}>
                                <Plus /> New transaction
                            </Button>
                        )}
                    </div>
                </div>

                {(selectedCategory || hasCustomDates) && (
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                        <span className="text-xs font-medium text-muted-foreground">Active filters:</span>
                        {selectedCategory && (
                            <Button variant="secondary" size="sm" onClick={() => onCategoryChange('all')}>
                                {selectedCategory.name}<X />
                            </Button>
                        )}
                        {hasCustomDates && onDateChange && (
                            <Button variant="secondary" size="sm" onClick={() => onDateChange('', '')}>
                                {startDate || 'Any date'} – {endDate || 'Present'}<X />
                            </Button>
                        )}
                    </div>
                )}
            </PageToolbar>

            <Card className="overflow-visible">
                <div className="min-h-[300px] divide-y divide-border">
                    <AccountTransactions
                        transactions={transactions}
                        isLoading={isLoading}
                        symbol={defaultCurrencySymbol}
                        currencies={currencies}
                        showAccountName={showAccountName}
                        onDelete={onDelete}
                        onEdit={setEditingTx}
                    />

                    {hasMore && (
                        <div className="flex justify-center p-4">
                            <Button variant="outline" onClick={onLoadMore} disabled={isFetchingNextPage}>
                                {isFetchingNextPage
                                    ? <span className="flex items-center gap-2"><LoadingSpinner size="small" />Loading…</span>
                                    : 'Load more'}
                            </Button>
                        </div>
                    )}
                </div>
            </Card>

            <Modal
                isOpen={Boolean(editingTx)}
                onClose={() => setEditingTx(null)}
                title="Edit transaction"
                description="Update the transaction details or category."
            >
                {editingTx && (
                    <EditTransactionForm
                        transaction={editingTx}
                        onSuccess={() => setEditingTx(null)}
                        onCancel={() => setEditingTx(null)}
                    />
                )}
            </Modal>
        </div>
    );
}
