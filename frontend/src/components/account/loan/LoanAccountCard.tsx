import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import type { Account } from '../../../types';
import AccountBadges from '../common/AccountBadges';

interface LoanAccountCardProps {
    account: Account;
    symbol: string;
    onClick: () => void;
}

export default function LoanAccountCard({ account, symbol, onClick }: LoanAccountCardProps) {
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
                        <span className="font-bold text-foreground tabular-nums">{symbol}{account.loan_account?.loan_amount?.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Outstanding:</span>
                        <span className="font-bold text-destructive tabular-nums">{symbol}{account.loan_account?.outstanding_amount?.toLocaleString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
