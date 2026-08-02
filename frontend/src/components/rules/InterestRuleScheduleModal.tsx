import { useEffect, useState } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import api, { handleApiError } from '../../api';
import type { InterestRuleSchedule, Rule } from '../../types';
import Modal from '../common/Modal';
import { Button } from '../ui/Button';

interface Props {
    rule: Rule | null;
    isOpen: boolean;
    onClose: () => void;
    onSaved: () => void;
}

export default function InterestRuleScheduleModal({ rule, isOpen, onClose, onSaved }: Props) {
    const [schedule, setSchedule] = useState<InterestRuleSchedule | null>(null);
    const [nextRunDate, setNextRunDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [executionOrder, setExecutionOrder] = useState('900');
    const [replayFrom, setReplayFrom] = useState('');
    const [confirmReplay, setConfirmReplay] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!isOpen || !rule) return;
        setLoading(true);
        setReplayFrom('');
        setConfirmReplay(false);
        api.get<InterestRuleSchedule>(`/rules/${rule.rule_id}/interest-schedule`)
            .then(({ data }) => {
                setSchedule(data);
                setNextRunDate(data.next_run_date ?? '');
                setEndDate(data.end_date ?? '');
                setExecutionOrder(String(data.execution_order));
            })
            .catch(error => toast.error(handleApiError(error, 'Failed to load interest schedule')))
            .finally(() => setLoading(false));
    }, [isOpen, rule]);

    const handleSave = async () => {
        if (!rule) return;
        if (rule.is_active) {
            toast.error('Pause the rule before changing its schedule');
            return;
        }
        if (replayFrom && !confirmReplay) {
            toast.error('Confirm the replay reset before continuing');
            return;
        }

        setSaving(true);
        try {
            await api.patch(`/rules/${rule.rule_id}/interest-schedule`, {
                next_run_date: nextRunDate || null,
                end_date: endDate || null,
                execution_order: Number(executionOrder),
            });
            let message = 'Interest schedule updated';
            if (replayFrom) {
                const { data } = await api.post(`/rules/${rule.rule_id}/interest-replay`, {
                    replay_from: replayFrom,
                });
                message = `Schedule rewound; removed ${data.removed_executions} settlement(s) and ${data.removed_transactions} payout(s)`;
            }
            toast.success(message);
            onSaved();
            onClose();
        } catch (error: unknown) {
            toast.error(handleApiError(error, 'Failed to update interest schedule'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Interest schedule"
            description="Control when this managed interest rule runs and its order relative to other rules."
            maxWidth="max-w-xl"
        >
            {loading || !schedule ? (
                <div className="py-10 text-center text-sm text-muted-foreground">Loading schedule…</div>
            ) : (
                <div className="space-y-5">
                    {rule?.is_active && (
                        <div className="flex gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
                            <AlertTriangle className="mt-0.5 shrink-0" size={16} />
                            Pause this rule before editing dates or replaying settlements.
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium">
                            <span>Next settlement date</span>
                            <input type="date" value={nextRunDate} min={schedule.effective_from} onChange={e => setNextRunDate(e.target.value)} className="date-time-field w-full" />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            <span>Contract end date</span>
                            <input type="date" value={endDate} min={schedule.effective_from} onChange={e => setEndDate(e.target.value)} className="date-time-field w-full" />
                        </label>
                        <label className="space-y-2 text-sm font-medium">
                            <span>Execution order</span>
                            <input type="number" min="1" max="10000" value={executionOrder} onChange={e => setExecutionOrder(e.target.value)} className="date-time-field w-full" />
                            <span className="block text-xs font-normal text-muted-foreground">Lower numbers run first. Interest defaults to 900.</span>
                        </label>
                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                            <p className="font-medium">Settlement time</p>
                            <p className="mt-1 text-muted-foreground">{schedule.settlement_time_utc} UTC, near the end of the day.</p>
                        </div>
                    </div>

                    <div className="space-y-3 rounded-lg border border-border p-4">
                        <div className="flex items-center gap-2">
                            <RotateCcw size={16} className="text-primary" />
                            <p className="font-semibold">Replay from a previous boundary</p>
                        </div>
                        <select value={replayFrom} onChange={e => { setReplayFrom(e.target.value); setConfirmReplay(false); }} className="date-time-field w-full">
                            <option value="">Do not reset settlement history</option>
                            {schedule.replay_from_dates.map(value => (
                                <option key={value} value={value}>Replay from {value}</option>
                            ))}
                        </select>
                        {replayFrom && (
                            <label className="flex items-start gap-2 text-sm text-muted-foreground">
                                <input type="checkbox" checked={confirmReplay} onChange={e => setConfirmReplay(e.target.checked)} className="mt-1" />
                                <span>I understand that generated interest transactions and audit records from this boundary will be removed. The rule will stay paused until I resume it.</span>
                            </label>
                        )}
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
                        <Button type="button" onClick={handleSave} disabled={saving || Boolean(rule?.is_active) || !executionOrder || Boolean(replayFrom && !confirmReplay)}>
                            {saving ? 'Saving…' : replayFrom ? 'Save and rewind' : 'Save schedule'}
                        </Button>
                    </div>
                </div>
            )}
        </Modal>
    );
}
