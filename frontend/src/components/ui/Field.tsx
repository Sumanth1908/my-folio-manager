import * as React from 'react';
import { cn } from '../../lib/utils';

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
    label?: string;
    description?: string;
    error?: string;
    htmlFor?: string;
    required?: boolean;
}

function Field({ label, description, error, htmlFor, required, className, children, ...props }: FieldProps) {
    return (
        <div className={cn('space-y-2', className)} {...props}>
            {label && (
                <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
                    {label}{required && <span className="ml-1 text-expense" aria-hidden="true">*</span>}
                </label>
            )}
            {description && <p className="text-xs leading-5 text-muted-foreground">{description}</p>}
            {children}
            {error && <p className="text-xs font-medium text-expense" role="alert">{error}</p>}
        </div>
    );
}

export { Field };
