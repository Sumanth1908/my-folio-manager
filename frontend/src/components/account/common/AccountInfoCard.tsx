import { Trash2, Pencil } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import type { Account, Currency } from '../../../types';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { useExchangeRate } from '../../../hooks/useExchangeRate';

interface AccountInfoCardProps {
    account: Account;
    balance: number;
    currencies: Currency[] | undefined;
    onDelete: () => void;
    onEdit: () => void;
}

export default function AccountInfoCard({ account, balance, currencies, onDelete, onEdit }: AccountInfoCardProps) {
    const { data: settings } = useAppSelector((state: RootState) => state.settings);
    const targetCurrency = settings?.default_currency;
    const currency = account.currency;
    const { convert, isEnabled: isConversionEnabled, rate, isLoading: isRateLoading } = useExchangeRate(currency, targetCurrency);

    const symbol = currencies?.find(c => c.code === currency)?.symbol || currency || '$';
    const convertedBalance = convert(balance);
    const convertedSymbol = currencies?.find(c => c.code === targetCurrency)?.symbol || targetCurrency;

    return (
        <Card className="bg-muted/30 p-8 rounded-2xl border border-border space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-3">
                    <div className="flex items-center gap-3">
                        <h1 className="text-4xl font-black tracking-tight text-foreground">{account.account_name}</h1>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onEdit}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Account"
                        >
                            <Pencil size={18} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Account"
                        >
                            <Trash2 size={18} />
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {account.account_type}
                        </span>
                        <span className="px-3 py-1 bg-violet-500/10 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border border-violet-500/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {account.currency}
                        </span>
                        {account.status && (
                            <span className={cn(
                                "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border",
                                account.status === 'Active'
                                    ? "bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                                    : "bg-muted text-muted-foreground border-border"
                            )}>
                                {account.status}
                            </span>
                        )}
                    </div>
                </div>

                <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">Current Balance</p>
                    <div className={cn(
                        "text-4xl font-black tabular-nums tracking-tighter",
                        balance >= 0 ? 'text-foreground' : 'text-destructive'
                    )}>
                        {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    {isConversionEnabled && convertedBalance !== null && (
                        <div className="text-xs font-bold text-muted-foreground/60 mt-1 flex items-center justify-end gap-2">
                            {isRateLoading ? (
                                <div className="animate-pulse h-4 w-20 bg-muted rounded" />
                            ) : (
                                <>
                                    <span>≈ {convertedSymbol}{convertedBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]" title={`Rate: 1 ${currency} = ${rate} ${targetCurrency}`}>
                                        {targetCurrency}
                                    </span>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
}
