import { useEffect, useCallback } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import Modal from '../components/common/Modal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import AccountSummaryPanel from '../components/account/common/AccountSummaryPanel';
import CreateAccountForm from '../components/account/common/CreateAccountForm';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { openModal, closeModal as closeReduxModal } from '../store/slices/uiSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSummary, setSummaryTimeRange } from '../store/slices/summarySlice';
import { cn } from '../lib/utils';
import { ACCOUNT_TYPES, TIME_RANGES } from '../constants';

const Accounts = () => {
    const dispatch = useAppDispatch();
    const isModalOpen = useAppSelector((state: RootState) => state.ui.modals['createAccount']);
    const { items: accounts, loading: isAccountsLoading } = useAppSelector((state: RootState) => state.accounts);
    const { data: summaryData, loading: isSummaryLoading, filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);

    const timeRange = summaryFilters.timeRange;

    useEffect(() => {
        dispatch(fetchAccounts());
        dispatch(fetchCurrencies());
    }, [dispatch]);

    useEffect(() => {
        dispatch(fetchSummary({
            timeRange,
            accountTypes: [...ACCOUNT_TYPES]
        }));
    }, [dispatch, timeRange]);

    const closeModal = useCallback(() => {
        dispatch(closeReduxModal('createAccount'));
    }, [dispatch]);

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Card className="p-8 border-border/50 bg-background/90 text-foreground">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage your financial portfolio and tracking</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                        <div className="flex bg-muted/50 p-1 rounded-xl border border-border self-start md:self-auto">
                            {TIME_RANGES.map((range) => (
                                <Button
                                    key={range}
                                    variant={timeRange === range ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => dispatch(setSummaryTimeRange(range))}
                                    className={cn(
                                        "text-[10px] font-bold uppercase tracking-wider px-4 rounded-lg transition-colors duration-200 h-8",
                                        timeRange !== range && "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {range === 'thisMonth' ? '30D' : range === 'lastMonth' ? 'Last Month' : 'All'}
                                </Button>
                            ))}
                        </div>

                        <Button
                            size="icon"
                            className="rounded-full h-10 w-10 shadow-md hover:bg-primary/90 transition-colors"
                            onClick={() => dispatch(openModal('createAccount'))}
                            title="New Account"
                        >
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>

                {isSummaryLoading || isAccountsLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : summaryData ? (
                    <AccountSummaryPanel data={summaryData} accountsData={accounts} />
                ) : (
                    <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                        <p className="text-muted-foreground">No account data found for this period.</p>
                    </div>
                )}
            </Card>

            <Modal isOpen={isModalOpen} onClose={closeModal} title="Create New Account" maxWidth="max-w-3xl">
                <CreateAccountForm
                    onSuccess={closeModal}
                    onCancel={closeModal}
                />
            </Modal>
        </div>
    );
}

export default Accounts;
