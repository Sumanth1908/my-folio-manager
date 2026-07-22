import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import type { Account } from '../../../types';
import AccountBadges from '../common/AccountBadges';
import { formatCurrency } from '../../../lib/format';

interface LoanAccountCardProps {
    account: Account;
    symbol: string;
    onClick: () => void;
}

export default function LoanAccountCard({ account, symbol, onClick }: LoanAccountCardProps) {
    const money = (value: number | undefined) =>
        formatCurrency(value, { currency: account.currency, symbol, compact: true, decimals: 2 });
    const exact = (value: number | undefined) =>
        formatCurrency(value, { currency: account.currency, symbol, decimals: 2 });

    return (
        <Card
            key={account.account_id}
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
                <div className="space-y-1 mt-2">
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Loan Amount:</span>
                        <span className="font-bold text-foreground tabular-nums" title={exact(account.loan_account?.loan_amount)}>
                            {money(account.loan_account?.loan_amount)}
                        </span>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Outstanding:</span>
                        <span className="font-bold text-destructive tabular-nums" title={exact(account.loan_account?.outstanding_amount)}>
                            {money(account.loan_account?.outstanding_amount)}
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
