import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { ASSET_TYPE, ASSET_TYPES, PRICE_SOURCE } from '../../../constants';
import { defaultAssetTypeForAccount, formatAccountType } from '../../../lib/accounts';
import { formatCurrency } from '../../../lib/format';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { createHolding } from '../../../store/slices/holdingsSlice';
import type { RootState } from '../../../store';
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from '../../ui/Select';
import StockSymbolInput from './StockSymbolInput';

interface HoldingPrefill {
    symbol: string;
    name: string;
    assetType?: string;
    unit?: string;
    priceSource?: 'MANUAL' | 'MARKET';
}

interface HoldingFormProps {
    accountId: string;
    accountType: string;
    currencySymbol: string;
    currencyCode: string;
    prefill?: HoldingPrefill;
    onSuccess: () => void;
    onCancel: () => void;
}

interface HoldingFormData {
    assetType: string;
    symbol: string;
    name: string;
    quantity: string;
    unit: string;
    averagePrice: string;
    currentPrice: string;
    priceSource: 'MANUAL' | 'MARKET';
    purity: string;
    notes: string;
    transactionDate: string;
}

const MARKET_ASSET_TYPES = new Set<string>([
    ASSET_TYPE.EQUITY,
    ASSET_TYPE.ETF,
    ASSET_TYPE.MUTUAL_FUND,
]);

const defaultUnitForAsset = (assetType: string): string => {
    if (assetType === ASSET_TYPE.GOLD || assetType === ASSET_TYPE.SILVER || assetType === ASSET_TYPE.COMMODITY) return 'gram';
    if (assetType === ASSET_TYPE.CRYPTO) return 'coin';
    if (assetType === ASSET_TYPE.REAL_ESTATE) return 'property';
    return 'unit';
};

