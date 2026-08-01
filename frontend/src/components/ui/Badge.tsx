import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const badgeVariants = cva(
    'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none',
    {
        variants: {
            variant: {
                neutral: 'border-border bg-muted text-muted-foreground',
                primary: 'border-primary/20 bg-primary/10 text-primary',
                income: 'border-income/20 bg-income-muted text-income',
                expense: 'border-expense/20 bg-expense-muted text-expense',
                warning: 'border-warning/20 bg-warning-muted text-warning',
                outline: 'border-border bg-background text-foreground',
            },
        },
        defaultVariants: { variant: 'neutral' },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
