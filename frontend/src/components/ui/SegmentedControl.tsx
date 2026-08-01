import { cn } from '../../lib/utils';

interface SegmentedOption<T extends string> {
    value: T;
    label: string;
}

interface SegmentedControlProps<T extends string> {
    value: T;
    onValueChange: (value: T) => void;
    options: readonly SegmentedOption<T>[];
    label: string;
    className?: string;
}

export function SegmentedControl<T extends string>({ value, onValueChange, options, label, className }: SegmentedControlProps<T>) {
    return (
        <div className={cn('inline-flex h-10 items-center rounded-md border border-border bg-muted/60 p-1', className)} role="group" aria-label={label}>
            {options.map((option) => {
                const selected = option.value === value;
                return (
                    <button
                        key={option.value}
                        type="button"
                        onClick={() => onValueChange(option.value)}
                        aria-pressed={selected}
                        className={cn(
                            'h-8 rounded-sm px-3 text-xs font-semibold transition-colors',
                            selected
                                ? 'bg-primary text-primary-foreground shadow-sm'
                                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground',
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );
}
