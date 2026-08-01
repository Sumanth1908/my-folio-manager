import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, LayoutDashboard, Loader2, ReceiptText } from 'lucide-react';
import { Tabs } from '@base-ui/react/tabs';
import type { Transaction } from '../types';
import Modal from '../components/common/Modal';
import ConfirmModal from '../components/common/ConfirmModal';
import AccountInfoCard from '../components/account/common/AccountInfoCard';
import AccountActivityPanel from '../components/account/common/AccountActivityPanel';
import AccountTypeDetails from '../components/account/common/AccountTypeDetails';
import AccountEditForm from '../components/account/common/AccountEditForm';
import CloseLoanForm from '../components/account/loan/CloseLoanForm';
import { Button } from '../components/ui/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { type RootState } from '../store';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import { fetchTransactions, setFilters } from '../store/slices/transactionsSlice';
import { fetchRules } from '../store/slices/rulesSlice';
import { fetchAccounts, deleteAccount, closeAccount } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchRates } from '../store/slices/converterSlice';
import { ACCOUNT_TYPE } from '../constants';

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
    const [isCloseLoanFormOpen, setIsCloseLoanFormOpen] = useState(false);

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
            message: 'Are you sure you want to delete this account? This deletes ALL its transactions — including the matching legs of transfers in your OTHER accounts, which retroactively changes their balances. Consider closing the account instead to keep history.',
            variant: 'danger',
            onConfirm: handleDeleteAccount
        });
    };

    const handleCloseAccount = async (sourceAccountId?: string) => {
        if (!accountId) return;
        closeConfirmModal();
        setIsCloseLoanFormOpen(false);
        try {
            await dispatch(closeAccount({ id: accountId, sourceAccountId })).unwrap();
            toast.success('Loan closed successfully');
        } catch (error) {
            toast.error(typeof error === 'string' ? error : 'Failed to close account');
        }
    };

    const handleCloseAccountConfirm = () => {
        if (!account) return;

        const currentBalance = getBalance();
        if (account.account_type === ACCOUNT_TYPE.LOAN && currentBalance < 0) {
            setIsCloseLoanFormOpen(true);
            return;
        }

        setConfirmModal({
            isOpen: true,
            title: 'Close Loan',
            message: 'Are you sure you want to close this loan account? No further EMI or interest transactions will be posted.',
            variant: 'primary',
            onConfirm: () => handleCloseAccount()
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

        // For investment accounts, calculate total portfolio value from holdings
        if (account.account_type === ACCOUNT_TYPE.INVESTMENT) {
            if (account.investment_holdings) {
                return account.investment_holdings.reduce((total, holding) => {
                    const price = holding.current_price ?? holding.average_price;
                    return total + (holding.quantity * price);
                }, 0);
            }
            return 0;
        }

        // The backend now calculates balance dynamically and sends it in the response
        if ((account as any).balance !== undefined) {
            return Number((account as any).balance);
        }

        // Fallback to transaction sum for other cases (though usually redundant)
        if (!transactions) return 0;
        return transactions.reduce((balance: number, tx: Transaction) => {
            const amount = Number(tx.amount || 0);
            return balance + amount;
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
        <div className="page-shell">
            <Button
                variant="ghost"
                onClick={() => navigate('/accounts')}
                className="text-muted-foreground hover:text-foreground -ml-2 gap-2"
            >
                <ArrowLeft size={18} />
                <span className="font-bold uppercase tracking-widest text-[10px]">Back to Accounts</span>
            </Button>


            <Tabs.Root defaultValue="overview">
                <Tabs.List className="sticky top-16 z-30 inline-flex rounded-md border border-border bg-card/95 p-1 shadow-sm backdrop-blur-md lg:top-0" aria-label="Account views">
                    <Tabs.Tab value="overview" className="inline-flex h-9 items-center gap-2 rounded-sm px-4 text-sm font-semibold text-muted-foreground data-[active]:bg-primary data-[active]:text-primary-foreground">
                        <LayoutDashboard className="h-4 w-4" /> Overview
                    </Tabs.Tab>
                    <Tabs.Tab value="activity" className="inline-flex h-9 items-center gap-2 rounded-sm px-4 text-sm font-semibold text-muted-foreground data-[active]:bg-primary data-[active]:text-primary-foreground">
                        <ReceiptText className="h-4 w-4" /> Activity
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="overview" className="mt-5 space-y-6 focus:outline-none">
                    <AccountInfoCard
                        account={account!}
                        balance={balance}
                        currencies={currencies}
                        onDelete={handleDeleteAccountConfirm}
                        onEdit={() => dispatch(openModal('accountAction'))}
                        onClose={account?.account_type === ACCOUNT_TYPE.LOAN && account.status !== 'Closed' ? handleCloseAccountConfirm : undefined}
                    />
                    <AccountTypeDetails account={account!} symbol={symbol} />
                </Tabs.Panel>

                <Tabs.Panel value="activity" className="mt-5 focus:outline-none">
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
                </Tabs.Panel>
            </Tabs.Root>

            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title="Edit account details"
                description="Update the account name, institution, currency, and other details."
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

            <Modal
                isOpen={isCloseLoanFormOpen}
                onClose={() => setIsCloseLoanFormOpen(false)}
                title="Close loan"
                description="Choose the source account used to settle the remaining balance."
            >
                {account && (
                    <CloseLoanForm
                        account={account}
                        outstanding={Math.abs(balance)}
                        accounts={accounts}
                        symbol={symbol}
                        onSubmit={handleCloseAccount}
                        onCancel={() => setIsCloseLoanFormOpen(false)}
                    />
                )}
            </Modal>
        </div>
    );
}

export default AccountDetails;
