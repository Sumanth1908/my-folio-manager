import { useEffect, useState } from 'react';
import { Plus, Loader2, Search } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { PageToolbar } from '../components/ui/PageToolbar';
import { EmptyState } from '../components/ui/EmptyState';
import AccountSummaryPanel from '../components/account/common/AccountSummaryPanel';
import ErrorBanner from '../components/common/ErrorBanner';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSummary, setSummaryTimeRange } from '../store/slices/summarySlice';
import { ACCOUNT_TYPES, TIME_RANGES } from '../constants';
import { useCreateFlow } from '../context/CreateFlowContext';

const Accounts = () => {
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();
    const { items: accounts, loading: isAccountsLoading, error: accountsError } = useAppSelector((state: RootState) => state.accounts);
    const { data: summaryData, loading: isSummaryLoading, error: summaryError, filters: summaryFilters } = useAppSelector((state: RootState) => state.summary);

    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Closed' | 'all'>('Active');
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

    const filteredSummaryData = summaryData ? {
        ...summaryData,
        accounts: summaryData.accounts.filter(account => {
            const query = searchQuery.toLowerCase();
            const matchesSearch = (account.account_name || 'Unnamed Account').toLowerCase().includes(query) ||
                   account.account_type.replace('_', ' ').toLowerCase().includes(query) ||
                   account.account_type.toLowerCase().includes(query);

            if (!matchesSearch) return false;
            if (statusFilter === 'all') return true;

            const fullAccount = accounts.find(a => a.account_id === account.account_id);
            return (fullAccount?.status || 'Active') === statusFilter;
        })
    } : null;

    return (
        <div className="page-shell">
            {(accountsError || summaryError) && (
                <ErrorBanner
                    message={accountsError || summaryError || 'Failed to load accounts'}
                    onRetry={() => {
                        dispatch(fetchAccounts());
                        dispatch(fetchSummary({ timeRange, accountTypes: [...ACCOUNT_TYPES] }));
                    }}
                />
            )}
            <PageHeader
                eyebrow="Workspace"
                title="Accounts"
                description="Manage balances, account status, and activity across your financial portfolio."
            />

            <PageToolbar label="Account filters">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="w-full lg:max-w-xs">
                        <Input
                            type="search"
                            placeholder="Search accounts"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            leadingIcon={<Search />}
                            aria-label="Search accounts"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2 lg:ml-auto">
                        <SegmentedControl
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                            label="Account status"
                            options={[
                                { value: 'Active', label: 'Open' },
                                { value: 'Closed', label: 'Closed' },
                                { value: 'all', label: 'All' },
                            ]}
                        />
                        <SegmentedControl
                            value={timeRange}
                            onValueChange={(range) => dispatch(setSummaryTimeRange(range))}
                            label="Account summary period"
                            options={TIME_RANGES.map((range) => ({
                                value: range,
                                label: range === 'last30Days' ? '30 days' : range === 'currentMonth' ? 'This month' : range === 'lastMonth' ? 'Last month' : 'All time',
                            }))}
                        />
                        <Button onClick={() => openCreate('account')} className="ml-auto sm:ml-0">
                            <Plus /> New account
                        </Button>
                    </div>
                </div>
            </PageToolbar>

            <div>
                {isSummaryLoading || isAccountsLoading ? (
                    <div className="flex items-center justify-center p-20">
                        <Loader2 className="animate-spin text-primary" size={40} />
                    </div>
                ) : filteredSummaryData ? (
                    <AccountSummaryPanel
                        data={filteredSummaryData}
                        accountsData={accounts}
                        emptyMessage={statusFilter === 'all' ? undefined : `No ${statusFilter === 'Active' ? 'open' : 'closed'} accounts found.`}
                    />
                ) : (
                    <EmptyState title="No account data" description="No account data was found for the selected period." />
                )}
            </div>

        </div>
    );
}

export default Accounts;
