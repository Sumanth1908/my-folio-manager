import { useState } from 'react';
import { Plus, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Account, InvestmentHolding } from '../../../types';
import Modal from '../../common/Modal';
import HoldingForm from './HoldingForm';
import SellHoldingForm from './SellHoldingForm';
import ConfirmModal from '../../common/ConfirmModal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { deleteHolding } from '../../../store/slices/holdingsSlice';
import type { RootState } from '../../../store';

interface InvestmentDetailsProps {
    account: Account;
    symbol: string;
}

const InvestmentDetails = ({ account, symbol }: InvestmentDetailsProps) => {
    const dispatch = useAppDispatch();
    const { loading: isHoldingsLoading } = useAppSelector((state: RootState) => state.holdings);

    const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
    const [buyMoreHolding, setBuyMoreHolding] = useState<{ symbol: string, name: string } | null>(null);
    const [sellingHolding, setSellingHolding] = useState<InvestmentHolding | null>(null);
    const [confirmDeleteHolding, setConfirmDeleteHolding] = useState<InvestmentHolding | null>(null);

    const holdings = account.investment_holdings || [];
    const totalValue = holdings.reduce((sum, h) => sum + (Number(h.quantity || 0) * (Number(h.current_price || 0) || Number(h.average_price || 0))), 0);
    const totalCost = holdings.reduce((sum, h) => sum + (Number(h.quantity || 0) * Number(h.average_price || 0)), 0);
    const totalProfit = totalValue - totalCost;
    const profitPercentage = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    const handleBuyMore = (holding: InvestmentHolding) => {
        setBuyMoreHolding({ symbol: holding.symbol, name: holding.name });
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
            } catch (err: any) {
                toast.error(err.message || 'Failed to delete holding');
            }
        }
    };

    const handleAddNewHolding = () => {
        setBuyMoreHolding(null);
        setIsBuyModalOpen(true);
    };

    return (
        <div className="space-y-6">
            {/* Investment Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Total Market Value</div>
                    <div className="text-2xl font-bold text-foreground">
                        {symbol}{totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Total Cost</div>
                    <div className="text-2xl font-bold text-foreground">
                        {symbol}{totalCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                </div>
                <div className="bg-card p-5 rounded-2xl shadow-sm border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Total Logic Gain/Loss</div>
                    <div className={`text-2xl font-bold flex items-center gap-2 ${totalProfit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                        {totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                        {symbol}{Math.abs(totalProfit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        <span className="text-sm font-medium">({profitPercentage.toFixed(2)}%)</span>
                    </div>
                </div>
            </div>

            {/* Holdings List */}
            <div className="bg-card rounded-2xl shadow-lg overflow-hidden border border-border">
                <div className="p-6 border-b border-border flex justify-between items-center bg-muted/30">
                    <h3 className="text-lg font-bold text-foreground">Holdings</h3>
                    <button
                        onClick={handleAddNewHolding}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm text-sm font-medium"
                    >
                        <Plus size={18} /> Add Holding
                    </button>
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
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">{q.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                                        <td className="px-6 py-4 text-right text-muted-foreground">{symbol}{ap.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-medium text-foreground">{symbol}{cp.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-right font-bold text-foreground">{symbol}{marketValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                        <td className={`px-6 py-4 text-right font-semibold ${profit >= 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'}`}>
                                            <div>{profit >= 0 ? '+' : '-'}{symbol}{Math.abs(profit).toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                                            <div className="text-[10px]">{pPercentage.toFixed(2)}%</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center gap-1">
                                                <button
                                                    onClick={() => handleBuyMore(holding)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition"
                                                    title="Buy More"
                                                >
                                                    <TrendingUp size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleSellHolding(holding)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                                    title="Sell Asset"
                                                >
                                                    <TrendingDown size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setConfirmDeleteHolding(holding)}
                                                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition"
                                                    title="Delete Record"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {holdings.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground font-medium">
                                        No holdings found. Add your first investment to start tracking!
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
                title={buyMoreHolding ? `Buy More ${buyMoreHolding.symbol}` : "Buy New Holding"}
            >
                <HoldingForm
                    accountId={account.account_id}
                    currencySymbol={symbol}
                    currencyCode={account.currency}
                    prefill={buyMoreHolding || undefined}
                    onSuccess={() => setIsBuyModalOpen(false)}
                    onCancel={() => setIsBuyModalOpen(false)}
                />
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
