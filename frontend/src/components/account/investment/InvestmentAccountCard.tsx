import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { cn } from '../../../lib/utils';
import type { Account } from '../../../types';

interface InvestmentAccountCardProps {
    account: Account;
    balance: number;
    symbol: string;
    onClick: () => void;
}

export default function InvestmentAccountCard({ account, balance, symbol, onClick }: InvestmentAccountCardProps) {
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
                <div className="flex items-center gap-2 mt-1">
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
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-black tabular-nums ${balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                    {symbol}{balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
            </CardContent>
        </Card>
    );
}
