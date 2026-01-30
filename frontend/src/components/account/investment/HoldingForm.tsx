import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createHolding } from '../../../store/slices/holdingsSlice';
import { type RootState } from '../../../store';

interface HoldingFormProps {
    accountId: string;
    currencySymbol: string;
    currencyCode: string;
    prefill?: { symbol: string; name: string };
    onSuccess: () => void;
    onCancel: () => void;
}

interface HoldingFormData {
    symbol: string;
    name: string;
    quantity: string;
    price: string;
}

const HoldingForm = ({ accountId, currencySymbol, currencyCode, prefill, onSuccess, onCancel }: HoldingFormProps) => {
    const dispatch = useAppDispatch();
    const { loading: isLoading } = useAppSelector((state: RootState) => state.holdings);

    const [formData, setFormData] = useState<HoldingFormData>(() => ({
        symbol: prefill?.symbol ?? '',
        name: prefill?.name ?? '',
        quantity: '',
        price: ''
    }));

    const updateField = useCallback(<K extends keyof HoldingFormData>(field: K, value: HoldingFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const totalInvestment = useMemo(() => {
        const qty = parseFloat(formData.quantity);
        const prc = parseFloat(formData.price);
        return qty && prc ? qty * prc : null;
    }, [formData.quantity, formData.price]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await dispatch(createHolding({
                account_id: accountId,
                symbol: formData.symbol,
                name: formData.name,
                quantity: parseFloat(formData.quantity),
                average_price: parseFloat(formData.price),
                currency: currencyCode
            })).unwrap();
            toast.success('Purchase confirmed');
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to save holding');
        }
    }, [formData, accountId, currencyCode, dispatch, onSuccess]);

    const isPrefilled = !!prefill;

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Symbol
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. AAPL"
                        disabled={isPrefilled}
                        value={formData.symbol}
                        onChange={e => updateField('symbol', e.target.value.toUpperCase())}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Name
                    </label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Apple Inc."
                        disabled={isPrefilled}
                        value={formData.name}
                        onChange={e => updateField('name', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Quantity
                    </label>
                    <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={formData.quantity}
                        onChange={e => updateField('quantity', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Buy Price ({currencyCode})
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={formData.price}
                        onChange={e => updateField('price', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                    />
                </div>
            </div>

            {totalInvestment !== null && (
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 text-primary text-xs font-bold flex justify-between items-center">
                    <span>TOTAL INVESTMENT</span>
                    <span className="text-base font-black tabular-nums">
                        {currencySymbol}{totalInvestment.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                </div>
            )}

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 px-4 py-3 text-muted-foreground hover:bg-muted rounded-xl transition font-bold"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-black shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {isLoading ? 'Processing...' : 'CONFIRM PURCHASE'}
                </button>
            </div>
        </form>
    );
};

export default HoldingForm;
