import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    leadingIcon?: React.ReactNode;
    containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, leadingIcon, containerClassName, ...props }, ref) => (
        <div className={cn('relative w-full', containerClassName)}>
            {leadingIcon && (
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground [&_svg]:size-4">
                    {leadingIcon}
                </span>
            )}
            <input
                ref={ref}
                type={type}
                className={cn(
                    'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground/70 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
                    (type === 'date' || type === 'time' || type === 'datetime-local') && 'date-time-field',
                    leadingIcon && 'pl-9',
                    className,
                )}
                {...props}
            />
        </div>
    ),
);
Input.displayName = 'Input';

export { Input };
