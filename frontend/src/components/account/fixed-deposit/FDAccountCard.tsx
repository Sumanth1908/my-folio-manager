import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import type { Account } from '../../../types';
import AccountBadges from '../common/AccountBadges';

interface FDAccountCardProps {
    account: Account;
    balance: number;
    symbol: string;
    onClick: () => void;
}

export default function FDAccountCard({ account, balance, symbol, onClick }: FDAccountCardProps) {
    return (
        <Card
            key={account.account_id}
            className="group cursor-pointer hover:border-primary/50 transition duration-300 relative overflow-hidden"
            onClick={onClick}
        >
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl group-hover:text-primary dark:group-hover:text-primary transition-colors">
                        {account.account_name || `Account #${account.account_id}`}
                    </CardTitle>

                </div>
                <AccountBadges account={account} className="mt-1" />
            </CardHeader>
            <CardContent>
                <div className="space-y-1 mt-2">
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Principal:</span>
                        <span className="font-bold text-foreground tabular-nums">{symbol}{account.fixed_deposit_account?.principal_amount?.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Interest Rate:</span>
                        <span className="font-bold text-green-600 dark:text-green-500">{account.fixed_deposit_account?.interest_rate}%</span>
                    </div>
                    <div className="text-sm text-muted-foreground flex justify-between pt-2 border-t border-border/50 mt-2">
                        <span>Current Value:</span>
                        <span className="font-black text-foreground tabular-nums">{symbol}{balance.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
