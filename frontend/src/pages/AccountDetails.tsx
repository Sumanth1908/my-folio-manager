import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Transaction, Rule } from '../types';
import Modal from '../components/Modal';
import TransactionForm from '../components/TransactionForm';
import RuleForm from '../components/RuleForm';
import ConfirmModal from '../components/ConfirmModal';
import AccountInfoCard from '../components/account/AccountInfoCard';
import AccountActivityPanel from '../components/account/AccountActivityPanel';
import AccountTypeDetails from '../components/account/AccountTypeDetails';
import AccountEditForm from '../components/account/AccountEditForm';
import { Button } from '../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import { fetchTransactions, deleteTransaction } from '../store/slices/transactionsSlice';
import { fetchRules, deleteRule, executeRule, updateRule } from '../store/slices/rulesSlice';
import { fetchAccounts, deleteAccount } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';

export default function AccountDetails() {
    const { id: accountId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isModalOpen = useAppSelector((state: RootState) => state.ui.modals['accountAction']);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [modalType, setModalType] = useState<'transaction' | 'rule' | 'edit-account'>('transaction');
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    const {
        items: transactions,
        loading: isTransactionsLoading,
        loadingMore: isFetchingNextPage,
        hasNextPage
    } = useAppSelector((state: RootState) => state.transactions);
    const { items: rules, loading: isRulesLoading } = useAppSelector((state: RootState) => state.rules);
    const { items: accounts, loading: isAccountsLoading } = useAppSelector((state: RootState) => state.accounts);
    const { items: currencies } = useAppSelector((state: RootState) => state.currencies);

    const account = accounts?.find(a => a.account_id === accountId);

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

    useEffect(() => {
        if (accountId) {
            dispatch(fetchTransactions({ accountId }));
            dispatch(fetchRules(accountId));
            if (accounts.length === 0) {
                dispatch(fetchAccounts());
            }
            dispatch(fetchCurrencies());
            dispatch(fetchSettings());
        }
    }, [dispatch, accountId, accounts.length]);

    // Fetch rates when settings are loaded and default currency is available
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    useEffect(() => {
        if (settings?.default_currency) {
            dispatch(fetchRates(settings.default_currency));
        }
    }, [dispatch, settings?.default_currency]);

    const closeModal = () => {
        dispatch(closeReduxModal('accountAction'));
        setEditingTransaction(null);
        setEditingRule(null);
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
    };

    const startEditing = (tx: Transaction) => {
        setEditingTransaction(tx);
        setModalType('transaction');
        dispatch(openModal('accountAction'));
    };

    const handleDeleteAccount = async () => {
        if (!accountId) return;
        closeConfirmModal();
        try {
            await dispatch(deleteAccount(accountId)).unwrap();
            toast.success('Account deleted successfully');
            navigate('/accounts');
        } catch (error) {
            toast.error('Failed to delete account');
        }
    };

    const handleDeleteTransaction = async (id: number) => {
        closeConfirmModal();
        try {
            await dispatch(deleteTransaction(id)).unwrap();
            toast.success('Transaction deleted');
            if (accountId) {
                dispatch(fetchTransactions({ accountId }));
                dispatch(fetchAccounts()); // Refresh balances
            }
        } catch (error) {
            toast.error('Failed to delete transaction');
        }
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
        try {
            await dispatch(deleteRule({ id, accountId })).unwrap();
            toast.success('Rule deleted');
        } catch (error) {
            toast.error('Failed to delete rule');
        }
    };

    const handleExecuteRule = async (ruleId: number) => {
        try {
            await dispatch(executeRule({ id: ruleId, accountId })).unwrap();
            toast.success('Rule executed successfully');
            if (accountId) {
                dispatch(fetchTransactions({ accountId }));
                dispatch(fetchAccounts());
            }
        } catch (err: any) {
            toast.error(err.message || 'Failed to execute rule');
        }
    };

    const handleToggleRule = async (rule: Rule) => {
        try {
            await dispatch(updateRule({ id: rule.rule_id, data: { is_active: !rule.is_active }, accountId })).unwrap();
            toast.success('Rule updated');
        } catch (err) {
            toast.error('Failed to update rule');
        }
    };

    const startEditingRule = (rule: Rule) => {
        setEditingRule(rule);
        setModalType('rule');
        dispatch(openModal('accountAction'));
    };

    const handleLoadMore = () => {
        if (!isFetchingNextPage && !isTransactionsLoading && hasNextPage) {
            const nextPage = Math.floor(transactions.length / 20) + 1;
            dispatch(fetchTransactions({
                accountId,
                page: nextPage,
                append: true
            }));
        }
    };

    const getBalance = () => {
        if (!transactions) return 0;
        return transactions.reduce((balance: number, tx: Transaction) => {
            const amount = Number(tx.amount || 0);
            return tx.transaction_type === 'Credit' ? balance + amount : balance - amount;
        }, 0);
    };

    const getCurrencySymbol = () => {
        if (!account || !currencies) return '$';
        return currencies.find(c => c.code === account.currency)?.symbol || '$';
    };

    if (isAccountsLoading && !account) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="mt-4 text-muted-foreground">Loading account details...</p>
            </div>
        );
    }

    if (!account && !isAccountsLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <div className="text-red-500 bg-red-500/10 p-4 rounded-xl mb-4 font-bold border border-red-500/20">
                    Account not found or failed to load.
                </div>
                <Button
                    variant="ghost"
                    onClick={() => navigate('/accounts')}
                    className="gap-2"
                >
                    <ArrowLeft size={16} /> Return to Accounts
                </Button>
            </div>
        );
    }

    const balance = getBalance();
    const symbol = getCurrencySymbol();

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Button
                variant="ghost"
                onClick={() => navigate('/accounts')}
                className="text-muted-foreground hover:text-foreground -ml-2 gap-2"
            >
                <ArrowLeft size={18} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Back to Accounts</span>
            </Button>


            <AccountInfoCard
                account={account!}
                balance={balance}
                currencies={currencies}
                onDelete={handleDeleteAccountConfirm}
                onEdit={() => {
                    setModalType('edit-account');
                    dispatch(openModal('accountAction'));
                }}
            />


            <AccountTypeDetails account={account!} symbol={symbol} />

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
                    dispatch(openModal('accountAction'));
                }}
                onExecuteRule={handleExecuteRule}
                onToggleRule={handleToggleRule}
                onEditRule={startEditingRule}
                onDeleteRule={handleDeleteRuleConfirm}
                onNewRule={() => {
                    setEditingTransaction(null);
                    setEditingRule(null);
                    setModalType('rule');
                    dispatch(openModal('accountAction'));
                }}
                isExecutingRule={isRulesLoading}
                onLoadMore={handleLoadMore}
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
                            ? (editingRule ? "Edit Rule" : "New Rule")
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
                        account={account!}
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
                isLoading={false} // Handled by individual thunks if needed
            />
        </div>
    );
}
