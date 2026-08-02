interface LoanEditFieldsProps {
    interestRate: string;
    setInterestRate: (value: string) => void;
    emiAmount: string;
    setEmiAmount: (value: string) => void;
    tenure: string;
    setTenure: (value: string) => void;
    startDate?: string;
    setStartDate?: (value: string) => void;
    emiStartDate?: string;
    setEmiStartDate?: (value: string) => void;
    showInterestRate?: boolean;
    calculatedField?: 'EMI' | 'TENURE';
}

const LoanEditFields = ({
    interestRate,
    setInterestRate,
    emiAmount,
    setEmiAmount,
    tenure,
    setTenure,
    startDate,
    setStartDate,
    emiStartDate,
    setEmiStartDate,
    showInterestRate = true,
    calculatedField,
}: LoanEditFieldsProps) => {
    return (
        <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {showInterestRate && <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Interest Rate (%)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">%</span>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={interestRate}
                            onChange={e => setInterestRate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                            required
                        />
                    </div>
                </div>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        EMI Amount
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={emiAmount}
                        onChange={e => setEmiAmount(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                        required
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                        {calculatedField === 'EMI' ? 'Calculated from tenure; you can overwrite it.' : 'Enter EMI to calculate tenure.'}
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Tenure (Months)
                    </label>
                    <input
                        type="number"
                        placeholder="e.g. 60"
                        value={tenure}
                        onChange={e => setTenure(e.target.value)}
                        className="w-full px-4 py-3 bg-background border border-border/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-semibold"
                        required
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                        {calculatedField === 'TENURE' ? 'Calculated from EMI and rounded up to full months.' : 'Enter tenure to calculate EMI.'}
                    </p>
                </div>
            </div>

            {setStartDate && (
                <div className="grid gap-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                            Start Date
                        </label>
                        <input
                            type="date"
                            value={startDate ?? ''}
                            onChange={e => setStartDate(e.target.value)}
                            className="date-time-field"
                            required
                        />
                    </div>
                    {setEmiStartDate && (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                                EMI Start Date
                            </label>
                            <input
                                type="date"
                                value={emiStartDate ?? ''}
                                onChange={e => setEmiStartDate(e.target.value)}
                                className="date-time-field"
                                required
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LoanEditFields;
