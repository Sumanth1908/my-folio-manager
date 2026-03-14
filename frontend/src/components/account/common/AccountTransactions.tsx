import { memo, useMemo } from 'react';
import type { Transaction, Currency } from '../../../types';
import LoadingSpinner from '../../common/LoadingSpinner';
import TransactionRow from '../../transactions/TransactionRow';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';

interface AccountTransactionsProps {
    transactions: Transaction[] | undefined;
    isLoading: boolean;
    symbol?: string;
    currencies?: Currency[];

    onDelete?: (id: number) => void;
    showAccountName?: boolean;
}

const AccountTransactions = memo(({
    transactions,
    isLoading,
    symbol,
    currencies,

    onDelete,
    showAccountName = false
}: AccountTransactionsProps) => {
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    const accountsMap = useMemo(() => {
        const map = new Map<string, string>();
        accounts.forEach(a => {
            if (a.account_id) map.set(a.account_id, a.account_name || 'Unknown Account');
        });
        return map;
    }, [accounts]);

    const getCurrencySymbol = (tx: Transaction) => {
        if (currencies) {
            return currencies.find(c => c.code === tx.currency)?.symbol || tx.currency || '$';
        }
        return symbol || '$';
    };

    return (
        <>
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {transactions?.map((tx: Transaction) => (
                        <TransactionRow
                            key={tx.transaction_id}
                            tx={tx}
                            accountName={showAccountName ? accountsMap.get(tx.account_id) : undefined}
                            currencySymbol={getCurrencySymbol(tx)}

                            onDelete={onDelete}
                        />
                    ))}
                    {transactions?.length === 0 && (
                        <div className="text-center py-24">
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No transactions found</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1 lowercase italic">Try adjusting your filters</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
});

AccountTransactions.displayName = 'AccountTransactions';

export default AccountTransactions;

