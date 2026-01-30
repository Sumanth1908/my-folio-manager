import { useState } from 'react';
import toast from 'react-hot-toast';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createHolding } from '../store/slices/holdingsSlice';
import { type RootState } from '../store';

interface HoldingFormProps {
    accountId: string;
    currencySymbol: string;
    currencyCode: string;
    prefill?: { symbol: string, name: string };
    onSuccess: () => void;
    onCancel: () => void;
}

export default function HoldingForm({ accountId, currencySymbol, currencyCode, prefill, onSuccess, onCancel }: HoldingFormProps) {
    const dispatch = useAppDispatch();
    const { loading: isHoldingsLoading } = useAppSelector((state: RootState) => state.holdings);

    const [symbol, setSymbol] = useState(prefill?.symbol || '');
    const [name, setName] = useState(prefill?.name || '');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            account_id: accountId,
            symbol,
            name,
            quantity: parseFloat(quantity),
            average_price: parseFloat(price),
            currency: currencyCode
        };

        try {
            await dispatch(createHolding(data)).unwrap();
            toast.success('Purchase confirmed');
            onSuccess();
        } catch (err: any) {
            toast.error(err.message || 'Failed to save holding');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Symbol</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. AAPL"
                        disabled={!!prefill}
                        value={symbol}
                        onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Name</label>
                    <input
                        type="text"
                        required
                        placeholder="e.g. Apple Inc."
                        disabled={!!prefill}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition disabled:opacity-50"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Quantity</label>
                    <input
                        type="number"
                        step="any"
                        required
                        placeholder="0.00"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">Buy Price ({currencyCode})</label>
                    <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full p-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary outline-none transition"
                    />
                </div>
            </div>

            {quantity && price && (
                <div className="p-4 rounded-xl border border-primary/10 bg-primary/5 text-primary text-xs font-bold flex justify-between items-center">
                    <span>TOTAL INVESTMENT</span>
                    <span className="text-base font-black tabular-nums">
                        {currencySymbol}{(parseFloat(quantity) * parseFloat(price)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                    disabled={isHoldingsLoading}
                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-black shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {isHoldingsLoading ? 'Processing...' : 'CONFIRM PURCHASE'}
                </button>
            </div>
        </form>
    );
}
