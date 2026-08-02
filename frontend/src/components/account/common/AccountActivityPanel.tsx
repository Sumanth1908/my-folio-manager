import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, X, Wand2, ReceiptText } from 'lucide-react';
import { toast } from 'sonner';
import type { Transaction, Rule } from '../../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import Modal from '../../common/Modal';
import ConfirmModal from '../../common/ConfirmModal';
import RuleForm from '../../rules/RuleForm';
import { cn } from '../../../lib/utils';
import AccountTransactions from './AccountTransactions';
import AccountRules from './AccountRules';
import LoadingSpinner from '../../common/LoadingSpinner';
import { RULE_TYPE } from '../../../constants';
import { useAppDispatch } from '../../../store/hooks';
import { deleteTransaction } from '../../../store/slices/transactionsSlice';
import { deleteRule, executeRule, updateRule } from '../../../store/slices/rulesSlice';
import { useCreateFlow } from '../../../context/CreateFlowContext';

interface AccountActivityPanelProps {
    view: 'transactions' | 'rules';
    transactions: Transaction[] | undefined;
    rules: Rule[] | undefined;
    isLoadingTransactions: boolean;
    isLoadingRules: boolean;
    symbol: string;
    accountId: string;
    onRefresh: () => void;
    // Pagination
    onLoadMore?: () => void;
    hasMore?: boolean;
    isFetchingNextPage?: boolean;
}

