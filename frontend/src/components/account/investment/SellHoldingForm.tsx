import { useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { sellHolding } from '../../../store/slices/holdingsSlice';
import type { InvestmentHolding } from '../../../types';
import type { RootState } from '../../../store';

interface SellHoldingFormProps {
    holding: InvestmentHolding;
    currencySymbol: string;
    onSuccess: () => void;
    onCancel: () => void;
}

interface SellFormData {
    quantity: string;
    price: string;
}

const SellHoldingForm = ({ holding, currencySymbol, onSuccess, onCancel }: SellHoldingFormProps) => {
    const dispatch = useAppDispatch();
    const { loading: isLoading } = useAppSelector((state: RootState) => state.holdings);

    // Initialize directly from prop
    const [formData, setFormData] = useState<SellFormData>(() => ({
        quantity: holding.quantity.toString(),
        price: (holding.current_price ?? holding.average_price).toString()
    }));

    const updateField = useCallback(<K extends keyof SellFormData>(field: K, value: SellFormData[K]) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const expectedProceeds = useMemo(() => {
        const qty = parseFloat(formData.quantity);
        const prc = parseFloat(formData.price);
        return qty && prc ? qty * prc : null;
    }, [formData.quantity, formData.price]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await dispatch(sellHolding({
                holdingId: holding.holding_id,
                quantity: parseFloat(formData.quantity),
                price: parseFloat(formData.price)
            })).unwrap();
            toast.success('Sale confirmed');
            onSuccess();
        } catch (err: unknown) {
            toast.error((err as Error)?.message ?? 'Failed to sell holding');
        }
    }, [formData, holding.holding_id, dispatch, onSuccess]);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Quantity to Sell
                    </label>
                    <input
                        type="number"
                        step="any"
                        max={holding.quantity}
                        required
                        value={formData.quantity}
                        onChange={e => updateField('quantity', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-destructive outline-none transition"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 uppercase">
                        Available: {holding.quantity}
                    </p>
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Sell Price ({currencySymbol})
                    </label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={e => updateField('price', e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-destructive outline-none transition"
                    />
                </div>
            </div>

            {expectedProceeds !== null && (
                <div className="p-4 rounded-xl border border-destructive/10 bg-destructive/5 text-destructive text-xs font-bold flex justify-between items-center">
                    <span>EXPECTED PROCEEDS</span>
                    <span className="text-base font-black tabular-nums">
                        {currencySymbol}{expectedProceeds.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    className="flex-[2] px-6 py-3 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition font-black shadow-lg shadow-destructive/20 disabled:opacity-50"
                >
                    {isLoading ? 'Confirming...' : 'CONFIRM SALE'}
                </button>
            </div>
        </form>
    );
};

export default SellHoldingForm;
