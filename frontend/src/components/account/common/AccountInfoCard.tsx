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
        <Card className="bg-muted/20 p-4 rounded-xl border border-border">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                    <h1 className="text-2xl font-black tracking-tight text-foreground">{account.account_name}</h1>
                    <AccountBadges account={account} />
                </div>

                <div className="flex w-full items-center justify-between gap-3 md:w-auto md:justify-end">
                    <div className="text-left md:text-right">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                            {account.account_type === 'INVESTMENT' ? 'Portfolio Value' : 'Current Balance'}
                        </p>
                        <div className={cn(
                            "text-2xl font-black tabular-nums tracking-tight",
                            balance >= 0 ? 'text-foreground' : 'text-destructive'
                        )}>
                            {formatCurrency(balance, { currency, symbol, decimals: 2 })}
                        </div>
                        {isConversionEnabled && convertedBalance !== null && (
                            <div className="text-[11px] font-semibold text-muted-foreground/70 flex items-center gap-1 md:justify-end">
                                {isRateLoading ? (
                                    <div className="animate-pulse h-3 w-16 bg-muted rounded" />
                                ) : (
                                    <span title={`Rate: 1 ${currency} = ${rate} ${targetCurrency}`}>
                                        ≈ {formatCurrency(convertedBalance, { currency: targetCurrency, symbol: convertedSymbol, decimals: 2 })} {targetCurrency}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5">
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
                </div>
            </div>
        </Card>
    );
}
