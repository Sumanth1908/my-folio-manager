import { Wand2, Play, Power, Pencil, Trash2 } from 'lucide-react';
import type { Rule } from '../../../types';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/utils';
import { TRANSACTION_TYPE, RULE_TYPE } from '../../../constants';
import LoadingSpinner from '../../common/LoadingSpinner';

interface AccountRulesProps {
    rules: Rule[] | undefined;
    isLoading: boolean;
    symbol: string;
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
    onExecute,
    onToggle,
    onEdit,
    onDelete,
    isExecuting = false
}: AccountRulesProps) {
    return (
        <>
            {isLoading ? (
                <div className="py-12 flex justify-center">
                    <LoadingSpinner />
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {rules?.map(rule => (
                        <div key={rule.rule_id} className="group p-6 hover:bg-muted/30 transition-all flex justify-between items-center">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-black text-foreground text-base">{rule.name}</h3>
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border",
                                        rule.is_active
                                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                            : "bg-muted text-muted-foreground border-border"
                                    )}>
                                        {rule.is_active ? 'Active' : 'Paused'}
                                    </span>
                                    <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                        {rule.rule_type}
                                    </span>
                                </div>
                                <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                    {rule.rule_type === RULE_TYPE.CATEGORIZATION ? (
                                        <div className="flex items-center gap-2">
                                            <span>If</span>
                                            <span className="text-foreground bg-background px-1.5 py-0.5 rounded border border-border/50 normal-case font-medium">"{rule.description_contains}"</span>
                                            <span>→</span>
                                            <span className="text-primary">{rule.category_name}</span>
                                        </div>
                                    ) : rule.rule_type === RULE_TYPE.CALCULATION ? (
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary">{rule.frequency}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded border border-border/50 text-[10px] font-bold">
                                                {rule.formula}
                                            </span>
                                            {rule.next_run_at && (
                                                <span className="ml-2 text-[10px] text-primary/70 italic lowercase">
                                                    next: {new Date(rule.next_run_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="text-primary">{rule.frequency}</span>
                                            <span className="text-muted-foreground/30">•</span>
                                            <span className={cn(
                                                rule.target_account_id ? 'text-primary' :
                                                    rule.transaction_type === TRANSACTION_TYPE.CREDIT ? 'text-emerald-500' : 'text-rose-500'
                                            )}>
                                                {rule.target_account_id ? 'TRANSFER' : rule.transaction_type} {symbol}{rule.transaction_amount}
                                            </span>
                                            {rule.next_run_at && (
                                                <span className="ml-2 text-[10px] text-primary/70 italic lowercase">
                                                    next: {new Date(rule.next_run_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {((rule.rule_type === RULE_TYPE.TRANSACTION) || (rule.rule_type === RULE_TYPE.CALCULATION)) && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onExecute(rule.rule_id)}
                                        disabled={isExecuting}
                                        className="h-8 gap-1.5 text-[9px] font-black uppercase tracking-widest border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                                    >
                                        <Play size={10} fill="currentColor" />
                                        {isExecuting ? 'Running...' : 'Run'}
                                    </Button>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onToggle(rule)}
                                    className={cn(
                                        "h-8 w-8 transition-colors rounded-lg",
                                        rule.is_active ? "text-muted-foreground hover:text-foreground hover:bg-muted" : "text-emerald-500 hover:bg-emerald-500/10"
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
                            </div>
                        </div>
                    ))}
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