const AccountActivityPanel = ({
    view,
    transactions,
    rules,
    isLoadingTransactions,
    isLoadingRules,
    symbol,
    accountId,
    onRefresh,
    onLoadMore,
    hasMore,
    isFetchingNextPage
}: AccountActivityPanelProps) => {
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();

    // Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Modal State
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);

    const [isExecutingRuleId, setIsExecutingRuleId] = useState<number | null>(null);

    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'transaction' | 'rule';
        id: number | null;
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'transaction',
        id: null,
        title: '',
        message: ''
    });

    // Derive categories
    const categories = useMemo(() => {
        const cats = new Set(transactions?.map(tx => tx.category?.name).filter(Boolean) as string[]);
        return Array.from(cats).sort();
    }, [transactions]);

    // Filter Transactions
    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(tx => {
            const matchesCategory = selectedCategory === 'all' || tx.category?.name === selectedCategory;
            const matchesSearch = !searchQuery ||
                tx.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.category?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                tx.amount.toString().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });
    }, [transactions, selectedCategory, searchQuery]);

    // Filter Rules
    const filteredRules = useMemo(() => {
        if (!rules) return [];
        return rules.filter(rule => {
            let matchesCategory = true;
            if (selectedCategory !== 'all') {
                if (rule.rule_type === RULE_TYPE.CATEGORIZATION) {
                    matchesCategory = rule.category_name === selectedCategory;
                } else {
                    matchesCategory = rule.category_name === selectedCategory;
                }
            }

            const matchesSearch = !searchQuery ||
                rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                rule.configuration?.description_contains?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [rules, selectedCategory, searchQuery]);

    // Transaction Handlers
    const handleNewTransaction = useCallback(() => {
        openCreate('transaction', { accountId });
    }, [openCreate, accountId]);



    const handleDeleteTransaction = useCallback((id: number) => {
        setConfirmModal({
            isOpen: true,
            type: 'transaction',
            id,
            title: 'Delete Transaction',
            message: 'Are you sure you want to delete this transaction?'
        });
    }, []);

    // Rule Handlers
    const handleNewRule = useCallback(() => {
        openCreate('automation', { accountId });
    }, [openCreate, accountId]);

    const handleEditRule = useCallback((rule: Rule) => {
        setEditingRule(rule);
        setIsRuleModalOpen(true);
    }, []);

    const handleDeleteRule = useCallback((id: number) => {
        setConfirmModal({
            isOpen: true,
            type: 'rule',
            id,
            title: 'Delete Rule',
            message: 'Are you sure you want to delete this rule?'
        });
    }, []);

    const handleExecuteRule = useCallback(async (id: number) => {
        setIsExecutingRuleId(id);
        try {
            await dispatch(executeRule({ id, accountId })).unwrap();
            toast.success('Rule executed!');
            onRefresh();
        } catch (error: unknown) {
            toast.error((error as Error)?.message ?? 'Failed to execute rule');
        } finally {
            setIsExecutingRuleId(null);
        }
    }, [dispatch, accountId, onRefresh]);

    const handleToggleRule = useCallback(async (rule: Rule) => {
        try {
            await dispatch(updateRule({
                id: rule.rule_id,
                data: { is_active: !rule.is_active },
                accountId
            })).unwrap();
            toast.success(`Rule ${rule.is_active ? 'paused' : 'resumed'}`);
            onRefresh();
        } catch {
            toast.error('Failed to toggle rule');
        }
    }, [dispatch, accountId, onRefresh]);

    // Confirmation Handler
    const handleConfirmDelete = useCallback(async () => {
        if (!confirmModal.id) return;

        try {
            if (confirmModal.type === 'transaction') {
                await dispatch(deleteTransaction(confirmModal.id)).unwrap();
                toast.success('Transaction deleted');
            } else {
                await dispatch(deleteRule({ id: confirmModal.id, accountId })).unwrap();
                toast.success('Rule deleted');
            }
            onRefresh();
        } catch {
            toast.error(`Failed to delete ${confirmModal.type}`);
        } finally {
            setConfirmModal(prev => ({ ...prev, isOpen: false }));
        }
    }, [confirmModal, dispatch, accountId, onRefresh]);

    return (
        <>
            <Card className="border border-border overflow-hidden rounded-xl shadow-none">
                {/* Header Section */}
                <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            {view === 'transactions' ? <ReceiptText size={16} className="text-primary" /> : <Wand2 size={16} className="text-primary" />}
                            <h2 className="text-sm font-bold text-foreground">
                                {view === 'transactions' ? 'Activity' : 'Automations'}
                            </h2>
                        </div>

                        {/* Actions: Search & New */}
                        <div className="flex items-center gap-2">
                            <div className={cn(
                                "flex items-center bg-background border border-border/50 rounded-xl px-3 transition-all duration-300 overflow-hidden",
                                isSearchOpen ? "w-52" : "w-9 h-9 justify-center p-0 hover:bg-muted/50"
                            )}>
                                <Search
                                    size={18}
                                    className={cn(
                                        "text-muted-foreground shrink-0 cursor-pointer hover:text-foreground transition-colors",
                                        isSearchOpen ? "mr-2" : ""
                                    )}
                                    onClick={() => {
                                        if (!isSearchOpen) setIsSearchOpen(true);
                                    }}
                                />
                                {isSearchOpen && (
                                    <div className="flex items-center flex-1">
                                        <input
                                            type="text"
                                            placeholder={view === 'transactions' ? "Search transactions..." : "Search automations..."}
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="bg-transparent border-none outline-none text-sm w-full py-2.5 placeholder:text-muted-foreground/50"
                                            autoFocus
                                        />
                                        <button
                                            onClick={() => {
                                                if (searchQuery) setSearchQuery('');
                                                else setIsSearchOpen(false);
                                            }}
                                            className="ml-2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <Button
                                onClick={view === 'transactions' ? handleNewTransaction : handleNewRule}
                                className="rounded-md h-9 w-9 p-0 shrink-0"
                                title={view === 'transactions' ? "New Transaction" : "New Automation"}
                            >
                                {view === 'transactions' ? <Plus size={18} /> : <Wand2 size={18} />}
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    {categories.length > 0 && (
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-none mask-fade-right">
                            <div className="flex items-center gap-1 pr-2 text-muted-foreground/50 text-[10px] font-bold uppercase tracking-wide">
                                <Filter size={12} />
                                <span>Filter:</span>
                            </div>
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={cn(
                                    "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-all border",
                                    selectedCategory === 'all'
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                All
                            </button>
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={cn(
                                        "px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wide whitespace-nowrap transition-all border",
                                        selectedCategory === cat
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-border hover:border-primary/50"
                                    )}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="border-t border-border">
                    {/* Transactions List */}
                    {view === 'transactions' && (
                        <AccountTransactions
                            transactions={filteredTransactions}
                            isLoading={isLoadingTransactions}
                            symbol={symbol}
                            onDelete={handleDeleteTransaction}
                        />
                    )}

                    {view === 'transactions' && hasMore && (
                        <div className="p-4 flex justify-center border-t border-border/50">
                            <Button
                                variant="ghost"
                                onClick={onLoadMore}
                                disabled={isFetchingNextPage}
                                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary"
                            >
                                {isFetchingNextPage ? <span className="flex items-center gap-2"><LoadingSpinner size="small" /> Loading...</span> : "Load More"}
                            </Button>
                        </div>
                    )}

                    {/* Rules List */}
                    {view === 'rules' && (
                        <AccountRules
                            rules={filteredRules}
                            isLoading={isLoadingRules}
                            symbol={symbol}
                            accountId={accountId}
                            onExecute={handleExecuteRule}
                            onToggle={handleToggleRule}
                            onEdit={handleEditRule}
                            onDelete={handleDeleteRule}
                            onRefresh={onRefresh}
                            isExecuting={!!isExecutingRuleId} // Pass boolean if executing any
                        />
                    )}
                </div>
            </Card>

            {/* Modals */}
            <Modal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title={editingRule ? 'Edit Rule' : 'New Rule'}
                maxWidth="max-w-2xl"
            >
                <RuleForm
                    accountId={accountId}
                    ruleToEdit={editingRule}
                    onSuccess={() => {
                        setIsRuleModalOpen(false);
                        onRefresh();
                    }}
                    onCancel={() => setIsRuleModalOpen(false)}
                />
            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={handleConfirmDelete}
                title={confirmModal.title}
                message={confirmModal.message}
            />
        </>
    );
};

export default AccountActivityPanel;
