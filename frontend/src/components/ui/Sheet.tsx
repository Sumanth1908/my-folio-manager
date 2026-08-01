import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    children: React.ReactNode;
    side?: 'left' | 'right' | 'bottom';
    className?: string;
    description?: string;
}

export function Sheet({ open, onOpenChange, title, children, side = 'right', className, description }: SheetProps) {
    const sideClasses = {
        left: 'inset-y-0 left-0 h-full w-[88vw] max-w-sm border-r',
        right: 'inset-y-0 right-0 h-full w-[88vw] max-w-sm border-l',
        bottom: 'inset-x-0 bottom-0 max-h-[85vh] w-full rounded-t-lg border-t',
    };

    return (
        <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className="fixed inset-0 z-[60] bg-foreground/35 backdrop-blur-[2px]" />
                <DialogPrimitive.Content
                    className={cn(
                        'fixed z-[70] overflow-y-auto bg-background p-5 text-foreground shadow-2xl focus:outline-none',
                        sideClasses[side],
                        className,
                    )}
                >
                    <div className="mb-5 flex items-start justify-between gap-4 border-b border-border pb-4">
                        <div>
                            <DialogPrimitive.Title className="text-lg font-semibold">{title}</DialogPrimitive.Title>
                            {description && (
                                <DialogPrimitive.Description className="mt-1 text-sm text-muted-foreground">
                                    {description}
                                </DialogPrimitive.Description>
                            )}
                        </div>
                        <DialogPrimitive.Close className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Close panel">
                            <X className="h-5 w-5" />
                        </DialogPrimitive.Close>
                    </div>
                    {children}
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}
