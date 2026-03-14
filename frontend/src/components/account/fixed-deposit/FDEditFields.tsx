interface FDEditFieldsProps {
    interestRate: string;
    setInterestRate: (value: string) => void;
}

export default function FDEditFields({
    interestRate,
    setInterestRate
}: FDEditFieldsProps) {
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
                    required
                />
            </div>
            <div className="flex flex-col justify-end pb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Basis: Daily</span>
            </div>
        </div>
    );
}
