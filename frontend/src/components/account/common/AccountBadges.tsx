import { cn } from '../../../lib/utils';
import type { Account } from '../../../types';

interface AccountBadgesProps {
    account: Account;
    className?: string;
}

export default function AccountBadges({ account, className }: AccountBadgesProps) {
    return (
        <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            <span className="px-2 py-0.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-[9px] font-bold uppercase tracking-wide">
                {account.account_type}
            </span>
            <span className="px-2 py-0.5 bg-violet-600 dark:bg-violet-500 text-white rounded-full text-[9px] font-bold uppercase tracking-wide">
                {account.currency}
            </span>
            {account.status && (
                <span className={cn(
                    "px-2 py-0.5 text-white rounded-full text-[9px] font-bold uppercase tracking-wide",
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