const HoldingForm = ({ accountId, accountType, currencySymbol, currencyCode, prefill, onSuccess, onCancel }: HoldingFormProps) => {
    const dispatch = useAppDispatch();
    const { loading: isLoading } = useAppSelector((state: RootState) => state.holdings);
    const initialAssetType = prefill?.assetType ?? defaultAssetTypeForAccount(accountType);

    const [formData, setFormData] = useState<HoldingFormData>(() => ({
        assetType: initialAssetType,
        symbol: prefill?.symbol ?? '',
        name: prefill?.name ?? '',
        quantity: '',
        unit: prefill?.unit ?? defaultUnitForAsset(initialAssetType),
        averagePrice: '',
        currentPrice: '',
        priceSource: prefill?.priceSource ?? (MARKET_ASSET_TYPES.has(initialAssetType) ? PRICE_SOURCE.MARKET : PRICE_SOURCE.MANUAL),
        purity: '',
        notes: '',
        transactionDate: new Date().toISOString().split('T')[0],
    }));

    const updateField = useCallback(<K extends keyof HoldingFormData>(field: K, value: HoldingFormData[K]) => {
        setFormData((previous) => ({ ...previous, [field]: value }));
    }, []);

    const setAssetType = (assetType: string) => {
        setFormData((previous) => ({
            ...previous,
            assetType,
            unit: defaultUnitForAsset(assetType),
            priceSource: MARKET_ASSET_TYPES.has(assetType) ? PRICE_SOURCE.MARKET : PRICE_SOURCE.MANUAL,
        }));
    };

    const isMarketSecurity = MARKET_ASSET_TYPES.has(formData.assetType);
    const isPreciousMetal = [ASSET_TYPE.GOLD, ASSET_TYPE.SILVER].includes(formData.assetType as 'GOLD' | 'SILVER');
    const totalInvestment = useMemo(() => {
        const quantity = Number(formData.quantity);
        const price = Number(formData.averagePrice);
        return quantity > 0 && price >= 0 ? quantity * price : null;
    }, [formData.quantity, formData.averagePrice]);

    const handleSubmit = useCallback(async (event: React.FormEvent) => {
        event.preventDefault();
        const metadata: Record<string, string> = {};
        if (formData.purity) metadata.purity = formData.purity;
        if (formData.notes) metadata.notes = formData.notes;

        try {
            await dispatch(createHolding({
                account_id: accountId,
                symbol: formData.symbol.trim().toUpperCase(),
                name: formData.name.trim(),
                asset_type: formData.assetType,
                quantity: Number(formData.quantity),
                unit: formData.unit.trim() || 'unit',
                average_price: Number(formData.averagePrice),
                current_price: formData.currentPrice ? Number(formData.currentPrice) : undefined,
                currency: currencyCode,
                price_source: formData.priceSource,
                metadata_: Object.keys(metadata).length > 0 ? metadata : undefined,
                transaction_date: new Date(formData.transactionDate).toISOString(),
            })).unwrap();
            toast.success(`${formatAccountType(formData.assetType)} added`);
            onSuccess();
        } catch (error: unknown) {
            toast.error(typeof error === 'string' ? error : 'Failed to save asset');
        }
    }, [accountId, currencyCode, dispatch, formData, onSuccess]);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Asset class</label>
                    <Select value={formData.assetType} onValueChange={setAssetType} disabled={Boolean(prefill)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectLabel>Asset class</SelectLabel>
                                {ASSET_TYPES.map((assetType) => (
                                    <SelectItem key={assetType} value={assetType}>{formatAccountType(assetType)}</SelectItem>
                                ))}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Valuation source</label>
                    <Select value={formData.priceSource} onValueChange={(value) => updateField('priceSource', value as 'MANUAL' | 'MARKET')} disabled={!isMarketSecurity || Boolean(prefill)}>
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value={PRICE_SOURCE.MANUAL}>Manual value</SelectItem>
                            <SelectItem value={PRICE_SOURCE.MARKET}>Market quote</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {isMarketSecurity && !prefill ? (
                <StockSymbolInput
                    value={formData.symbol}
                    name={formData.name}
                    currency={currencyCode}
                    disabled={false}
                    onSelect={(symbol, name) => setFormData((previous) => ({ ...previous, symbol, name }))}
                />
            ) : (
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Identifier</label>
                    <input
                        required
                        disabled={Boolean(prefill)}
                        value={formData.symbol}
                        onChange={(event) => updateField('symbol', event.target.value)}
                        placeholder={isPreciousMetal ? 'e.g. GOLD_24K' : 'e.g. BTC or PROPERTY_1'}
                        className="w-full rounded-xl border border-border bg-background p-3 uppercase outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            )}

            <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Asset name</label>
                <input
                    required
                    disabled={Boolean(prefill)}
                    value={formData.name}
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder={isPreciousMetal ? 'e.g. 24K physical gold' : 'Name or description'}
                    className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Quantity</label>
                    <input type="number" min="0" step="any" required value={formData.quantity} onChange={(event) => updateField('quantity', event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Unit</label>
                    <input required value={formData.unit} onChange={(event) => updateField('unit', event.target.value)} placeholder="gram, coin, property..." className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Acquisition price / {formData.unit}</label>
                    <input type="number" min="0" step="any" required value={formData.averagePrice} onChange={(event) => updateField('averagePrice', event.target.value)} className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Current value / {formData.unit}</label>
                    <input type="number" min="0" step="any" value={formData.currentPrice} onChange={(event) => updateField('currentPrice', event.target.value)} placeholder="Defaults to acquisition price" className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>

            {isPreciousMetal && (
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Purity</label>
                    <input value={formData.purity} onChange={(event) => updateField('purity', event.target.value)} placeholder="e.g. 999 or 24K" className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Acquisition date</label>
                    <input type="date" required value={formData.transactionDate} onChange={(event) => updateField('transactionDate', event.target.value)} className="date-time-field" />
                </div>
                <div>
                    <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">Notes</label>
                    <input value={formData.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Optional details" className="w-full rounded-xl border border-border bg-background p-3 outline-none focus:ring-2 focus:ring-primary" />
                </div>
            </div>

            {totalInvestment !== null && (
                <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-primary/5 p-4 text-xs font-bold text-primary">
                    <span>TOTAL ACQUISITION COST</span>
                    <span className="text-base font-black tabular-nums">{formatCurrency(totalInvestment, { currency: currencyCode, symbol: currencySymbol, decimals: 2 })}</span>
                </div>
            )}

            <div className="flex gap-3 pt-3">
                <button type="button" onClick={onCancel} className="flex-1 rounded-xl px-4 py-3 font-bold text-muted-foreground transition hover:bg-muted">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-[2] rounded-xl bg-primary px-6 py-3 font-black text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50">
                    {isLoading ? 'Saving...' : prefill ? 'ADD QUANTITY' : 'ADD ASSET'}
                </button>
            </div>
        </form>
    );
};

export default HoldingForm;
