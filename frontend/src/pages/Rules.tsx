import { useEffect, useState, useMemo } from 'react';
import { Plus, Tag, RefreshCw, Calendar, Trash2, ArrowRightLeft, Calculator, Play } from 'lucide-react';
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
import toast from 'react-hot-toast';

export default function Rules() {
    const dispatch = useAppDispatch();
    const { items: rules, loading } = useAppSelector((state: RootState) => state.rules);
    const { items: accounts, loading: accountsLoading } = useAppSelector((state: RootState) => state.accounts);
    
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [ruleToEdit, setRuleToEdit] = useState<Rule | null>(null);

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
            toast.error(error?.message || 'Failed to execute rule');
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

    const handleDelete = async (ruleId: number) => {
        if (!window.confirm('Are you sure you want to delete this rule?')) return;
        try {
            await dispatch(deleteRule({ id: ruleId, accountId: null })).unwrap();
            toast.success('Rule deleted');
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

    // Group rules by account
    const groupedRules = useMemo(() => {
        const groups: Record<string, Rule[]> = {};
        rules.forEach(rule => {
            if (!groups[rule.account_id]) {
                groups[rule.account_id] = [];
            }
            groups[rule.account_id].push(rule);
        });
        return groups;
    }, [rules]);

    if (loading || accountsLoading) {
        return (
            <div className="flex h-[calc(100vh-5rem)] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Loading Rules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 min-h-screen pb-20">
            <Card className="p-8 border-border/50 bg-background/90 text-foreground">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Automated Rules</h1>
                        <p className="text-muted-foreground text-sm mt-1">Manage categorizations, transfers, and calculations across all accounts.</p>
                    </div>
                    <div className="flex gap-4">
                        <Button 
                            onClick={handleTriggerAutomation}
                            variant="outline"
                            className="gap-2 px-6 h-12 rounded-2xl transition-all font-bold"
                        >
                            <RefreshCw size={18} />
                            Run Due Rules
                        </Button>
                        <Button 
                            onClick={() => setIsFormOpen(true)}
                            className="gap-2 px-6 h-12 bg-primary text-primary-foreground rounded-2xl shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all font-bold"
                        >
                            <Plus size={18} />
                            Create Rule
                        </Button>
                    </div>
                </div>

            <Modal
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                title={ruleToEdit ? 'Edit Rule' : 'New Rule'}
                maxWidth="max-w-2xl"
            >
                <RuleForm 
                    ruleToEdit={ruleToEdit}
                    onSuccess={handleCloseForm}
                    onCancel={handleCloseForm}
                />
            </Modal>

            {rules.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border border-border/50 border-dashed rounded-3xl">
                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <RefreshCw className="text-muted-foreground" size={24} />
                    </div>
                    <h3 className="text-xl font-black text-foreground mb-2">No Rules Found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">Create rules to automatically categorize transactions, transfer funds, or calculate interest across your accounts.</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {Object.entries(groupedRules).map(([accountId, accountRules]) => (
                        <div key={accountId} className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-border/50">
                                <h2 className="text-xl font-bold text-foreground">
                                    {getAccountName(accountId)}
                                </h2>
                                <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-bold uppercase tracking-widest text-muted-foreground">
                                    {accountRules.length} Rules
                                </span>
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
                                            {rule.rule_type !== RULE_TYPE.CATEGORIZATION && (
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
                                            
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(rule.rule_id)}
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
                    ))}
                </div>
            )}
            </Card>
        </div>
    );
}
