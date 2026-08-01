import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageToolbarProps {
    children: ReactNode;
    className?: string;
    sticky?: boolean;
    label?: string;
}

export function PageToolbar({ children, className, sticky = true, label = 'Page controls' }: PageToolbarProps) {
    return (
        <div
            role="toolbar"
            aria-label={label}
            className={cn(
                'rounded-lg border border-border bg-card/95 p-3 shadow-sm backdrop-blur-md',
                sticky && 'lg:sticky lg:top-0 lg:z-30',
                className,
            )}
        >
            {children}
        </div>
    );
}
