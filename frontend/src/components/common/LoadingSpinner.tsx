import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const sizeMap = {
    small: { icon: 16, wrapper: 'h-4 w-4' },
    medium: { icon: 24, wrapper: 'h-6 w-6' },
    large: { icon: 32, wrapper: 'h-8 w-8' },
} as const;

export default function LoadingSpinner({
    size = 'medium',
    className = '',
}: {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}) {
    const { icon, wrapper } = sizeMap[size];

    return (
        <div className={cn('flex justify-center items-center', className)}>
            <Loader2
                size={icon}
                className={cn('animate-spin text-primary', wrapper)}
                role="status"
                aria-label="Loading"
            />
        </div>
    );
}
