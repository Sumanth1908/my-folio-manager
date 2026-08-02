import { createContext, lazy, Suspense, useContext, useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Bot, Landmark, PieChart, Plus, ReceiptText, Tag, TrendingUp } from 'lucide-react';
import Modal from '../components/common/Modal';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/Select';
import { cn } from '../lib/utils';
import { accountSupportsHoldings } from '../lib/accounts';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { RootState } from '../store';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { fetchCategories } from '../store/slices/categoriesSlice';
import { fetchCurrencies } from '../store/slices/currenciesSlice';
import { fetchSettings } from '../store/slices/settingsSlice';
import { fetchBudgets } from '../store/slices/budgetsSlice';
import { fetchRules } from '../store/slices/rulesSlice';

const CreateAccountForm = lazy(() => import('../components/account/common/CreateAccountForm'));
const CreateTransactionForm = lazy(() => import('../components/transactions/CreateTransactionForm'));
const RuleForm = lazy(() => import('../components/rules/RuleForm'));
const CategoryForm = lazy(() => import('../components/settings/CategoryForm'));
const HoldingForm = lazy(() => import('../components/account/investment/HoldingForm'));
const BudgetFormContent = lazy(() => import('../components/budgets/BudgetFormModal').then((module) => ({ default: module.BudgetFormContent })));

export type CreateFlow = 'transaction' | 'account' | 'automation' | 'budget' | 'category' | 'holding';

interface CreateOptions {
    accountId?: string;
}

interface CreateFlowContextValue {
    openCreate: (flow?: CreateFlow, options?: CreateOptions) => void;
}

const CreateFlowContext = createContext<CreateFlowContextValue | null>(null);

interface Choice {
    id: CreateFlow;
    title: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
    tone: string;
}

const choices: Choice[] = [
    { id: 'transaction', title: 'Transaction', description: 'Record income, spending, or a transfer.', icon: ReceiptText, tone: 'bg-primary/10 text-primary' },
    { id: 'account', title: 'Account', description: 'Add a bank, deposit, loan, or investment account.', icon: Landmark, tone: 'bg-income/10 text-income' },
    { id: 'automation', title: 'Automation', description: 'Schedule transfers, calculations, or categorization.', icon: Bot, tone: 'bg-chart-4/15 text-chart-4' },
    { id: 'budget', title: 'Budget', description: 'Set a monthly category spending limit.', icon: PieChart, tone: 'bg-chart-2/15 text-chart-2' },
    { id: 'holding', title: 'Asset holding', description: 'Add stocks, gold, crypto, property, or another asset.', icon: TrendingUp, tone: 'bg-chart-3/15 text-chart-3' },
    { id: 'category', title: 'Category', description: 'Create a label for transactions and budgets.', icon: Tag, tone: 'bg-muted text-muted-foreground' },
];

const flowMeta: Record<CreateFlow, { title: string; description: string; width: string }> = {
    transaction: { title: 'New transaction', description: 'Record income, spending, or a transfer between accounts.', width: 'max-w-lg' },
    account: { title: 'Create account', description: 'Choose an account type and enter its opening details.', width: 'max-w-5xl' },
    automation: { title: 'New automation', description: 'Choose what should happen and when it should run.', width: 'max-w-2xl' },
    budget: { title: 'Add budget', description: 'Set a monthly spending limit for a category.', width: 'max-w-sm' },
    category: { title: 'New category', description: 'Create a reusable label for financial activity.', width: 'max-w-md' },
    holding: { title: 'Add asset holding', description: 'Choose an asset account and record its quantity and valuation.', width: 'max-w-lg' },
};

