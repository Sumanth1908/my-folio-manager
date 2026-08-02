import type { Account, Category } from '../../../types';
import {
    FREQUENCY,
    INTEREST_DAY_COUNT,
    INTEREST_TREATMENT,
} from '../../../constants';
import { Switch } from '../../ui/Switch';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../../ui/Select';
import { cn } from '../../../lib/utils';

export interface InterestPolicyFormState {
    enabled: boolean;
    rate: string;
    treatment: 'CAPITALIZE' | 'PAYOUT' | 'INTEREST_DUE';
    settlementFrequency: string;
    dayCount: 'ACTUAL_365' | 'ACTUAL_ACTUAL' | 'THIRTY_360';
    payoutAccountId: string;
    categoryId: string;
}

interface InterestPolicyFieldsProps {
    value: InterestPolicyFormState;
    onChange: (next: InterestPolicyFormState) => void;
    accounts: Account[];
    categories?: Category[];
    currency: string;
    title?: string;
    excludeAccountId?: string;
    allowsMaturitySettlement?: boolean;
    allowSelfPayout?: boolean;
    selfPayoutLabel?: string;
    canDisable?: boolean;
    showDayCount?: boolean;
    advancedTerms?: boolean;
}

export const SELF_PAYOUT_ACCOUNT = '__SELF__';
const NO_INTEREST_CATEGORY = '__NONE__';

