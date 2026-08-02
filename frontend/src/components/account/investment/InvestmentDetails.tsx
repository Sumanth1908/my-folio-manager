import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown, RefreshCw, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { Account, InvestmentHolding } from '../../../types';
import Modal from '../../common/Modal';
import HoldingForm from './HoldingForm';
import SellHoldingForm from './SellHoldingForm';
import ConfirmModal from '../../common/ConfirmModal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { deleteHolding, refreshStockPrices } from '../../../store/slices/holdingsSlice';
import type { RootState } from '../../../store';
import { Button } from '../../ui/Button';
import { cn, formatDate } from '../../../lib/utils';
import { formatCurrency, formatNumber, type AmountFormatOptions } from '../../../lib/format';
import { useCreateFlow } from '../../../context/CreateFlowContext';
import { getAccountHoldings } from '../../../lib/accounts';
import AssetValueForm from './AssetValueForm';

interface InvestmentDetailsProps {
    account: Account;
    symbol: string;
}

const InvestmentDetails = ({ account, symbol }: InvestmentDetailsProps) => {
    const dispatch = useAppDispatch();
    const { openCreate } = useCreateFlow();
    const { loading: isHoldingsLoading } = useAppSelector((state: RootState) => state.holdings);

    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [buyMoreHolding, setBuyMoreHolding] = useState<{
        symbol: string;
        name: string;
        assetType: string;
        unit: string;
        priceSource: 'MANUAL' | 'MARKET';
    } | null>(null);
    const [sellingHolding, setSellingHolding] = useState<InvestmentHolding | null>(null);
    const [editingHolding, setEditingHolding] = useState<InvestmentHolding | null>(null);
    const [confirmDeleteHolding, setConfirmDeleteHolding] = useState<InvestmentHolding | null>(null);

    const money = (value: number, options: AmountFormatOptions = {}) =>
        formatCurrency(value, { currency: account.currency, symbol, decimals: 2, ...options });
    // Summary tiles aggregate the whole portfolio, so they consolidate (`₹30L`)
    // and carry the exact amount in a tooltip; per-holding rows stay exact.
    const summaryMoney = (value: number) => money(value, { compact: true });

    const holdings = getAccountHoldings(account);
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.quantity || 0) * (Number(h.current_price || 0) || Number(h.average_price || 0))), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.quantity || 0) * Number(h.average_price || 0)), 0);
    const totalProfit = totalValue - totalCost;
    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const handleBuyMore = (holding: InvestmentHolding) => {
        setBuyMoreHolding({
            symbol: holding.symbol,
            name: holding.name,
            assetType: holding.asset_type,
            unit: holding.unit,
            priceSource: holding.price_source,
        });
        setIsBuyModalOpen(true);
    };

    const handleSellHolding = (holding: InvestmentHolding) => {
        setSellingHolding(holding);
    };

    const handleConfirmDelete = async () => {
        if (confirmDeleteHolding) {
            try {
                await dispatch(deleteHolding(confirmDeleteHolding.holding_id)).unwrap();
                toast.success('Holding deleted');
                setConfirmDeleteHolding(null);
            } catch (error: unknown) {
                toast.error(typeof error === 'string' ? error : 'Failed to delete holding');
            }
        }
    };

    const handleAddNewHolding = () => {
        openCreate('holding', { accountId: account.account_id });
    };

    const handleRefreshPrices = async () => {
        try {
            await dispatch(refreshStockPrices(account.account_id)).unwrap();
            toast.success('Prices updated successfully');
        } catch (error: unknown) {
            toast.error(typeof error === 'string' ? error : 'Failed to refresh prices');
        }
    };

    // Calculate last update time (use most recent update among all holdings)
    const lastUpdate = holdings.reduce((latest: Date | null, h) => {
        if (h.last_price_update) {
            const updateDate = new Date(h.last_price_update);
            return !latest || updateDate > latest ? updateDate : latest;
        }
        return latest;
    }, null as Date | null);
    const hasMarketHoldings = holdings.some((holding) => holding.price_source === 'MARKET');

    return (
        <div className="space-y-3">
            {/* Asset Summary Cards */}
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2">Cash Ledger Balance</div>
                    <div className={cn(
                        'text-2xl font-bold flex items-center gap-2',
                        (account.balance || 0) >= 0 ? 'text-emerald-500' : 'text-destructive'
                    )} title={money(account.balance || 0)}>
                        {summaryMoney(account.balance || 0)}
                    </div>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Current Asset Value</div>
                    <div className="text-2xl font-bold text-foreground" title={money(totalValue)}>
                        {summaryMoney(totalValue)}
                    </div>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Acquisition Cost</div>
                    <div className="text-2xl font-bold text-foreground" title={money(totalCost)}>
                        {summaryMoney(totalCost)}
                    </div>
                </div>
                <div className="bg-card p-3 rounded-xl border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Valuation Gain/Loss</div>
                    <div className={cn(
                        'text-2xl font-bold flex items-center gap-2',
                        totalProfit >= 0 ? 'text-emerald-500' : 'text-destructive'
                    )} title={money(Math.abs(totalProfit))}>
                        {totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        {summaryMoney(Math.abs(totalProfit))}
                        <span className="text-sm font-medium">({profitPercentage.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>

            {/* Holdings List */}
            <div className="bg-card rounded-xl overflow-hidden border border-border">
                <div className="p-3 border-b border-border flex justify-between items-center bg-muted/20">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Holdings</h3>
                        {lastUpdate && (
                            <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {formatDate(lastUpdate)}
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {hasMarketHoldings && (
                            <Button
                                variant="secondary"
                                onClick={handleRefreshPrices}
                                disabled={isHoldingsLoading}
                                title="Refresh market prices"
                            >
                                <RefreshCw size={16} className={isHoldingsLoading ? 'animate-spin' : ''} />
                                {isHoldingsLoading ? 'Refreshing...' : 'Refresh Market Prices'}
                            </Button>
                        )}
                        <Button
                            onClick={handleAddNewHolding}
                            size="icon"
                            className="rounded-full h-10 w-10 shadow-md"
                            title="Add Holding"
                        >
                            <Plus size={20} />
                        </Button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold">Asset</th>
                                <th className="px-6 py-4 font-semibold text-right">Quantity</th>
                                <th className="px-6 py-4 font-semibold text-right">Avg Price</th>
                                <th className="px-6 py-4 font-semibold text-right">Current Price</th>
                                <th className="px-6 py-4 font-semibold text-right">Market Value</th>
                                <th className="px-6 py-4 font-semibold text-right">Gain/Loss</th>
                                <th className="px-6 py-4 font-semibold text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {holdings.map((holding) => {
                                const q = Number(holding.quantity || 0);
                                const ap = Number(holding.average_price || 0);
                                const cp = Number(holding.current_price || 0) || ap;
                                const marketValue = q * cp;
                                const cost = q * ap;
                                const profit = marketValue - cost;
                                const pPercentage = cost > 0 ? (profit / cost) * 100 : 0;

                                return (
                                    <tr key={holding.holding_id} className="hover:bg-muted/30 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-foreground">{holding.symbol}</div>
                                            <div className="text-xs text-muted-foreground">{holding.name}</div>
                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{holding.asset_type.replaceAll('_', ' ')}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">{formatNumber(q, { currency: account.currency, maxDecimals: 4 })} {holding.unit}</td>
                                        <td className="px-6 py-4 text-right text-muted-foreground">{money(ap)}</td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">{money(cp)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">{money(marketValue)}</td>
                                        <td className={cn(
                                            'px-6 py-4 text-right font-semibold',
                                            profit >= 0 ? 'text-emerald-500' : 'text-destructive'
                                        )}>
                                            <div>{profit >= 0 ? '+' : '-'}{money(Math.abs(profit))}</div>
                                            <div className="text-[10px]">{pPercentage.toFixed(2)}%</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setEditingHolding(holding)}
                                                    title="Update Valuation"
                                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Pencil size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleBuyMore(holding)}
                                                    title="Buy More"
                                                    className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                >
                                                    <TrendingUp size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleSellHolding(holding)}
                                                    title="Sell Asset"
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <TrendingDown size={18} />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setConfirmDeleteHolding(holding)}
                                                    title="Delete Record"
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 size={18} />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {holdings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                        No holdings found. Add your first asset to start tracking.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={isBuyModalOpen}
                onClose={() => setIsBuyModalOpen(false)}
                title={buyMoreHolding ? `Add More ${buyMoreHolding.symbol}` : "Add New Asset"}
            >
                <HoldingForm
                    accountId={account.account_id}
                    accountType={account.account_type}
                    currencySymbol={symbol}
                    currencyCode={account.currency}
                    prefill={buyMoreHolding || undefined}
                    onSuccess={() => setIsBuyModalOpen(false)}
                    onCancel={() => setIsBuyModalOpen(false)}
                />
            </Modal>

            <Modal
                isOpen={Boolean(editingHolding)}
                onClose={() => setEditingHolding(null)}
                title={`Update ${editingHolding?.symbol || 'Asset'}`}
                description="Change the current manual value or asset details."
            >
                {editingHolding && (
                    <AssetValueForm
                        holding={editingHolding}
                        onSuccess={() => setEditingHolding(null)}
                        onCancel={() => setEditingHolding(null)}
                    />
                )}
            </Modal>

            {/* Sell Modal */}
            <Modal
                isOpen={!!sellingHolding}
                onClose={() => setSellingHolding(null)}
                title={`Sell ${sellingHolding?.symbol}`}
            >
                {sellingHolding && (
                    <SellHoldingForm
                        holding={sellingHolding}
                        currencySymbol={symbol}
                        onSuccess={() => setSellingHolding(null)}
                        onCancel={() => setSellingHolding(null)}
                    />
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!confirmDeleteHolding}
                onClose={() => setConfirmDeleteHolding(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Holding"
                message={`Are you sure you want to delete your holding of ${confirmDeleteHolding?.symbol}? This cannot be undone.`}
                variant="danger"
                isLoading={isHoldingsLoading}
            />
        </div>
    );
}

export default InvestmentDetails;
