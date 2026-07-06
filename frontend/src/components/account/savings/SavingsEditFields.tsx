interface SavingsEditFieldsProps {
    interestRate: string;
    setInterestRate: (value: string) => void;
}

export default function SavingsEditFields({
    interestRate,
    setInterestRate
}: SavingsEditFieldsProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Interest Rate (%)</label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                    />
                </div>
            </div>
            <div className="flex flex-col justify-end pb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">Basis: Daily</span>
            </div>
        </div>
    );
}
