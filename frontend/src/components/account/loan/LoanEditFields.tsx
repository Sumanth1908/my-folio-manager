interface LoanEditFieldsProps {
    interestRate: string;
    setInterestRate: (value: string) => void;
    accrualDay: string;
    setAccrualDay: (value: string) => void;
    emiAmount: string;
    setEmiAmount: (value: string) => void;
    tenure: string;
    setTenure: (value: string) => void;
    startDate?: string;
    setStartDate?: (value: string) => void;
}

const LoanEditFields = ({
    interestRate,
    setInterestRate,
    accrualDay,
    setAccrualDay,
    emiAmount,
    setEmiAmount,
    tenure,
    setTenure,
    startDate,
    setStartDate
}: LoanEditFieldsProps) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Interest Rate (%)
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={interestRate}
                        onChange={e => setInterestRate(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Accrual Day
                    </label>
                    <input
                        type="number"
                        min="1"
                        max="31"
                        value={accrualDay}
                        onChange={e => setAccrualDay(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        EMI Amount
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        value={emiAmount}
                        onChange={e => setEmiAmount(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Tenure (Months)
                    </label>
                    <input
                        type="number"
                        value={tenure}
                        onChange={e => setTenure(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
            </div>

            {setStartDate && (
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate ?? ''}
                        onChange={e => setStartDate(e.target.value)}
                        className="w-full bg-muted border border-border rounded-lg p-2 focus:outline-none focus:ring-1 focus:ring-primary"
                        required
                    />
                </div>
            )}
        </div>
    );
};

export default LoanEditFields;