export function CreateFlowProvider({ children }: { children: ReactNode }) {
    const dispatch = useAppDispatch();
    const accounts = useAppSelector((state: RootState) => state.accounts.items);
    const categories = useAppSelector((state: RootState) => state.categories.items);
    const currencies = useAppSelector((state: RootState) => state.currencies.items);
    const settings = useAppSelector((state: RootState) => state.settings.data);
    const selectedMonth = useAppSelector((state: RootState) => state.budgets.selectedMonth);
    const [isOpen, setIsOpen] = useState(false);
    const [flow, setFlow] = useState<CreateFlow | null>(null);
    const [options, setOptions] = useState<CreateOptions>({});
    const [holdingAccountId, setHoldingAccountId] = useState('');

    const holdingAccounts = useMemo(
        () => accounts.filter((account) => accountSupportsHoldings(account) && account.status !== 'Closed'),
        [accounts],
    );

    const openCreate = (nextFlow?: CreateFlow, nextOptions: CreateOptions = {}) => {
        setOptions(nextOptions);
        setFlow(nextFlow || null);
        setHoldingAccountId(nextOptions.accountId || '');
        setIsOpen(true);
    };

    const close = () => {
        setIsOpen(false);
        setFlow(null);
        setOptions({});
        setHoldingAccountId('');
    };

    useEffect(() => {
        if (!isOpen) return;
        if (accounts.length === 0) dispatch(fetchAccounts());
        if (categories.length === 0) dispatch(fetchCategories());
        if (currencies.length === 0) dispatch(fetchCurrencies());
        if (!settings) dispatch(fetchSettings());
        if (flow === 'budget') dispatch(fetchBudgets(selectedMonth));
    }, [isOpen, flow, accounts.length, categories.length, currencies.length, settings, selectedMonth, dispatch]);

    const resolvedHoldingAccountId = holdingAccountId
        || holdingAccounts.find((account) => account.account_id === options.accountId)?.account_id
        || holdingAccounts[0]?.account_id
        || '';
    const selectedHoldingAccount = holdingAccounts.find((account) => account.account_id === resolvedHoldingAccountId);
    const defaultCurrency = settings?.default_currency || 'USD';
    const budgetSymbol = currencies.find((currency) => currency.code === defaultCurrency)?.symbol || defaultCurrency;
    const meta = flow ? flowMeta[flow] : null;

    const back = () => {
        setFlow(null);
        setOptions({});
        setHoldingAccountId('');
    };

    const renderFlow = () => {
        if (!flow) {
            return (
                <div className="grid gap-3 sm:grid-cols-2">
                    {choices.map((choice) => {
                        const Icon = choice.icon;
                        return (
                            <button
                                key={choice.id}
                                type="button"
                                onClick={() => setFlow(choice.id)}
                                className="group flex min-h-28 items-start gap-4 rounded-lg border border-border bg-card p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md', choice.tone)}>
                                    <Icon className="h-5 w-5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                    <span className="block font-semibold text-foreground">{choice.title}</span>
                                    <span className="mt-1 block text-sm leading-5 text-muted-foreground">{choice.description}</span>
                                </span>
                                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                            </button>
                        );
                    })}
                </div>
            );
        }

        const cancel = back;
        const success = () => {
            if (flow === 'automation') dispatch(fetchRules(options.accountId || null));
            close();
        };

        return (
            <div>
                <Button variant="ghost" size="sm" onClick={back} className="mb-5 -ml-2 text-muted-foreground">
                    <ArrowLeft /> All create options
                </Button>
                {flow === 'transaction' && <CreateTransactionForm accountId={options.accountId} onSuccess={success} onCancel={cancel} />}
                {flow === 'account' && <CreateAccountForm onSuccess={success} onCancel={cancel} />}
                {flow === 'automation' && <RuleForm accountId={options.accountId} onSuccess={success} onCancel={cancel} />}
                {flow === 'budget' && <BudgetFormContent isOpen onClose={success} editing={null} symbol={budgetSymbol} />}
                {flow === 'category' && <CategoryForm onSuccess={success} onCancel={cancel} />}
                {flow === 'holding' && (
                    <div className="space-y-5">
                        {holdingAccounts.length === 0 ? (
                            <EmptyState
                                icon={<TrendingUp className="h-5 w-5" />}
                                title="No asset account"
                                description="Create an investment, commodity, crypto, property, or other asset account before adding a holding."
                                action={<Button onClick={() => setFlow('account')}><Plus /> Create account</Button>}
                            />
                        ) : (
                            <>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-muted-foreground" htmlFor="holding-account">Asset account</label>
                                    <Select value={resolvedHoldingAccountId} onValueChange={setHoldingAccountId}>
                                        <SelectTrigger id="holding-account" className="w-full">
                                            <SelectValue placeholder="Choose an account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {holdingAccounts.map((account) => (
                                                <SelectItem key={account.account_id} value={account.account_id}>{account.account_name} · {account.account_type.replaceAll('_', ' ')}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {selectedHoldingAccount && (
                                    <HoldingForm
                                        key={selectedHoldingAccount.account_id}
                                        accountId={selectedHoldingAccount.account_id}
                                        accountType={selectedHoldingAccount.account_type}
                                        currencyCode={selectedHoldingAccount.currency}
                                        currencySymbol={currencies.find((currency) => currency.code === selectedHoldingAccount.currency)?.symbol || selectedHoldingAccount.currency}
                                        onSuccess={success}
                                        onCancel={cancel}
                                    />
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <CreateFlowContext.Provider value={{ openCreate }}>
            {children}
            <Modal
                isOpen={isOpen}
                onClose={close}
                title={meta?.title || 'Create'}
                description={meta?.description || 'Start a new record from one place.'}
                maxWidth={meta?.width || 'max-w-2xl'}
            >
                <Suspense fallback={<div className="flex min-h-40 items-center justify-center" role="status" aria-label="Loading create form"><div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}>
                    {renderFlow()}
                </Suspense>
            </Modal>
        </CreateFlowContext.Provider>
    );
}

export function useCreateFlow() {
    const context = useContext(CreateFlowContext);
    if (!context) throw new Error('useCreateFlow must be used within CreateFlowProvider');
    return context;
}
