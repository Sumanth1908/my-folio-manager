import type { ReactElement, ReactNode } from 'react';
import { Tooltip as TooltipPrimitive } from '@base-ui/react/tooltip';

interface TooltipProps {
    children: ReactElement;
    content: ReactNode;
}

export function Tooltip({ children, content }: TooltipProps) {
    return (
        <TooltipPrimitive.Root>
            <TooltipPrimitive.Trigger render={children} />
            <TooltipPrimitive.Portal>
                <TooltipPrimitive.Positioner sideOffset={6} className="z-[1000]">
                    <TooltipPrimitive.Popup className="max-w-xs rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background shadow-lg">
                        {content}
                    </TooltipPrimitive.Popup>
                </TooltipPrimitive.Positioner>
            </TooltipPrimitive.Portal>
        </TooltipPrimitive.Root>
    );
}
