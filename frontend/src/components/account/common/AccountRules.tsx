import { useState } from 'react';
import { Wand2, Play, Power, Pencil, Trash2, Eye, History } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Rule, RuleExecution, RulePreview } from '../../../types';
import api, { handleApiError } from '../../../api';
import { Button } from '../../ui/Button';
import { cn, formatDate } from '../../../lib/utils';
import { formatCurrency } from '../../../lib/format';
import { TRANSACTION_TYPE, RULE_TYPE } from '../../../constants';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';

interface AccountRulesProps {
    rules: Rule[] | undefined;
    isLoading: boolean;
    symbol: string;
    accountId: string;
    onExecute: (id: number) => void;
    onToggle: (rule: Rule) => void;
    onEdit: (rule: Rule) => void;
    onDelete: (id: number) => void;
    isExecuting?: boolean;
}

export default function AccountRules({
    rules,
    isLoading,
    symbol,
    accountId,
    onExecute,
    onToggle,
    onEdit,
    onDelete,
    isExecuting = false
}: AccountRulesProps) {
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);
    const [previewingId, setPreviewingId] = useState<number | null>(null);
    const [historyRuleId, setHistoryRuleId] = useState<number | null>(null);
    const [executions, setExecutions] = useState<RuleExecution[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    const getAccountName = (id: string | undefined) => {
        if (!id) return '';
        const acc = accounts.find(a => a.account_id === id);
        return acc?.account_name || `ID:${id.slice(-4)}`;
    };

    const handlePreview = async (rule: Rule) => {
        setPreviewingId(rule.rule_id);
        try {
            const res = await api.post<RulePreview>(`/rules/${rule.rule_id}/preview`);
            const p = res.data;
            const direction = p.is_debit ? 'debit' : 'credit';
            toast(
                `Dry run: would ${direction} ${formatCurrency(p.amount, { symbol, decimals: 2 })}` +
                (p.period_start && p.period_end
                    ? ` for ${formatDate(p.period_start)} → ${formatDate(p.period_end)} (${p.days} days)`
                    : ''),
                { duration: 6000, icon: '🔍' }
            );
        } catch (error: any) {
            toast.error(handleApiError(error, 'Preview failed'));
        } finally {
            setPreviewingId(null);
        }
    };

    const toggleHistory = async (rule: Rule) => {
        if (historyRuleId === rule.rule_id) {
            setHistoryRuleId(null);
            return;
        }
        setHistoryRuleId(rule.rule_id);
        setHistoryLoading(true);
        try {
            const res = await api.get<RuleExecution[]>(`/rules/${rule.rule_id}/executions`);
            setExecutions(res.data);
        } catch (error: any) {
            toast.error(handleApiError(error, 'Failed to load history'));
            setHistoryRuleId(null);
        } finally {
            setHistoryLoading(false);
        }
    };

    return (
        <>
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {rules?.map(rule => {
                        const isOwner = rule.account_id === accountId;
                        const config = rule.configuration || {};
                        const isSource = config.source_account_id === accountId;
                        const isTarget = config.target_account_id === accountId;
                        
                        let displayLabel = "";
                        let displayColor = "";
                        
                        if (config.target_account_id || config.source_account_id) {
                            if (isOwner) {
                                if (config.source_account_id && config.source_account_id !== accountId) {
                                    displayLabel = `DEBIT FROM: ${getAccountName(config.source_account_id).toUpperCase()}`;
                                    displayColor = "text-emerald-600";
                                } else {
                                    displayLabel = `TRANSFER TO: ${getAccountName(config.target_account_id).toUpperCase()}`;
                                    displayColor = "text-rose-600";
                                }
                            } else if (isTarget) {
                                displayLabel = `TRANSFER IN FROM: ${getAccountName(rule.account_id).toUpperCase()}`;
                                displayColor = "text-emerald-600";
                            } else if (isSource) {
                                displayLabel = `AUTO DEBIT TO: ${getAccountName(rule.account_id).toUpperCase()}`;
                                displayColor = "text-rose-600";
                            }
                        } else {
                            displayLabel = config.transaction_type || '';
                            displayColor = config.transaction_type === TRANSACTION_TYPE.CREDIT ? 'text-emerald-600' : 'text-rose-600';
                        }
                        
                        return (
                            <div key={rule.rule_id} className="group">
                            <div className="p-6 hover:bg-muted/30 transition-all flex justify-between items-center">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-black text-foreground text-base">{rule.name}</h3>
                                        <span className={cn(
                                            "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                            rule.is_active
                                                ? "bg-emerald-600/15 text-emerald-600 border-emerald-600/20"
                                                : "bg-muted text-muted-foreground border-border"
                                        )}>
                                            {rule.is_active ? 'Active' : 'Paused'}
                                        </span>
                                        <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                            {rule.rule_type}
                                        </span>
                                        {!isOwner && (
                                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-muted text-muted-foreground border border-border">
                                                LINKED
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                        {rule.rule_type === RULE_TYPE.CATEGORIZATION ? (
                                            <div className="flex items-center gap-2">
                                                <span>If</span>
                                                <span className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border/50 normal-case font-medium">"{rule.configuration?.description_contains}"</span>
                                                <span>→</span>
                                                <span className="text-primary">{rule.category_name}</span>
                                            </div>
                                        ) : rule.rule_type === RULE_TYPE.CALCULATION ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-primary">{rule.configuration?.frequency}</span>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-bold">
                                                    {rule.configuration?.formula}
                                                </span>
                                                {rule.next_run_at && (
                                                    <span className="ml-2 text-[10px] text-primary/70 italic lowercase">
                                                        next: {formatDate(rule.next_run_at, true)}
                                                    </span>
                                                )}
                                                {rule.configuration?.end_date && (
                                                    <span className="ml-2 text-[10px] text-rose-600/70 italic lowercase">
                                                        ends: {formatDate(rule.configuration.end_date)}
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-primary">{rule.configuration?.frequency}</span>
                                                <span className="text-muted-foreground/30">•</span>
                                                <span className={displayColor}>
                                                    {displayLabel} {formatCurrency(rule.configuration?.transaction_amount, { symbol, decimals: 2 })}
                                                </span>
                                                {rule.next_run_at && (
                                                    <span className="ml-2 text-[10px] text-primary/70 italic lowercase">
                                                        next: {formatDate(rule.next_run_at, true)}
                                                    </span>
                                                )}
                                                {rule.configuration?.end_date && (
                                                    <span className="ml-2 text-[10px] text-rose-600/70 italic lowercase">
                                                        ends: {formatDate(rule.configuration.end_date)}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {((rule.rule_type === RULE_TYPE.TRANSACTION) || (rule.rule_type === RULE_TYPE.CALCULATION)) && isOwner && (
                                        <>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handlePreview(rule)}
                                            disabled={previewingId === rule.rule_id}
                                            className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                            title="Preview (dry run) — shows what would be posted without posting it"
                                        >
                                            <Eye size={14} />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleHistory(rule)}
                                            className={cn(
                                                "h-8 w-8 rounded-lg",
                                                historyRuleId === rule.rule_id
                                                    ? "text-primary bg-primary/10"
                                                    : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                                            )}
                                            title="Execution history"
                                        >
                                            <History size={14} />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => onExecute(rule.rule_id)}
                                            disabled={isExecuting || !rule.is_active}
                                            className="h-8 gap-1.5 text-[9px] font-black uppercase tracking-widest border-emerald-600/20 text-emerald-600 hover:bg-emerald-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Play size={10} fill="currentColor" />
                                            {isExecuting ? 'Running...' : 'Run'}
                                        </Button>
                                        </>
                                    )}
                                    {isOwner && (
                                        <>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onToggle(rule)}
                                                className={cn(
                                                    "h-8 w-8 transition-colors rounded-lg",
                                                    rule.is_active ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-emerald-600 hover:bg-emerald-600/10"
                                                )}
                                                title={rule.is_active ? "Pause Rule" : "Resume Rule"}
                                            >
                                                <Power size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(rule)}
                                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                            >
                                                <Pencil size={14} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(rule.rule_id)}
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                            >
                                                <Trash2 size={14} />
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {historyRuleId === rule.rule_id && (
                                <div className="px-6 pb-5 bg-muted/20 border-t border-border/30">
                                    {historyLoading ? (
                                        <div className="py-4 flex justify-center"><LoadingSpinner size="small" /></div>
                                    ) : executions.length === 0 ? (
                                        <p className="text-[11px] text-muted-foreground py-4 italic">No executions recorded yet.</p>
                                    ) : (
                                        <div className="pt-3 space-y-1.5">
                                            {executions.slice(0, 5).map(exec => (
                                                <div key={exec.execution_id} className="flex items-center justify-between text-[11px] py-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest",
                                                            exec.status === 'SUCCESS' && "bg-emerald-600/15 text-emerald-600",
                                                            exec.status === 'FAILED' && "bg-rose-600/15 text-rose-600",
                                                            exec.status === 'SKIPPED' && "bg-muted text-muted-foreground",
                                                        )}>
                                                            {exec.status}
                                                        </span>
                                                        <span className="text-muted-foreground">{formatDate(exec.ran_at, true)}</span>
                                                        {exec.error && <span className="text-rose-600/80 italic truncate max-w-[300px]">{exec.error}</span>}
                                                    </div>
                                                    {exec.amount != null && (
                                                        <span className="font-bold tabular-nums text-foreground">
                                                            {formatCurrency(Math.abs(Number(exec.amount)), { symbol, decimals: 2 })}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            </div>
                        );
                    })}
                    {(!rules || rules.length === 0) && (
                        <div className="text-center py-20">
                            <Wand2 className="mx-auto text-muted-foreground/30 mb-4" size={32} />
                            <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">No rules configured</p>
                            <p className="text-[10px] text-muted-foreground/50 mt-1 lowercase italic">Automate categorization or transfers</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
