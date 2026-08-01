import { useState, useEffect } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';
import ErrorBanner from '../components/common/ErrorBanner';
import TransactionsPanel from '../components/transactions/TransactionsPanel';
import { toast } from 'sonner';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTransactions, deleteTransaction, setFilters } from '../store/slices/transactionsSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import type { RootState } from '../store';
import { useCreateFlow } from '../context/CreateFlowContext';

interface AllTransactionsProps {
    embedded?: boolean;
}

const AllTransactions = ({ embedded = false }: AllTransactionsProps) => {
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();


    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        variant?: 'danger' | 'primary';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        variant: 'primary'
    });

    const {
        items: transactions,
        loading: isLoadingTransactions,
        hasNextPage,
        loadingMore: isFetchingNextPage,
        error: transactionsError,
        filters: transactionFilters
    } = useAppSelector((state: RootState) => state.transactions);

    // Local input state so search can be debounced without lagging the field
    const [searchInput, setSearchInput] = useState(transactionFilters.search);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== transactionFilters.search) {
                dispatch(setFilters({ search: searchInput, page: 1 }));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput, transactionFilters.search, dispatch]);

    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);
    const { items: categories } = useAppSelector((state: RootState) => state.categories);

    useEffect(() => {
        dispatch(setFilters({ accountId: null, page: 1 }));
        dispatch(fetchAccounts());
        dispatch(fetchCurrencies());
        dispatch(fetchCategories());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchTransactions({
            ...transactionFilters,
            page: 1,
            append: false
        }));
    }, [dispatch, transactionFilters.search, transactionFilters.categoryId, transactionFilters.startDate, transactionFilters.endDate]);

    const handleSearchChange = (query: string) => {
        setSearchInput(query);
    };

    const handleCategoryChange = (catId: string) => {
        dispatch(setFilters({ categoryId: catId, page: 1 }));
    };

    const handleDateChange = (start: string, end: string) => {
        dispatch(setFilters({ startDate: start, endDate: end, page: 1 }));
    };

    const handleLoadMore = () => {
        if (!isFetchingNextPage && hasNextPage) {
            const nextPage = transactionFilters.page + 1;
            dispatch(setFilters({ page: nextPage }));
            dispatch(fetchTransactions({
                ...transactionFilters,
                page: nextPage,
                append: true
            }));
        }
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const onNewTransaction = () => {
        openCreate('transaction');
    };



    const onDeleteTransactionConfirm = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction?',
            variant: 'danger',
            onConfirm: async () => {
                closeConfirmModal();
                try {
                    await dispatch(deleteTransaction(id)).unwrap();
                    dispatch(fetchAccounts());
                    toast.success('Transaction deleted');
                } catch (err: any) {
                    toast.error(typeof err === 'string' ? err : 'Failed to delete transaction');
                }
            }
        });
    };


    return (
        <div className={embedded ? 'space-y-5' : 'page-shell'}>
            {transactionsError && (
                <ErrorBanner
                    message={transactionsError}
                    onRetry={() => dispatch(fetchTransactions({ ...transactionFilters, page: 1, append: false }))}
                />
            )}
            <TransactionsPanel
                title={embedded ? undefined : 'Activity'}
                description={embedded ? undefined : 'Chronological view of your transactions'}
                transactions={transactions}
                isLoading={isLoadingTransactions}
                onLoadMore={handleLoadMore}
                hasMore={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                searchQuery={searchInput}
                onSearchChange={handleSearchChange}
                selectedCategoryId={transactionFilters.categoryId}
                onCategoryChange={handleCategoryChange}
                startDate={transactionFilters.startDate}
                endDate={transactionFilters.endDate}
                onDateChange={handleDateChange}
                categories={categories}
                currencies={currencies}
                showAccountName={true}
                onNew={onNewTransaction}
                onDelete={onDeleteTransactionConfirm}
                stickyToolbar
            />

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
            />
        </div>
    );
}

export default AllTransactions;
