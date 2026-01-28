import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api';
import type { Transaction } from '../types';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import ConfirmModal from '../components/ConfirmModal';
import { useAccounts } from '../hooks/useAccounts';
import { useTransactions } from '../hooks/useTransactions';
import { useCurrencies } from '../hooks/useCurrencies';
import TransactionsPanel from '../components/TransactionsPanel';
import toast from 'react-hot-toast';

export default function AllTransactions() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

    // Confirm Modal State
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

    // State for filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('all');

    const { isLoading: isLoadingAccounts } = useAccounts();
    const {
        data: transactionsData,
        isLoading: isLoadingTransactions,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useTransactions({
        search: searchQuery,
        categoryId: selectedCategoryId
    });

    // Flatten transactions for display
    const transactions = transactionsData?.pages.flatMap(page => page.items) || [];

    const { data: currencies } = useCurrencies();

    // Fetch categories for filter
    const { data: categories } = useQuery<any[]>({
        queryKey: ['categories'],
        queryFn: async () => {
            const res = await api.get('/categories/');
            return res.data;
        }
    });

    const deleteTransactionMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/transactions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
        }
    });

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const onNewTransaction = () => {
        setEditingTransaction(null);
        setIsModalOpen(true);
    };

    const onEditTransaction = (tx: Transaction) => {
        setEditingTransaction(tx);
        setIsModalOpen(true);
    };

    const onDeleteTransactionConfirm = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction?',
            variant: 'danger',
            onConfirm: async () => {
                closeConfirmModal();
                const promise = deleteTransactionMutation.mutateAsync(id);
                await toast.promise(promise, {
                    loading: 'Deleting transaction...',
                    success: 'Transaction deleted',
                    error: 'Failed to delete transaction'
                });
            }
        });
    };

    if (isLoadingAccounts) {
        return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
    }

    return (
        <div className="max-w-5xl mx-auto p-6 md:p-10 space-y-8">
            <TransactionsPanel
                title="Financial Stream"
                description="Chronological view of all your movements"
                transactions={transactions}
                isLoading={isLoadingTransactions}
                // Pagination
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
                // Filters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedCategoryId={selectedCategoryId}
                onCategoryChange={setSelectedCategoryId}
                categories={categories || []}
                // Config
                currencies={currencies}
                showAccountName={true}
                onNew={onNewTransaction}
                onEdit={onEditTransaction}
                onDelete={onDeleteTransactionConfirm}
            />

            <Modal isOpen={isModalOpen} onClose={closeModal} title={editingTransaction ? "Edit Transaction" : "New Transaction"}>
                <TransactionForm
                    transactionToEdit={editingTransaction}
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
                isLoading={deleteTransactionMutation.isPending}
            />
        </div>
    );
}
