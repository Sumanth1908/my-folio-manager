import { useState, useMemo, useCallback } from 'react';
import { Plus, Search, Filter, X, Wand2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Transaction, Rule } from '../../../types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import Modal from '../../common/Modal';
import ConfirmModal from '../../common/ConfirmModal';
import CreateTransactionForm from '../../transactions/CreateTransactionForm';
import EditTransactionForm from '../../transactions/EditTransactionForm';
import RuleForm from '../../rules/RuleForm';
import { cn } from '../../../lib/utils';
import AccountTransactions from './AccountTransactions';
import AccountRules from './AccountRules';
import LoadingSpinner from '../../common/LoadingSpinner';
import { RULE_TYPE } from '../../../constants';
import { useAppDispatch } from '../../../store/hooks';
import { deleteTransaction } from '../../../store/slices/transactionsSlice';
import { deleteRule, executeRule, updateRule } from '../../../store/slices/rulesSlice';

interface AccountActivityPanelProps {
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

    // Tab & Filter State
    const [activeTab, setActiveTab] = useState<'transactions' | 'rules'>('transactions');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    // Modal State
    const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

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
                rule.description_contains?.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });
    }, [rules, selectedCategory, searchQuery]);

    // Transaction Handlers
    const handleNewTransaction = useCallback(() => {
        setEditingTransaction(null);
        setIsTransactionModalOpen(true);
    }, []);

    const handleEditTransaction = useCallback((tx: Transaction) => {
        setEditingTransaction(tx);
        setIsTransactionModalOpen(true);
    }, []);

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
        setEditingRule(null);
        setIsRuleModalOpen(true);
    }, []);

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
            <Card className="bg-muted/30 border border-border overflow-hidden rounded-2xl">
                {/* Header Section */}
                <div className="p-6 md:p-8 space-y-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Tabs */}
                        <div className="flex items-center gap-1 bg-background/50 p-1 rounded-xl border border-border/50">
                            <button
                                onClick={() => setActiveTab('transactions')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all",
                                    activeTab === 'transactions'
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Activity
                            </button>
                            <button
                                onClick={() => setActiveTab('rules')}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold uppercase tracking-wide transition-all",
                                    activeTab === 'rules'
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                Rules
                            </button>
                        </div>

                        {/* Actions: Search & New */}
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <div className={cn(
                                "flex items-center bg-background border border-border/50 rounded-xl px-3 transition-all duration-300 overflow-hidden",
                                isSearchOpen ? "w-full md:w-64" : "w-10 h-10 md:w-11 md:h-11 justify-center p-0 hover:bg-muted/50"
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
                                            placeholder={activeTab === 'transactions' ? "Search transactions..." : "Search rules..."}
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

                            {!isSearchOpen && (
                                <Button
                                    onClick={() => isSearchOpen ? {} : setIsSearchOpen(true)}
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden text-muted-foreground"
                                >
                                    <Search size={20} />
                                </Button>
                            )}

                            <Button
                                onClick={activeTab === 'transactions' ? handleNewTransaction : handleNewRule}
                                className="rounded-full h-10 w-10 md:h-12 md:w-12 p-0 shadow-lg shadow-primary/20 shrink-0"
                                title={activeTab === 'transactions' ? "New Transaction" : "New Rule"}
                            >
                                {activeTab === 'transactions' ? <Plus size={20} className="md:w-6 md:h-6" /> : <Wand2 size={20} className="md:w-6 md:h-6" />}
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    {categories.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mask-fade-right">
                            <div className="flex items-center gap-2 pr-4 text-muted-foreground/50 text-xs font-bold uppercase tracking-widest">
                                <Filter size={12} />
                                <span>Filter:</span>
                            </div>
                            <button
                                onClick={() => setSelectedCategory('all')}
                                className={cn(
                                    "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
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
                                        "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
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
                <div className="border-t border-border bg-background/30 min-h-[300px]">
                    {/* Transactions List */}
                    {activeTab === 'transactions' && (
                        <AccountTransactions
                            transactions={filteredTransactions}
                            isLoading={isLoadingTransactions}
                            symbol={symbol}
                            onEdit={handleEditTransaction}
                            onDelete={handleDeleteTransaction}
                        />
                    )}

                    {activeTab === 'transactions' && hasMore && (
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
                    {activeTab === 'rules' && (
                        <AccountRules
                            rules={filteredRules}
                            isLoading={isLoadingRules}
                            symbol={symbol}
                            onExecute={handleExecuteRule}
                            onToggle={handleToggleRule}
                            onEdit={handleEditRule}
                            onDelete={handleDeleteRule}
                            isExecuting={!!isExecutingRuleId} // Pass boolean if executing any
                        />
                    )}
                </div>
            </Card>

            {/* Modals */}
            <Modal
                isOpen={isTransactionModalOpen}
                onClose={() => setIsTransactionModalOpen(false)}
                title={editingTransaction ? 'Edit Transaction' : 'New Transaction'}
            >
                {editingTransaction ? (
                    <EditTransactionForm
                        transaction={editingTransaction}
                        onSuccess={() => {
                            setIsTransactionModalOpen(false);
                            onRefresh();
                        }}
                        onCancel={() => setIsTransactionModalOpen(false)}
                    />
                ) : (
                    <CreateTransactionForm
                        accountId={accountId}
                        onSuccess={() => {
                            setIsTransactionModalOpen(false);
                            onRefresh();
                        }}
                        onCancel={() => setIsTransactionModalOpen(false)}
                    />
                )}
            </Modal>

            <Modal
                isOpen={isRuleModalOpen}
                onClose={() => setIsRuleModalOpen(false)}
                title={editingRule ? 'Edit Rule' : 'New Rule'}
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
