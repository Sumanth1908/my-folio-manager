import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface ErrorBannerProps {
    message: string;
    onRetry?: () => void;
}

/** Inline error state for failed fetches — replaces silently-empty screens. */
export default function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
    return (
        <div className="flex flex-col items-start justify-between gap-3 rounded-lg border border-expense/30 bg-expense-muted p-4 text-sm sm:flex-row sm:items-center" role="alert">
            <div className="flex items-center gap-3 text-expense">
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
