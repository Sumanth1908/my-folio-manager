import { useEffect, useState, useMemo } from 'react';
import { Plus, Tag, RefreshCw, Calendar, Trash2, ArrowRightLeft, Calculator, Play, Zap } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchRules, deleteRule, executeRule, triggerAutomation } from '../store/slices/rulesSlice';
import { fetchAccounts } from '../store/slices/accountsSlice';
import { type RootState } from '../store';
import { type Rule } from '../types';
import { RULE_TYPE, TRANSACTION_TYPE } from '../constants';
import { Button } from '../components/ui/Button';
import { formatDate, cn } from '../lib/utils';
import RuleForm from '../components/rules/RuleForm';
import Modal from '../components/common/Modal';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { SegmentedControl } from '../components/ui/SegmentedControl';
import { PageToolbar } from '../components/ui/PageToolbar';
import { EmptyState } from '../components/ui/EmptyState';
import ConfirmModal from '../components/common/ConfirmModal';
import { toast } from 'sonner';
import { useCreateFlow } from '../context/CreateFlowContext';

interface RulesProps {
    embedded?: boolean;
}

export default function Rules({ embedded = false }: RulesProps) {
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();
    const { items: rules, loading } = useAppSelector((state: RootState) => state.rules);
    const { items: accounts, loading: accountsLoading } = useAppSelector((state: RootState) => state.accounts);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<Rule | null>(null);
    const [ruleToDelete, setRuleToDelete] = useState<Rule | null>(null);
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Closed' | 'all'>('Active');

    useEffect(() => {
        // Fetch all rules (no accountId means fetch all)
        dispatch(fetchRules(null));
        if (accounts.length === 0) {
            dispatch(fetchAccounts());
        }
    }, [dispatch, accounts.length]);

    const handleExecute = async (ruleId: number) => {
        try {
            await dispatch(executeRule({ id: ruleId, accountId: null })).unwrap();
            toast.success('Rule executed successfully');
        } catch (error: any) {
            toast.error(typeof error === 'string' ? error : error?.message || 'Failed to execute rule');
        }
    };

    const handleTriggerAutomation = async () => {
        try {
            await dispatch(triggerAutomation()).unwrap();
            toast.success('Automation worker triggered');
            setTimeout(() => {
                dispatch(fetchRules(null));
            }, 2000);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to trigger worker');
        }
    };

    const handleDelete = async () => {
        if (!ruleToDelete) return;
        try {
            await dispatch(deleteRule({ id: ruleToDelete.rule_id, accountId: null })).unwrap();
            toast.success('Rule deleted');
            setRuleToDelete(null);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to delete rule');
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setRuleToEdit(null);
    };

    const getRuleIcon = (type: string, config: any) => {
        if (type === RULE_TYPE.CATEGORIZATION) return <Tag size={16} />;
        if (type === RULE_TYPE.CALCULATION) return <Calculator size={16} />;
        if (config?.transaction_type === TRANSACTION_TYPE.TRANSFER) return <ArrowRightLeft size={16} />;
        return <RefreshCw size={16} />;
    };

    const getAccountName = (accId: string) => {
        return accounts.find(a => a.account_id === accId)?.account_name || 'Unknown Account';
    };

    const closedAccounts = useMemo(
        () => new Set(accounts.filter(a => a.status === 'Closed').map(a => a.account_id)),
        [accounts]
    );

    // Group rules by account, filtered by the owning account's status
    const groupedRules = useMemo(() => {
        const accountStatus: Record<string, string> = {};
        accounts.forEach(a => { accountStatus[a.account_id] = a.status; });

        const groups: Record<string, Rule[]> = {};
        rules.forEach(rule => {
            const status = accountStatus[rule.account_id] || 'Active';
            if (statusFilter !== 'all' && status !== statusFilter) return;
            if (!groups[rule.account_id]) {
                groups[rule.account_id] = [];
            }
            groups[rule.account_id].push(rule);
        });
        return groups;
    }, [rules, accounts, statusFilter]);

    const visibleRuleCount = useMemo(
        () => Object.values(groupedRules).reduce((sum, r) => sum + r.length, 0),
        [groupedRules]
    );

    const actions = (
        <>
            <SegmentedControl
                value={statusFilter}
                onValueChange={setStatusFilter}
                label="Rule account status"
                options={[
                    { value: 'Active', label: 'Open' },
                    { value: 'Closed', label: 'Closed' },
                    { value: 'all', label: 'All' },
                ]}
            />
            <Button onClick={handleTriggerAutomation} variant="outline" title="Run all due rules now">
                <Zap /> Run due rules
            </Button>
            <Button onClick={() => openCreate('automation')}>
                <Plus /> New rule
            </Button>
        </>
    );

    if (loading || accountsLoading) {
        return (
            <div className={cn('flex items-center justify-center', embedded ? 'py-20' : 'h-[calc(100vh-5rem)]')}>
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Rules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={embedded ? 'space-y-5' : 'page-shell'}>
            {embedded ? (
                <PageToolbar label="Automation controls">{actions}</PageToolbar>
            ) : (
                <PageHeader
                eyebrow="Automate"
                title="Rules"
                description="Manage categorizations, transfers, and calculations across every account."
                actions={actions}
            />
            )}

            <Card className="p-5 sm:p-6">

            <Modal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                title={ruleToEdit ? 'Edit rule' : 'New rule'}
                description="Choose what should happen and when this automation should run."
                maxWidth="max-w-2xl"
            >
                <RuleForm 
                    ruleToEdit={ruleToEdit}
                    onSuccess={handleCloseForm}
                    onCancel={handleCloseForm}
                />
            </Modal>

            {visibleRuleCount === 0 ? (
                <EmptyState
                    icon={<RefreshCw className="h-5 w-5" />}
                    title="No rules found"
                    description={rules.length === 0
                        ? 'Create rules to automatically categorize transactions, transfer funds, or calculate interest across your accounts.'
                        : `No rules for ${statusFilter === 'Active' ? 'open' : 'closed'} accounts.`}
                />
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedRules).map(([accountId, accountRules]) => {
                        const isClosed = closedAccounts.has(accountId);
                        return (
                        <div key={accountId} className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                <h2 className="text-xl font-bold text-foreground">
                                    {getAccountName(accountId)}
                                </h2>
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-muted-foreground">
                                    {accountRules.length} Rules
                                </span>
                                {isClosed && (
                                    <span className="text-[10px] bg-rose-500/10 text-rose-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                                        Account Closed
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid gap-4">
                                {accountRules.map(rule => (
                                    <div key={rule.rule_id} className="bg-background border border-border rounded-2xl p-5 hover:border-border/80 hover:shadow-sm transition-all group flex justify-between items-center">
                                        <div className="flex items-center gap-5">
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex items-center justify-center shadow-sm",
                                                rule.rule_type === RULE_TYPE.CATEGORIZATION ? "bg-amber-500/10 text-amber-600" :
                                                rule.rule_type === RULE_TYPE.CALCULATION ? "bg-purple-500/10 text-purple-600" :
                                                "bg-blue-500/10 text-blue-600"
                                            )}>
                                                {getRuleIcon(rule.rule_type, rule.configuration)}
                                            </div>
                                            
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-foreground">{rule.name}</h4>
                                                    {!rule.is_active && (
                                                        <span className="text-[9px] bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded uppercase font-black tracking-widest">Disabled</span>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                    <span>{rule.rule_type}</span>
                                                    {rule.configuration?.frequency && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                            <span>{rule.configuration.frequency}</span>
                                                        </>
                                                    )}
                                                    {rule.next_run_at && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-border" />
                                                            <span className="flex items-center gap-1">
                                                                <Calendar size={10} />
                                                                Next: {formatDate(rule.next_run_at)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!isClosed && rule.rule_type !== RULE_TYPE.CATEGORIZATION && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleExecute(rule.rule_id)}
                                                    className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                                    title="Execute Now"
                                                >
                                                    <Play size={14} /> Execute
                                                </Button>
                                            )}

                                            {!isClosed && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setRuleToEdit(rule);
                                                        setIsFormOpen(true);
                                                    }}
                                                    className="h-8 text-xs text-muted-foreground hover:text-foreground bg-muted/50 rounded-lg"
                                                >
                                                    Edit
                                                </Button>
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setRuleToDelete(rule)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                                title="Delete Rule"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        );
                    })}
                </div>
            )}
            </Card>
            <ConfirmModal
                isOpen={Boolean(ruleToDelete)}
                onClose={() => setRuleToDelete(null)}
                onConfirm={handleDelete}
                title="Delete rule?"
                message={`“${ruleToDelete?.name || 'This rule'}” will stop running and cannot be recovered.`}
                confirmText="Delete rule"
                variant="danger"
            />
        </div>
    );
}
