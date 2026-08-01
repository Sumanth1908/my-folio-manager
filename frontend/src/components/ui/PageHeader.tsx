import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

interface PageHeaderProps {
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    eyebrow?: string;
    className?: string;
}

export function PageHeader({ title, description, actions, eyebrow, className }: PageHeaderProps) {
    return (
        <header className={cn('flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between', className)}>
            <div className="min-w-0">
                {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p>}
            </div>
            {actions && <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end">{actions}</div>}
        </header>
    );
}
