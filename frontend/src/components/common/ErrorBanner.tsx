import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
}

/** Inline error state for failed fetches — replaces silently-empty screens. */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-sm">
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="font-medium">{message}</span>
            </div>
            {onRetry && (
                <Button variant="outline" size="sm" onClick={onRetry} className="shrink-0">
                    <RefreshCw size={14} className="mr-2" />
                    Retry
                </Button>
            )}
        </div>
    );
}
