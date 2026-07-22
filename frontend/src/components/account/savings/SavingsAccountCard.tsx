import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import type { Account } from '../../../types';
import AccountBadges from '../common/AccountBadges';
import { formatCurrency } from '../../../lib/format';

interface SavingsAccountCardProps {
    account: Account;
    balance: number;
    symbol: string;
    onClick: () => void;
}

export default function SavingsAccountCard({ account, balance, symbol, onClick }: SavingsAccountCardProps) {
    return (
        <Card
            className="group cursor-pointer hover:border-primary/50 transition duration-300 relative overflow-hidden"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {account.account_name || `Account #${account.account_id}`}
                    </CardTitle>
                </div>
                <AccountBadges account={account} className="mt-1" />
            </CardHeader>
            <CardContent>
                {account.savings_account?.interest_rate && (
                    <p className="text-xs text-green-600 dark:text-green-500 font-medium mb-2">
                        {account.savings_account.interest_rate}% APY
                    </p>
                )}
                <div className="text-sm text-muted-foreground flex justify-between pt-2 border-t border-border/50 mt-2">
                    <span>Current Value:</span>
                    <span
                        className={`text-xl font-black tabular-nums ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}
                        title={formatCurrency(balance, { currency: account.currency, symbol, decimals: 2 })}
                    >
                        {formatCurrency(balance, { currency: account.currency, symbol, compact: true, decimals: 2 })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
