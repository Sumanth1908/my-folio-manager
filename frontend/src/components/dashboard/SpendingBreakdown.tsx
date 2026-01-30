import { useMemo, useState, memo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { ChevronDown, Layers } from 'lucide-react';
import type { CategorySummary } from '../../types';
import { Card, CardTitle, CardContent } from '../ui/Card';

interface SpendingBreakdownProps {
    data: CategorySummary[];
    symbol: string;
}

const COLORS = [
    '#f87171', // Housing - Red
    '#60a5fa', // Utility - Blue
    '#fb923c', // Food - Orange
    '#34d399', // Health - Emerald
    '#818cf8', // Entertainment - Indigo
    '#fbbf24', // Education - Amber
    '#a78bfa', // Shopping - Violet
    '#2dd4bf', // Travel - Teal
    '#9ca3af', // Uncategorized - Gray
];

const SpendingBreakdown = memo(({ data, symbol }: SpendingBreakdownProps) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const chartData = useMemo(() => {
        const totalOutflow = data.reduce((acc, item) => acc + Number(item.total_amount || 0), 0);

        const sortedData = [...data]
            .sort((a, b) => Number(b.total_amount || 0) - Number(a.total_amount || 0))
            .map((item, index) => {
                const val = Number(item.total_amount || 0);
                return {
                    ...item,
                    value: val,
                    percentage: totalOutflow > 0 ? (val / totalOutflow) * 100 : 0,
                    color: COLORS[index % COLORS.length]
                };
            });

        return { items: sortedData, total: totalOutflow };
    }, [data]);

    if (chartData.items.length === 0) return null;

    return (
        <Card className="overflow-hidden">
            <div
                className="p-6 flex justify-between items-center cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-300 ${isExpanded ? '' : '-rotate-90'}`}>
                        <ChevronDown className="text-muted-foreground" size={24} />
                    </div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        Outflows
                    </CardTitle>
                </div>
            </div>

            {isExpanded && (
                <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pb-10">
                    {/* Radial Chart Column */}
                    <div className="lg:col-span-5 h-[300px] relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData.items}
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {chartData.items.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            const p = payload[0].payload;
                                            return (
                                                <div className="bg-popover text-popover-foreground p-3 border border-border rounded-xl shadow-xl text-sm">
                                                    <div className="font-bold">{p.name}</div>
                                                    <div className="text-muted-foreground">{symbol}{p.value.toLocaleString()} ({p.percentage.toFixed(1)}%)</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Outflows</span>
                            <span className="text-3xl font-black text-foreground mt-1">
                                {symbol}{chartData.total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </span>
                        </div>
                    </div>

                    {/* Category List Column */}
                    <div className="lg:col-span-7">
                        <div className="bg-muted/30 rounded-2xl border border-border overflow-hidden">
                            <div className="grid grid-cols-12 p-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground border-b border-border">
                                <div className="col-span-6">Categories · {chartData.items.length}</div>
                                <div className="col-span-3 text-right">Value</div>
                                <div className="col-span-3 text-right">Weight</div>
                            </div>
                            <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                {chartData.items.map((item, idx) => (
                                    <div key={idx} className="grid grid-cols-12 p-4 items-center hover:bg-muted/50 transition-colors border-b border-border/50 last:border-0">
                                        <div className="col-span-6 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                                <Layers size={16} />
                                            </div>
                                            <span className="font-semibold text-foreground truncate">{item.name}</span>
                                        </div>
                                        <div className="col-span-3 text-right font-bold text-foreground">
                                            {symbol}{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="col-span-3 text-right font-medium text-muted-foreground">
                                            {item.percentage.toFixed(1)}%
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            )}
        </Card>
    );
});

export default SpendingBreakdown;