export default function InterestPolicyFields({
    value,
    onChange,
    accounts,
    categories = [],
    currency,
    title = 'Interest terms',
    excludeAccountId,
    allowsMaturitySettlement = false,
    allowSelfPayout = false,
    selfPayoutLabel = 'This account (default)',
    canDisable = true,
    showDayCount = true,
    advancedTerms = false,
}: InterestPolicyFieldsProps) {
    const update = <K extends keyof InterestPolicyFormState>(
        key: K,
        nextValue: InterestPolicyFormState[K],
    ) => onChange({ ...value, [key]: nextValue });

    const payoutAccounts = accounts.filter(
        account => account.currency === currency && account.account_id !== excludeAccountId,
    );

    const updateTreatment = (treatment: InterestPolicyFormState['treatment']) => {
        onChange({
            ...value,
            treatment,
            payoutAccountId: treatment === INTEREST_TREATMENT.PAYOUT && allowSelfPayout && !value.payoutAccountId
                ? SELF_PAYOUT_ACCOUNT
                : value.payoutAccountId,
            categoryId: treatment === INTEREST_TREATMENT.PAYOUT ? value.categoryId : '',
        });
    };

    const frequencyField = (
        <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                {value.treatment === INTEREST_TREATMENT.PAYOUT ? 'Payout frequency' : 'Interest compounding'}
            </label>
            <Select value={value.settlementFrequency} onValueChange={frequency => update('settlementFrequency', frequency)}>
                <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Settlement frequency</SelectLabel>
                        <SelectItem value={FREQUENCY.MONTHLY}>Monthly</SelectItem>
                        <SelectItem value={FREQUENCY.QUARTERLY}>Quarterly</SelectItem>
                        <SelectItem value={FREQUENCY.YEARLY}>Yearly</SelectItem>
                        {allowsMaturitySettlement && (
                            <SelectItem value={FREQUENCY.ONE_TIME}>At maturity / one time</SelectItem>
                        )}
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );

    const dayCountField = (
        <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Interest calculation basis
            </label>
            <Select value={value.dayCount} onValueChange={dayCount => update('dayCount', dayCount as InterestPolicyFormState['dayCount'])}>
                <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        <SelectLabel>Day count</SelectLabel>
                        <SelectItem value={INTEREST_DAY_COUNT.ACTUAL_365}>Actual / 365</SelectItem>
                        <SelectItem value={INTEREST_DAY_COUNT.ACTUAL_ACTUAL}>Actual / actual</SelectItem>
                        <SelectItem value={INTEREST_DAY_COUNT.THIRTY_360}>30 / 360</SelectItem>
                    </SelectGroup>
                </SelectContent>
            </Select>
        </div>
    );

    return (
        <section className="space-y-4 rounded-2xl border border-primary/15 bg-primary/[0.03] p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="text-sm font-bold text-foreground">{title}</h4>
                    <p className="text-[11px] text-muted-foreground">
                        Calculated by the managed backend interest engine.
                    </p>
                </div>
                {canDisable && (
                    <Switch checked={value.enabled} onCheckedChange={enabled => update('enabled', enabled)} />
                )}
            </div>

            <div className={cn('space-y-4', !value.enabled && 'pointer-events-none opacity-40')}>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Interest handling
                    </label>
                    <Select
                        value={value.treatment}
                        onValueChange={treatment => updateTreatment(treatment as InterestPolicyFormState['treatment'])}
                    >
                        <SelectTrigger className="h-12 w-full">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>How should interest be handled?</SelectLabel>
                                <SelectItem value={INTEREST_TREATMENT.CAPITALIZE}>Cumulative — add interest to the deposit</SelectItem>
                                <SelectItem value={INTEREST_TREATMENT.PAYOUT}>Non-cumulative — pay interest separately</SelectItem>
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                        {value.treatment === INTEREST_TREATMENT.PAYOUT
                            ? 'Interest is paid on schedule and is not included in later interest calculations.'
                            : 'Interest is added to the balance and earns interest in later periods.'}
                    </p>
                </div>

                <div className={cn(
                    'grid grid-cols-1 gap-4',
                    (!advancedTerms || value.treatment === INTEREST_TREATMENT.PAYOUT) && 'md:grid-cols-2',
                )}>
                    <div>
                        <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Annual rate (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            step="0.0001"
                            value={value.rate}
                            onChange={event => update('rate', event.target.value)}
                            placeholder="0.00"
                            className="date-time-field"
                            required={value.enabled}
                        />
                    </div>
                    {(!advancedTerms || value.treatment === INTEREST_TREATMENT.PAYOUT) && frequencyField}
                </div>

                {value.treatment === INTEREST_TREATMENT.PAYOUT && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Payout account
                            </label>
                            <Select value={value.payoutAccountId} onValueChange={accountId => update('payoutAccountId', accountId)}>
                                <SelectTrigger className="h-12 w-full"><SelectValue placeholder="Select account" /></SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Where should interest be paid?</SelectLabel>
                                        {allowSelfPayout && (
                                            <SelectItem value={SELF_PAYOUT_ACCOUNT}>{selfPayoutLabel}</SelectItem>
                                        )}
                                        {payoutAccounts.map(account => (
                                            <SelectItem key={account.account_id} value={account.account_id}>
                                                {account.account_name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            {allowSelfPayout && value.payoutAccountId === SELF_PAYOUT_ACCOUNT && (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                    Payouts appear in this deposit's ledger, but do not increase the principal used to calculate future interest.
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                Interest category (optional)
                            </label>
                            <Select
                                value={value.categoryId || NO_INTEREST_CATEGORY}
                                onValueChange={categoryId => update(
                                    'categoryId',
                                    categoryId === NO_INTEREST_CATEGORY ? '' : categoryId,
                                )}
                            >
                                <SelectTrigger className="h-12 w-full"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Tag generated payouts</SelectLabel>
                                        <SelectItem value={NO_INTEREST_CATEGORY}>No category</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category.category_id} value={category.category_id.toString()}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {advancedTerms && (
                    <details className="rounded-xl border border-border/60 bg-background/60 p-3">
                        <summary className="cursor-pointer text-xs font-bold text-muted-foreground">
                            Advanced interest terms
                        </summary>
                        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {value.treatment !== INTEREST_TREATMENT.PAYOUT && frequencyField}
                            {showDayCount && dayCountField}
                        </div>
                        <p className="mt-3 text-[10px] text-muted-foreground">
                            Quarterly compounding is the standard default; change it only to match the deposit provider's terms.
                        </p>
                    </details>
                )}

                {showDayCount && !advancedTerms && (
                    <>
                        {dayCountField}

                        <p className="text-[10px] text-muted-foreground">
                            The calculation basis controls how calendar days are converted into a yearly interest fraction.
                        </p>
                    </>
                )}
            </div>
        </section>
    );
}
