import { useState, useEffect, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { type Rule, type RuleType, type Frequency } from '../../types';
import { RULE_TYPE, FREQUENCY, TRANSACTION_TYPE, ACCOUNT_TYPE } from '../../constants';
import { Button } from '../ui/Button';
import { Switch } from '../ui/Switch';
import { cn } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { type RootState } from '../../store';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import { fetchAccounts } from '../../store/slices/accountsSlice';
import { createRule, updateRule } from '../../store/slices/rulesSlice';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../ui/Select';

interface RuleFormProps {
    accountId?: string | null;
    ruleToEdit?: Rule | null;
    onSuccess: () => void;
    onCancel: () => void;
}

interface RuleFormData {
    name: string;
    ruleType: RuleType;
    isActive: boolean;
    descriptionContains: string;
    categoryId: string;
    frequency: Frequency;
    amount: string;
    txType: typeof TRANSACTION_TYPE.DEBIT | typeof TRANSACTION_TYPE.CREDIT | typeof TRANSACTION_TYPE.TRANSFER;
    transferDirection: 'OUT' | 'IN';
    transferOtherAccountId: string;
    formula: string;
    endDate: string;
}

// Normalize transaction type
const normalizeTransactionType = (rawType?: string) => {
    const normalized = rawType?.toString().trim().toUpperCase();
    if (normalized === 'CREDIT') return TRANSACTION_TYPE.CREDIT;
    if (normalized === 'TRANSFER') return TRANSACTION_TYPE.TRANSFER;
    return TRANSACTION_TYPE.DEBIT;
};

// Helper to get UTC YYYY-MM-DDTHH:mm from a UTC string
const getUTCDateTimeString = (utcString: string) => {
    if (!utcString) return '';
    // If it's already a timestamp, just slice it. If not, it shouldn't be here.
    return utcString.substring(0, 16).replace(' ', 'T');
};

// Create initial form data from rule
const createInitialFormData = (rule?: Rule | null, accountId?: string): RuleFormData => {
    const config = rule?.configuration || {};
    
    let transferDirection: 'OUT' | 'IN' = 'OUT';
    let transferOtherAccountId = '';
    
    if (config.source_account_id || config.target_account_id) {
        const ownerId = rule?.account_id || accountId;
        if (config.source_account_id === ownerId) {
            transferDirection = 'OUT';
            transferOtherAccountId = config.target_account_id || '';
        } else if (config.target_account_id === ownerId) {
            transferDirection = 'IN';
            transferOtherAccountId = config.source_account_id || '';
        } else {
            // Fallback if rule doesn't belong to either (should not happen normally)
            transferDirection = 'OUT';
            transferOtherAccountId = config.target_account_id || '';
        }
    }

    return {
        name: rule?.name ?? '',
        ruleType: rule?.rule_type ?? RULE_TYPE.TRANSACTION,
        isActive: rule?.is_active ?? true,
        descriptionContains: config.description_contains ?? '',
        categoryId: config.category_id?.toString() ?? '',
        frequency: (config.frequency as Frequency) ?? FREQUENCY.MONTHLY,
        amount: config.transaction_amount?.toString() ?? '',
        txType: (config.source_account_id || config.target_account_id) 
            ? TRANSACTION_TYPE.TRANSFER 
            : (config.is_debit === false || normalizeTransactionType(config.transaction_type) === TRANSACTION_TYPE.CREDIT 
                ? TRANSACTION_TYPE.CREDIT 
                : TRANSACTION_TYPE.DEBIT),
        nextRunAt: rule?.next_run_at
            ? getUTCDateTimeString(rule.next_run_at)
            : new Date().toISOString().split('T')[0] + 'T10:00', // Default to 10 AM UTC for new rules
        transferDirection,
        transferOtherAccountId,
        formula: config.formula ?? '',
        endDate: config.end_date ? config.end_date.split('T')[0] : ''
    };
};

const FORMULA_VARIABLES = {
    [ACCOUNT_TYPE.SAVINGS]: [
        { name: 'balance', desc: 'Current Account Balance' },
        { name: 'interest_rate', desc: 'Annual Interest Rate (%)' },
        { name: 'min_balance', desc: 'Minimum Balance Requirement' },
        { name: 'days', desc: 'Days elapsed since last run' }
    ],
    [ACCOUNT_TYPE.LOAN]: [
        { name: 'outstanding_amount', desc: 'Current Outstanding Balance' },
        { name: 'loan_amount', desc: 'Original Loan Amount' },
        { name: 'interest_rate', desc: 'Annual Interest Rate (%)' },
        { name: 'days', desc: 'Days elapsed since last run' }
    ],
    [ACCOUNT_TYPE.FIXED_DEPOSIT]: [
        { name: 'principal_amount', desc: 'Principal Deposited Amount' },
        { name: 'interest_rate', desc: 'Annual Interest Rate (%)' },
        { name: 'days', desc: 'Days elapsed since last run' }
    ],
    [ACCOUNT_TYPE.RECURRING_DEPOSIT]: [
        { name: 'balance', desc: 'Current Account Balance' },
        { name: 'deposit_amount', desc: 'Monthly Deposit Amount' },
        { name: 'interest_rate', desc: 'Annual Interest Rate (%)' },
        { name: 'days', desc: 'Days elapsed since last run' }
    ],
    [ACCOUNT_TYPE.INVESTMENT]: [
        { name: 'balance', desc: 'Current Cash Balance' },
        { name: 'days', desc: 'Days elapsed since last run' }
    ]
};

const RuleForm = ({ accountId, ruleToEdit, onSuccess, onCancel }: RuleFormProps) => {
    const dispatch = useAppDispatch();
    const { items: categories } = useAppSelector((state: RootState) => state.categories);
    const { items: accounts } = useAppSelector((state: RootState) => state.accounts);

    const [selectedAccountId, setSelectedAccountId] = useState<string>(ruleToEdit?.account_id || accountId || '');
    const [formData, setFormData] = useState<RuleFormData>(() => createInitialFormData(ruleToEdit, ruleToEdit?.account_id || accountId));

    // Memoized update handler
    const updateField = useCallback(<K extends keyof RuleFormData>(field: K, value: RuleFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Filter accounts excluding current
    const availableTargetAccounts = useMemo(
        () => accounts.filter(a => a.account_id !== selectedAccountId),
        [accounts, selectedAccountId]
    );

    const currentAccount = useMemo(
        () => accounts.find(a => a.account_id === selectedAccountId),
        [accounts, selectedAccountId]
    );

    // Fetch data on mount if needed
    useEffect(() => {
        if (!categories.length) dispatch(fetchCategories());
        if (!accounts.length) dispatch(fetchAccounts());
    }, [dispatch, categories.length, accounts.length]);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccountId) {
            toast.error('Please select an account for this rule');
            return;
        }

        const { name, ruleType, isActive, descriptionContains, categoryId, frequency, amount, txType, nextRunAt, transferDirection, transferOtherAccountId, formula, endDate } = formData;

        const payload: Record<string, unknown> = {
            account_id: selectedAccountId,
            name,
            rule_type: ruleType,
            is_active: isActive,
            configuration: {}
        };

        const config = payload.configuration as Record<string, unknown>;

        if (ruleType === RULE_TYPE.CATEGORIZATION) {
            if (!descriptionContains || !categoryId) return;
            config.description_contains = descriptionContains;
            config.category_id = Number(categoryId);
        } else {
            // Automation or Calculation
            if (!nextRunAt) return;

            config.frequency = frequency;
            // Append Z to force UTC interpretation of the local-datetime input string
            payload.next_run_at = new Date(nextRunAt + ':00Z').toISOString();
            if (endDate) config.end_date = new Date(endDate + 'T00:00:00Z').toISOString();
            if (categoryId) config.category_id = Number(categoryId);

            if (txType !== TRANSACTION_TYPE.TRANSFER) {
                config.transaction_type = txType;
            }

            if (ruleType === RULE_TYPE.CALCULATION) {
                if (!formula) return;
                config.formula = formula;
            } else {
                if (!amount) return;
                config.transaction_amount = parseFloat(amount);
            }

            if (txType === TRANSACTION_TYPE.TRANSFER) {
                if (!transferOtherAccountId) {
                    toast.error('Please select the other account for the transfer');
                    return;
                }
                config.source_account_id = transferDirection === 'OUT' ? selectedAccountId : transferOtherAccountId;
                config.target_account_id = transferDirection === 'OUT' ? transferOtherAccountId : selectedAccountId;
            }
        }

        try {
            if (ruleToEdit) {
                await dispatch(updateRule({ id: ruleToEdit.rule_id, data: payload, accountId })).unwrap();
                toast.success('Rule updated!');
            } else {
                await dispatch(createRule(payload)).unwrap();
                toast.success('Rule created!');
            }
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to save rule');
        }
    }, [formData, accountId, ruleToEdit, dispatch, onSuccess]);

    const isCategorization = formData.ruleType === RULE_TYPE.CATEGORIZATION;
    const isTransfer = formData.txType === TRANSACTION_TYPE.TRANSFER;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rule Type Toggle */}
            <div className="flex bg-muted p-1 rounded-2xl mb-6">
                {[
                    { type: RULE_TYPE.CATEGORIZATION, label: 'Categorization' },
                    { type: RULE_TYPE.TRANSACTION, label: 'Automation' },
                    { type: RULE_TYPE.CALCULATION, label: 'Formula' }
                ].map(({ type, label }) => (
                    <button
                        key={type}
                        type="button"
                        onClick={() => updateField('ruleType', type)}
                        className={cn(
                            "flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors",
                            formData.ruleType === type
                                ? "bg-background text-primary shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* Account Selector (only if not pre-provided) */}
            {!accountId && (
                <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                        Rule Owner Account
                    </label>
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId} disabled={!!ruleToEdit}>
                        <SelectTrigger className="w-full h-14 rounded-2xl bg-background border-border disabled:opacity-50">
                            <SelectValue placeholder="Select an Account" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Accounts</SelectLabel>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.account_id} value={acc.account_id}>
                                        {acc.account_name}
                                    </SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {/* Rule Name */}
            <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                    Rule Identifier
                </label>
                <input
                    type="text"
                    placeholder="e.g. Monthly Rent"
                    value={formData.name}
                    onChange={e => updateField('name', e.target.value)}
                    className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                    required
                />
            </div>

            {isCategorization ? (
                /* Categorization Fields */
                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            If Description Contains
                        </label>
                        <input
                            type="text"
                            placeholder="e.g. NETFLIX"
                            value={formData.descriptionContains}
                            onChange={e => updateField('descriptionContains', e.target.value)}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none transition text-foreground font-bold"
                            required
                        />
                        <p className="text-[9px] font-bold text-muted-foreground/50 ml-1 uppercase tracking-tighter italic">
                            Matched case-insensitively during ingestion
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Target Category
                        </label>
                        <Select value={formData.categoryId} onValueChange={v => updateField('categoryId', v)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    {categories.map(({ category_id, name }) => (
                                        <SelectItem key={category_id} value={category_id.toString()}>
                                            {name}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                /* Automation Fields - 3 Column Layout */
                <div className="grid grid-cols-3 gap-5">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Frequency
                        </label>
                        <Select value={formData.frequency} onValueChange={v => updateField('frequency', v as Frequency)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Frequency" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Frequency</SelectLabel>
                                    {Object.values(FREQUENCY).map(f => (
                                        <SelectItem key={f} value={f}>{f}</SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Direction
                        </label>
                        <Select value={formData.txType} onValueChange={v => updateField('txType', v as typeof formData.txType)}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Direction" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Type</SelectLabel>
                                    <SelectItem value={TRANSACTION_TYPE.DEBIT}>DEBIT</SelectItem>
                                    <SelectItem value={TRANSACTION_TYPE.CREDIT}>CREDIT</SelectItem>
                                    <SelectItem value={TRANSACTION_TYPE.TRANSFER}>TRANSFER</SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Execution Day
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.nextRunAt}
                            onChange={e => updateField('nextRunAt', e.target.value)}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold h-11"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Expiry Date (Optional)
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={e => updateField('endDate', e.target.value)}
                            className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold h-11"
                        />
                    </div>

                    {isTransfer && (
                        <>
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    Transfer Direction
                                </label>
                                <Select value={formData.transferDirection} onValueChange={v => updateField('transferDirection', v as 'OUT' | 'IN')}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Direction" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Direction</SelectLabel>
                                            <SelectItem value="OUT">Send To (Debit)</SelectItem>
                                            <SelectItem value="IN">Receive From (Credit)</SelectItem>
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-2 space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {formData.transferDirection === 'OUT' ? 'Destination Account' : 'Source Account'}
                                </label>
                                <Select value={formData.transferOtherAccountId} onValueChange={v => updateField('transferOtherAccountId', v)}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Account" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectLabel>Accounts</SelectLabel>
                                            {availableTargetAccounts.map(({ account_id, account_name }) => (
                                                <SelectItem key={account_id} value={account_id}>{account_name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </>
                    )}

                    <div className={cn(formData.ruleType === RULE_TYPE.CALCULATION ? "col-span-2" : "col-span-1", "space-y-2")}>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            {formData.ruleType === RULE_TYPE.CALCULATION ? 'Calculation Formula' : 'Fixed Amount'}
                        </label>
                        {formData.ruleType === RULE_TYPE.CALCULATION ? (
                            <input
                                type="text"
                                placeholder="balance * 0.05 / 365 * days"
                                value={formData.formula}
                                onChange={e => updateField('formula', e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-mono font-bold h-11"
                                required
                            />
                        ) : (
                            <input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => updateField('amount', e.target.value)}
                                className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-2 focus:ring-primary outline-none text-foreground font-bold h-11"
                                required
                            />
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                            Category (Optional)
                        </label>
                        <Select
                            value={formData.categoryId || 'none'}
                            onValueChange={v => updateField('categoryId', v === 'none' ? '' : v)}
                        >
                            <SelectTrigger className="w-full h-11">
                                <SelectValue placeholder="N/A" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    <SelectLabel>Categories</SelectLabel>
                                    <SelectItem value="none">N/A</SelectItem>
                                    {categories.map(({ category_id, name }) => (
                                        <SelectItem key={category_id} value={category_id.toString()}>
                                            {name.toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.ruleType === RULE_TYPE.CALCULATION && currentAccount && (
                        <div className="col-span-3 bg-primary/5 rounded-lg border border-primary/10 overflow-hidden">
                            <div className="px-3 py-2 bg-primary/5 flex justify-between items-center border-b border-primary/5">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    Available Variables
                                </p>
                                <span className="text-[9px] font-mono text-muted-foreground bg-background/50 px-1.5 rounded">
                                    +, -, *, /, **
                                </span>
                            </div>
                            <div className="p-2 gap-1.5 grid grid-cols-3 max-h-[120px] overflow-y-auto">
                                {FORMULA_VARIABLES[currentAccount.account_type]?.map(v => (
                                    <div key={v.name} className="flex flex-col bg-background/40 p-1.5 rounded border border-primary/5">
                                        <span className="font-mono text-[10px] font-bold text-foreground">{v.name}</span>
                                        <span className="text-[8px] text-muted-foreground uppercase tracking-tight truncate" title={v.desc}>{v.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Active Toggle */}
            <div className="flex items-center gap-3 p-2 ml-1">
                <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={checked => updateField('isActive', checked)}
                />
                <label
                    htmlFor="isActive"
                    className="text-xs font-black uppercase tracking-widest text-foreground/70 cursor-pointer select-none"
                >
                    Enable Rule
                </label>
            </div>

            {/* Actions */}
            <div className="pt-6 flex justify-end gap-3 border-t border-border/50">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    Dismiss
                </Button>
                <Button type="submit">
                    Save Configuration
                </Button>
            </div>
        </form>
    );
};

export default RuleForm;
