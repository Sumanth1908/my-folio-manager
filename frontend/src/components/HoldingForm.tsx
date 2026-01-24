import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../api';

interface HoldingFormProps {
    accountId: string;
    currencySymbol: string;
    currencyCode: string;
    prefill?: { symbol: string, name: string };
    onSuccess: () => void;
    onCancel: () => void;
}

export default function HoldingForm({ accountId, currencySymbol, currencyCode, prefill, onSuccess, onCancel }: HoldingFormProps) {
    const queryClient = useQueryClient();

    const [symbol, setSymbol] = useState(prefill?.symbol || '');
    const [name, setName] = useState(prefill?.name || '');
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');


    const mutation = useMutation({
        mutationFn: async (data: any) => {
            await api.post('/holdings/', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['account', accountId] });
            toast.success('Purchase confirmed');
            onSuccess();
        },
        onError: () => toast.error('Failed to save holding')
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            account_id: accountId,
            symbol,
            name,
            quantity: parseFloat(quantity),
            average_price: parseFloat(price),
            currency: currencyCode
        };
        mutation.mutate(data);
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
                    disabled={mutation.isPending}
                    className="flex-[2] px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition font-black shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                    {mutation.isPending ? 'Processing...' : 'CONFIRM PURCHASE'}
                </button>
            </div>
        </form>
    );
}
