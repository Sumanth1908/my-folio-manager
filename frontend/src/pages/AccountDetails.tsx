import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Transaction } from '../types';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import AccountInfoCard from '../components/account/common/AccountInfoCard';
import AccountActivityPanel from '../components/account/common/AccountActivityPanel';
import AccountTypeDetails from '../components/account/common/AccountTypeDetails';
import AccountEditForm from '../components/account/common/AccountEditForm';
import { Button } from '../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import { fetchTransactions, setFilters } from '../store/slices/transactionsSlice';
import { fetchRules } from '../store/slices/rulesSlice';
import { fetchAccounts, deleteAccount } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import { TRANSACTION_TYPE, ACCOUNT_TYPE } from '../constants';

const AccountDetails = () => {
    const { id: accountId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const isModalOpen = useAppSelector((state: RootState) => state.ui.modals['accountAction']);


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

    // Confirm Modal State (For Account Deletion)
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

    const refreshData = () => {
        if (accountId) {
            dispatch(fetchTransactions({ accountId }));
            dispatch(fetchRules(accountId));
            dispatch(fetchAccounts()); // Refresh balances
        }
    };

    useEffect(() => {
        if (accountId) {
            dispatch(setFilters({ accountId, page: 1 }));
            refreshData();
            if (accounts.length === 0) {
                dispatch(fetchAccounts());
            }
            dispatch(fetchCurrencies());
            dispatch(fetchSettings());
        }
    }, [dispatch, accountId, accounts.length]);

    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    useEffect(() => {
        if (settings?.default_currency) {
            dispatch(fetchRates(settings.default_currency));
        }
    }, [dispatch, settings?.default_currency]);

    const closeModal = () => {
        dispatch(closeReduxModal('accountAction'));
    };

    const closeConfirmModal = () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
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

    const handleDeleteAccountConfirm = () => {
        setConfirmModal({
            isOpen: true,
            title: 'Delete Account',
            message: 'Are you sure you want to delete this account? This will also delete ALL associated transactions.',
            variant: 'danger',
            onConfirm: handleDeleteAccount
        });
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
        if (!account) return 0;

        // Use pre-calculated balances from backend where available
        if (account.savings_account) return Number(account.savings_account.balance || 0);
        if (account.fixed_deposit_account) return Number(account.fixed_deposit_account.balance || 0);
        if (account.loan_account) return Number(account.loan_account.outstanding_amount || 0);

        // For investment accounts, calculate total portfolio value from holdings
        if (account.account_type === ACCOUNT_TYPE.INVESTMENT && account.investment_holdings) {
            return account.investment_holdings.reduce((total, holding) => {
                const price = holding.current_price ?? holding.average_price;
                return total + (holding.quantity * price);
            }, 0);
        }

        // Fallback to transaction sum for other cases (though usually redundant)
        if (!transactions) return 0;
        return transactions.reduce((balance: number, tx: Transaction) => {
            const amount = Number(tx.amount || 0);
            return tx.transaction_type === TRANSACTION_TYPE.CREDIT ? balance + amount : balance - amount;
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
                accountId={accountId!}
                onRefresh={refreshData}
                onLoadMore={handleLoadMore}
                hasMore={hasNextPage}
                isFetchingNextPage={isFetchingNextPage}
            />

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Edit Account Details"
            >
                <AccountEditForm
                    account={account!}
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
                isLoading={false}
            />
        </div>
    );
}

export default AccountDetails;
