import { memo, useMemo } from 'react';
import type { Transaction, Currency } from '../../../types';
import LoadingSpinner from '../../common/LoadingSpinner';
import TransactionRow from '../../transactions/TransactionRow';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { EmptyState } from '../../ui/EmptyState';
import { ReceiptText } from 'lucide-react';

interface AccountTransactionsProps {
    transactions: Transaction[] | undefined;
    isLoading: boolean;
    symbol?: string;
    currencies?: Currency[];

    onDelete?: (id: number) => void;
    onEdit?: (tx: Transaction) => void;
    showAccountName?: boolean;
}

const AccountTransactions = memo(({
    transactions,
    isLoading,
    symbol,
    currencies,

    onDelete,
    onEdit,
    showAccountName = false
}: AccountTransactionsProps) => {
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    const accountsMap = useMemo(() => {
        const nameMap = new Map<string, string>();
        const typeMap = new Map<string, string>();
        accounts.forEach(a => {
            if (a.account_id) {
                nameMap.set(a.account_id, a.account_name || 'Unknown Account');
                typeMap.set(a.account_id, a.account_type);
            }
        });
        return { nameMap, typeMap };
    }, [accounts]);

    const getCurrencySymbol = (tx: Transaction) => {
        if (currencies) {
            return currencies.find(c => c.code === tx.currency)?.symbol || tx.currency || '$';
        }
        return symbol || '$';
    };

    const groupedTransactions = useMemo(() => {
        const groups = new Map<string, Transaction[]>();
        (transactions || []).forEach((transaction) => {
            const key = transaction.transaction_date.slice(0, 10);
            groups.set(key, [...(groups.get(key) || []), transaction]);
        });
        return Array.from(groups.entries());
    }, [transactions]);

    const formatGroupDate = (dateValue: string) => {
        const date = new Date(`${dateValue}T00:00:00`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const offset = Math.round((today.getTime() - date.getTime()) / 86_400_000);
        if (offset === 0) return 'Today';
        if (offset === 1) return 'Yesterday';
        return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    };

    return (
        <>
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div>
                    {groupedTransactions.map(([date, dateTransactions]) => (
                        <section key={date} aria-labelledby={`transactions-${date}`}>
                            <h3 id={`transactions-${date}`} className="sticky top-16 z-20 border-y border-border bg-muted/95 px-4 py-2 text-xs font-semibold text-muted-foreground backdrop-blur-md sm:px-5 lg:top-[4.125rem]">
                                {formatGroupDate(date)}
                            </h3>
                            <div className="divide-y divide-border/50">
                                {dateTransactions.map((tx: Transaction) => (
                                    <TransactionRow
                                        key={tx.transaction_id}
                                        tx={tx}
                                        accountName={showAccountName ? accountsMap.nameMap.get(tx.account_id) : undefined}
                                        accountType={accountsMap.typeMap.get(tx.account_id)}
                                        currencySymbol={getCurrencySymbol(tx)}
                                        onDelete={onDelete}
                                        onEdit={onEdit}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                    {transactions?.length === 0 && (
                        <EmptyState icon={<ReceiptText className="h-5 w-5" />} title="No transactions found" description="Try adjusting your filters or add a new transaction." />
                    )}
                </div>
            )}
        </>
    );
});

AccountTransactions.displayName = 'AccountTransactions';

export default AccountTransactions;
