import { Trash2, Pencil, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import type { Account, Currency } from '../../../types';
import { useAppSelector } from '../../../store/hooks';
import type { RootState } from '../../../store';
import { useExchangeRate } from '../../../hooks/useExchangeRate';
import { formatCurrency } from '../../../lib/format';
import AccountBadges from './AccountBadges';

interface AccountInfoCardProps {
    account: Account;
    balance: number;
    currencies: Currency[] | undefined;
    onDelete: () => void;
    onEdit: () => void;
    onClose?: () => void;
}

export default function AccountInfoCard({ account, balance, currencies, onDelete, onEdit, onClose }: AccountInfoCardProps) {
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
                    <h1 className="text-4xl font-black tracking-tight text-foreground">{account.account_name}</h1>
                    <AccountBadges account={account} />
                </div>

                <div className="flex flex-col items-end gap-4">
                    <div className="flex items-center gap-1 -mr-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onEdit}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Edit Account"
                        >
                            <Pencil size={16} />
                        </Button>
                        {onClose && (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={onClose}
                                className="text-muted-foreground hover:text-emerald-500 transition-colors"
                                title="Close Loan"
                            >
                                <CheckCircle2 size={16} />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onDelete}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Delete Account"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>

                    <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1">
                            {account.account_type === 'INVESTMENT' ? 'Portfolio Value' : 'Current Balance'}
                        </p>
                        <div className={cn(
                            "text-4xl font-black tabular-nums tracking-tighter",
                            balance >= 0 ? 'text-foreground' : 'text-destructive'
                        )}>
                            {formatCurrency(balance, { currency, symbol, decimals: 2 })}
                        </div>
                        {isConversionEnabled && convertedBalance !== null && (
                            <div className="text-xs font-bold text-muted-foreground/60 mt-1 flex items-center justify-end gap-2">
                                {isRateLoading ? (
                                    <div className="animate-pulse h-4 w-20 bg-muted rounded" />
                                ) : (
                                    <>
                                        <span>≈ {formatCurrency(convertedBalance, { currency: targetCurrency, symbol: convertedSymbol, decimals: 2 })}</span>
                                        <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]" title={`Rate: 1 ${currency} = ${rate} ${targetCurrency}`}>
                                            {targetCurrency}
                                        </span>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}
