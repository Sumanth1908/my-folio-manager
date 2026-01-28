import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import api from '../api';
import type { Transaction, Rule } from '../types';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import RuleForm from '../components/RuleForm';
import { useTransactions } from '../hooks/useTransactions';
import LoadingSpinner from '../components/LoadingSpinner';
import ConfirmModal from '../components/ConfirmModal';
import { useCurrencies } from '../hooks/useCurrencies';
import AccountInfoCard from '../components/account/AccountInfoCard';
import AccountActivityPanel from '../components/account/AccountActivityPanel';
import AccountTypeDetails from '../components/account/AccountTypeDetails';
import AccountEditForm from '../components/account/AccountEditForm';
import { Button } from '../components/ui/Button';


// ... (inside the component)


export default function AccountDetails() {
    const { id } = useParams<{ id: string }>();
    const accountId = id || null;
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [modalType, setModalType] = useState<'transaction' | 'rule' | 'edit-account'>('transaction');
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

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

    const { data: account, isLoading: isAccountLoading, error: accountError } = useQuery({
        queryKey: ['account', accountId],
        queryFn: async () => {
            if (!accountId) return null;
            const res = await api.get(`/accounts/${accountId}`);
            return res.data;
        },
        enabled: !!accountId
    });

    const { data: currencies } = useCurrencies();

    const { data: rules, isLoading: isRulesLoading } = useQuery<Rule[]>({
        queryKey: ['rules', accountId],
        queryFn: async () => {
            if (!accountId) return [];
            const res = await api.get(`/rules/?account_id=${accountId}`);
            return res.data;
        },
        enabled: !!accountId
    });

    const {
        data: transactionsData,
        isLoading: isTransactionsLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useTransactions({ accountId });

    const deleteTransactionMutation = useMutation({
        mutationFn: async (id: number) => {
            await api.delete(`/transactions/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', accountId] });
            queryClient.invalidateQueries({ queryKey: ['transactions', 'all'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            queryClient.invalidateQueries({ queryKey: ['account', accountId] });
        }
    });

    const deleteAccountMutation = useMutation({
        mutationFn: async () => {
            if (!accountId) return;
            await api.delete(`/accounts/${accountId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            navigate('/accounts');
        }
    });

    const executeRuleMutation = useMutation({
        mutationFn: async (ruleId: number) => {
            await api.post(`/rules/${ruleId}/execute`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', accountId] });
            queryClient.invalidateQueries({ queryKey: ['transactions', accountId] });
            queryClient.invalidateQueries({ queryKey: ['transactions', 'all'] });
            queryClient.invalidateQueries({ queryKey: ['accounts'] });
            queryClient.invalidateQueries({ queryKey: ['accountSummary'] });
            queryClient.invalidateQueries({ queryKey: ['account', accountId] });
            toast.success('Rule executed successfully');
        },
        onError: (err) => {
            console.error("Failed to execute rule:", err);
            toast.error('Failed to execute rule');
        }
    });

    const deleteRuleMutation = useMutation({
        mutationFn: async (ruleId: number) => {
            await api.delete(`/rules/${ruleId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', accountId] });
            toast.success('Rule deleted');
            closeConfirmModal();
        },
        onError: () => toast.error('Failed to delete rule')
    });

    const toggleRuleMutation = useMutation({
        mutationFn: async (rule: Rule) => {
            await api.put(`/rules/${rule.rule_id}`, { is_active: !rule.is_active });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rules', accountId] });
            toast.success('Rule updated');
        },
        onError: () => toast.error('Failed to update rule')
    });

    const transactions = transactionsData?.pages.flatMap(page => page.items) || [];

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTransaction(null);
        setEditingRule(null);
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const startEditing = (tx: Transaction) => {
        setEditingTransaction(tx);
        setModalType('transaction');
        setIsModalOpen(true);
    };

    const handleDeleteAccount = async () => {
        closeConfirmModal();
        const promise = deleteAccountMutation.mutateAsync();
        await toast.promise(promise, {
            loading: 'Deleting account...',
            success: 'Account deleted successfully',
            error: 'Failed to delete account'
        });
    };

    const handleDeleteTransaction = async (id: number) => {
        closeConfirmModal();
        const promise = deleteTransactionMutation.mutateAsync(id);
        await toast.promise(promise, {
            loading: 'Deleting transaction...',
            success: 'Transaction deleted',
            error: 'Failed to delete transaction'
        });
    };

    const handleDeleteAccountConfirm = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Account',
            message: 'Are you sure you want to delete this account? This will also delete ALL associated transactions.',
            variant: 'danger',
            onConfirm: handleDeleteAccount
        });
    };

    const handleDeleteTransactionConfirm = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction?',
            variant: 'danger',
            onConfirm: () => handleDeleteTransaction(id)
        });
    };

    const handleDeleteRuleConfirm = (id: number) => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Rule',
            message: 'Are you sure you want to delete this rule?',
            variant: 'danger',
            onConfirm: () => handleDeleteRule(id)
        });
    };

    const handleDeleteRule = async (id: number) => {
        closeConfirmModal();
        const promise = deleteRuleMutation.mutateAsync(id);
        await toast.promise(promise, {
            loading: 'Deleting rule...',
            success: 'Rule deleted',
            error: 'Failed to delete rule'
        });
    };

    const handleExecuteRule = async (ruleId: number) => {
        const promise = executeRuleMutation.mutateAsync(ruleId);
        await toast.promise(promise, {
            loading: 'Executing rule...',
            success: 'Rule executed successfully',
            error: (err: any) => err.response?.data?.detail || 'Failed to execute rule'
        });
    };

    const handleToggleRule = async (rule: Rule) => {
        const promise = toggleRuleMutation.mutateAsync(rule);
        await toast.promise(promise, {
            loading: rule.is_active ? 'Disabling rule...' : 'Enabling rule...',
            success: 'Rule updated',
            error: 'Failed to update rule'
        });
    };

    const startEditingRule = (rule: Rule) => {
        setEditingRule(rule);
        setModalType('rule');
        setIsModalOpen(true);
    };

    const getBalance = () => {
        if (!transactions) return 0;
        return transactions.reduce((balance: number, tx: Transaction) => {
            return tx.transaction_type === 'Credit' ? balance + tx.amount : balance - tx.amount;
        }, 0);
    };

    const getCurrencySymbol = () => {
        if (!account || !currencies) return '$';
        return currencies.find(c => c.code === account.currency)?.symbol || '$';
    };

    if (isAccountLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <LoadingSpinner size="large" />
                <p className="mt-4 text-gray-500">Loading account details...</p>
            </div>
        );
    }

    if (accountError || !account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 bg-red-50 p-4 rounded-xl mb-4">
                    Account not found or failed to load.
                </div>
                <button
                    onClick={() => navigate('/accounts')}
                    className="text-blue-600 hover:underline flex items-center gap-2"
                >
                    <ArrowLeft size={16} /> Return to Accounts
                </button>
            </div>
        );
    }

    const balance = getBalance();
    const symbol = getCurrencySymbol();

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-6">
            <Button
                variant="ghost"
                onClick={() => navigate('/accounts')}
                className="text-muted-foreground hover:text-foreground -ml-2 gap-2"
            >
                <ArrowLeft size={18} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Back to Accounts</span>
            </Button>


            <AccountInfoCard
                account={account}
                balance={balance}
                currencies={currencies}
                onDelete={handleDeleteAccountConfirm}
                onEdit={() => {
                    setModalType('edit-account');
                    setIsModalOpen(true);
                }}
            />


            <AccountTypeDetails account={account} symbol={symbol} />

            <AccountActivityPanel
                transactions={transactions}
                rules={rules}
                isLoadingTransactions={isTransactionsLoading}
                isLoadingRules={isRulesLoading}
                symbol={symbol}
                onEditTransaction={startEditing}
                onDeleteTransaction={handleDeleteTransactionConfirm}
                onNewTransaction={() => {
                    setEditingTransaction(null);
                    setModalType('transaction');
                    setIsModalOpen(true);
                }}
                onExecuteRule={handleExecuteRule}
                onToggleRule={handleToggleRule}
                onEditRule={startEditingRule}
                onDeleteRule={handleDeleteRuleConfirm}
                onNewRule={() => {
                    setEditingTransaction(null);
                    setEditingRule(null);
                    setModalType('rule');
                    setIsModalOpen(true);
                }}
                isExecutingRule={executeRuleMutation.isPending}
                onLoadMore={fetchNextPage}
                hasMore={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
            />
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={
                    modalType === 'transaction'
                        ? (editingTransaction ? "Edit Transaction" : "New Transaction")
                        : modalType === 'rule'
                            ? "New Rule"
                            : "Edit Account Details"
                }
            >
                {modalType === 'transaction' ? (
                    <TransactionForm
                        accountId={accountId!}
                        transactionToEdit={editingTransaction}
                        onSuccess={closeModal}
                        onCancel={closeModal}
                    />
                ) : modalType === 'rule' ? (
                    <RuleForm
                        accountId={accountId!}
                        ruleToEdit={editingRule}
                        onSuccess={closeModal}
                        onCancel={closeModal}
                    />
                ) : (
                    <AccountEditForm
                        account={account}
                        onSuccess={closeModal}
                        onCancel={closeModal}
                    />
                )}
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                variant={confirmModal.variant}
                isLoading={deleteTransactionMutation.isPending || deleteAccountMutation.isPending || deleteRuleMutation.isPending}
            />
        </div>
    );
}
