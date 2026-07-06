import { cn } from '../../../lib/utils';
import type { Account } from '../../../types';

interface AccountBadgesProps {
    account: Account;
    className?: string;
}

export default function AccountBadges({ account, className }: AccountBadgesProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                {account.account_type}
            </span>
            <span className="px-3 py-1 bg-violet-600 dark:bg-violet-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                {account.currency}
            </span>
            {account.status && (
                <span className={cn(
                    "px-3 py-1 text-white rounded-full text-[10px] font-black uppercase tracking-widest",
                    account.status === 'Active'
                        ? "bg-emerald-600 dark:bg-emerald-500"
                        : "bg-slate-500 dark:bg-slate-600"
                )}>
                    {account.status}
                </span>
            )}
        </div>
    );
}
