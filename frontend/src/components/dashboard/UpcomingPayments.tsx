import { memo, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Landmark, Repeat } from 'lucide-react';
import { Card, CardContent, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchUpcoming } from '../../store/slices/summarySlice';
import type { RootState } from '../../store';
import type { UpcomingItem } from '../../types';
import LoadingSpinner from '../common/LoadingSpinner';
import Modal from '../common/Modal';
import { formatCurrency } from '../../lib/format';

interface UpcomingPaymentsProps {
    symbol: string;
}

const WINDOW_DAYS = 30;

interface DayBucket {
    offset: number;
    date: Date;
    items: UpcomingItem[];
}

const UpcomingPayments = memo(({ symbol }: UpcomingPaymentsProps) => {
    const dispatch = useAppDispatch();
    const { upcoming, upcomingLoading } = useAppSelector((state: RootState) => state.summary);
    // Captured once on mount so day-offset math stays stable across re-renders
    const [today] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [activeBucket, setActiveBucket] = useState<DayBucket | null>(null);

    useEffect(() => {
        dispatch(fetchUpcoming(WINDOW_DAYS));
    }, [dispatch]);

    const buckets = useMemo(() => {
        const byOffset = new Map<number, DayBucket>();
        upcoming.forEach((item) => {
            const itemDate = new Date(item.date);
            itemDate.setHours(0, 0, 0, 0);
            const offset = Math.round((itemDate.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
            if (offset < 0 || offset > WINDOW_DAYS) return;
            if (!byOffset.has(offset)) {
                byOffset.set(offset, { offset, date: itemDate, items: [] });
            }
            byOffset.get(offset)!.items.push(item);
        });
        return Array.from(byOffset.values()).sort((a, b) => a.offset - b.offset);
    }, [upcoming, today]);

    const formatDay = (date: Date) => date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    const formatWhen = (offset: number) => {
        if (offset === 0) return 'Today';
        if (offset === 1) return 'Tomorrow';
        return `In ${offset} days`;
    };

    return (
        <Card>
            <div className="p-6 pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                    <CalendarClock size={18} className="text-muted-foreground" />
                    Upcoming — next {WINDOW_DAYS} days
                </CardTitle>
            </div>
            <CardContent className="pb-6">
                {upcomingLoading && upcoming.length === 0 ? (
                    <div className="py-8 flex justify-center"><LoadingSpinner /></div>
                ) : buckets.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        Nothing scheduled — automation rules and maturities will show up here.
                    </p>
                ) : (
                    <div className="pt-4 pb-2">
                        <div className="relative h-16 mx-3">
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-muted" />
                            {[7, 14, 21, 28].map((day) => (
                                <span
                                    key={day}
                                    className="absolute top-1/2 -translate-y-1/2 w-px h-4 bg-border"
                                    style={{ left: `${(day / WINDOW_DAYS) * 100}%` }}
                                />
                            ))}
                            {buckets.map((bucket) => (
                                <button
                                    key={bucket.offset}
                                    onClick={() => setActiveBucket(bucket)}
                                    className="absolute top-1/2 flex flex-col items-center gap-1 group"
                                    style={{ left: `${(bucket.offset / WINDOW_DAYS) * 100}%`, transform: 'translate(-50%, -50%)' }}
                                    title={`${formatDay(bucket.date)} · ${bucket.items.length} item${bucket.items.length > 1 ? 's' : ''}`}
                                >
                                    <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5">
                                        {formatDay(bucket.date)}
                                    </span>
                                    <span
                                        className={cn(
                                            "relative flex items-center justify-center rounded-full border-2 border-background shadow-sm transition-transform group-hover:scale-125",
                                            bucket.offset === 0 ? "bg-primary" : "bg-primary/70",
                                            bucket.items.length > 1 ? "w-5 h-5" : "w-3.5 h-3.5"
                                        )}
                                    >
                                        {bucket.items.length > 1 && (
                                            <span className="text-[9px] font-black text-primary-foreground">{bucket.items.length}</span>
                                        )}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            <span>Today</span>
                            <span>+{Math.round(WINDOW_DAYS / 2)}d</span>
                            <span>+{WINDOW_DAYS}d</span>
                        </div>
                    </div>
                )}
            </CardContent>

            <Modal
                isOpen={activeBucket !== null}
                onClose={() => setActiveBucket(null)}
                title={activeBucket ? `${formatDay(activeBucket.date)} · ${formatWhen(activeBucket.offset)}` : ''}
                maxWidth="max-w-md"
            >
                {activeBucket && (
                    <div className="divide-y divide-border/50">
                        {activeBucket.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-xl bg-muted/60 flex items-center justify-center shrink-0 text-muted-foreground">
                                        {item.kind === 'MATURITY' ? <Landmark size={16} /> : <Repeat size={16} />}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-sm text-foreground truncate">{item.name}</div>
                                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                            {item.account_name || item.account_type.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>
                                {item.amount != null && (
                                    <div className="font-bold text-sm tabular-nums shrink-0 ml-3">
                                        {formatCurrency(item.amount, { symbol, decimals: 2 })}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </Card>
    );
});

UpcomingPayments.displayName = 'UpcomingPayments';

export default UpcomingPayments;
