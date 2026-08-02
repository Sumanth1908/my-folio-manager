import { useState } from 'react';
import { toast } from 'sonner';
import type { InvestmentHolding } from '../../../types';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { updateHolding } from '../../../store/slices/holdingsSlice';
import type { RootState } from '../../../store';
import { Button } from '../../ui/Button';

interface AssetValueFormProps {
    holding: InvestmentHolding;
    onSuccess: () => void;
    onCancel: () => void;
}

export default function AssetValueForm({ holding, onSuccess, onCancel }: AssetValueFormProps) {
    const dispatch = useAppDispatch();
    const isLoading = useAppSelector((state: RootState) => state.holdings.loading);
    const [name, setName] = useState(holding.name);
    const [unit, setUnit] = useState(holding.unit);
    const [currentPrice, setCurrentPrice] = useState(String(holding.current_price ?? holding.average_price));
    const [notes, setNotes] = useState(String(holding.metadata_?.notes ?? ''));

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        try {
            await dispatch(updateHolding({
                holdingId: holding.holding_id,
                data: {
                    account_id: holding.account_id,
                    symbol: holding.symbol,
                    name: name.trim(),
                    quantity: Number(holding.quantity),
                    average_price: Number(holding.average_price),
                    current_price: Number(currentPrice),
                    currency: holding.currency,
                    stock_exchange: holding.stock_exchange,
                    asset_type: holding.asset_type,
                    unit: unit.trim(),
                    price_source: holding.price_source,
                    metadata_: {
                        ...(holding.metadata_ || {}),
                        ...(notes ? { notes } : {}),
                    },
                },
            })).unwrap();
            toast.success('Asset valuation updated');
            onSuccess();
        } catch (error: unknown) {
            toast.error(typeof error === 'string' ? error : 'Failed to update asset');
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Asset name</label>
                <input required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit</label>
                    <input required value={unit} onChange={(event) => setUnit(event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Current value / {unit}</label>
                    <input type="number" min="0" step="any" required value={currentPrice} onChange={(event) => setCurrentPrice(event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>
            <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</label>
                <input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Valuation source or other details" className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="submit" isLoading={isLoading}>Update valuation</Button>
            </div>
        </form>
    );
}
