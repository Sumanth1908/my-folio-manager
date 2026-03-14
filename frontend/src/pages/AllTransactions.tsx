import { useState, useEffect } from 'react';
import type {  } from '../types';
import Modal from '../components/common/Modal';
import CreateTransactionForm from '../components/transactions/CreateTransactionForm';

import ConfirmModal from '../components/common/ConfirmModal';
import TransactionsPanel from '../components/transactions/TransactionsPanel';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTransactions, deleteTransaction, setFilters } from '../store/slices/transactionsSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import type { RootState } from '../store';

const AllTransactions = () => {
    const dispatch = useAppDispatch();
    const isModalOpen = useAppSelector((state: RootState) => state.ui.modals['transactionAction']);


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
        filters: transactionFilters
    } = useAppSelector((state: RootState) => state.transactions);

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
        dispatch(setFilters({ search: query, page: 1 }));
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

    const closeModal = () => {
        dispatch(closeReduxModal('transactionAction'));
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const onNewTransaction = () => {
        dispatch(openModal('transactionAction'));
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
                    toast.success('Transaction deleted');
                } catch {
                    toast.error('Failed to delete transaction');
                }
            }
        });
    };


    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <TransactionsPanel
                title="Financial Stream"
                description="Chronological view of all your movements"
                transactions={transactions}
                isLoading={isLoadingTransactions}
                onLoadMore={handleLoadMore}
                hasMore={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                searchQuery={transactionFilters.search}
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
            />

            <Modal isOpen={isModalOpen} onClose={closeModal} title="New Transaction">
                <CreateTransactionForm
                    onSuccess={closeModal}
                    onCancel={closeModal}
                />
            </Modal>

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
