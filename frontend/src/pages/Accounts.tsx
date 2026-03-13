import { useEffect, useCallback, useState } from 'react';
import { Plus, Loader2, Search } from 'lucide-react';
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

    const [searchQuery, setSearchQuery] = useState('');
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

    const filteredSummaryData = summaryData ? {
        ...summaryData,
        accounts: summaryData.accounts.filter(account => {
            const query = searchQuery.toLowerCase();
            return (account.account_name || 'Unnamed Account').toLowerCase().includes(query) || 
                   account.account_type.replace('_', ' ').toLowerCase().includes(query) ||
                   account.account_type.toLowerCase().includes(query);
        })
    } : null;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Card className="p-8 border-border/50 bg-background/90 text-foreground">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Accounts</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage your financial portfolio and tracking</p>
                    </div>

                    <div className="flex flex-col md:flex-row items-end md:items-center gap-4 w-full md:w-auto">
                        <div className="relative w-full md:w-64 self-start md:self-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search accounts..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-background border border-border/50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
                            />
                        </div>

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
                ) : filteredSummaryData ? (
                    <AccountSummaryPanel data={filteredSummaryData} accountsData={accounts} />
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
