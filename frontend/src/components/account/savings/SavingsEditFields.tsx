interface SavingsEditFieldsProps {
    interestRate: string;
    setInterestRate: (value: string) => void;
    accrualDay: string;
    setAccrualDay: (value: string) => void;
}

export default function SavingsEditFields({
    interestRate,
    setInterestRate,
    accrualDay,
    setAccrualDay
}: SavingsEditFieldsProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Interest Rate (%)</label>
                <input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Accrual Day</label>
                <input
                    type="number"
                    min="1"
                    max="31"
                    value={accrualDay}
                    onChange={(e) => setAccrualDay(e.target.value)}
                    className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                />
            </div>
        </div>
    );
}
