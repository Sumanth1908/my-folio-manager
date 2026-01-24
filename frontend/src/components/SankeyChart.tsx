import { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';

import type { CategorySummary } from '../types';

interface SankeyChartProps {
    inflows: CategorySummary[];
    outflows: CategorySummary[];
    symbol: string;
}

interface SankeyNode {
    name: string;
    fill?: string;
    value?: number; // Recharts adds this but we declare it for TS
}

interface SankeyLink {
    source: number;
    target: number;
    value: number;
    fill?: string;
}

export default function SankeyChart({ inflows, outflows, symbol }: SankeyChartProps) {
    const data = useMemo(() => {
        if (inflows.length === 0 && outflows.length === 0) {
            return { nodes: [], links: [] };
        }

        const nodes: SankeyNode[] = [];
        const nodeIndexMap = new Map<string, number>();

        const getNodeIndex = (key: string, displayName: string, color?: string) => {
            if (nodeIndexMap.has(key)) {
                return nodeIndexMap.get(key)!;
            }
            const index = nodes.push({ name: displayName, fill: color }) - 1;
            nodeIndexMap.set(key, index);
            return index;
        };

        const CASHFLOW_NODE_KEY = "SYS:CashFlow";
        const CASHFLOW_DISPLAY = "Cash Flow";

        // Colors
        const INFLOW_COLOR = "#10b981"; // Emerald 500
        const CASHFLOW_COLOR = "#3b82f6"; // Blue 500
        const SURPLUS_COLOR = "#10b981"; // Emerald 500

        // Dynamic Palette
        const OUTFLOW_PALETTE = [
            '#ef4444', '#f97316', '#f59e0b', '#3b82f6',
            '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#06b6d4'
        ];

        const links: SankeyLink[] = [];
        const cashFlowIdx = getNodeIndex(CASHFLOW_NODE_KEY, CASHFLOW_DISPLAY, CASHFLOW_COLOR);

        let totalInflow = 0;
        let totalOutflow = 0;

        // 1. Inflow -> Cash Flow
        inflows.forEach((item) => {
            totalInflow += item.total_amount;
            const nodeIdx = getNodeIndex(`IN:${item.name}`, item.name, INFLOW_COLOR);
            links.push({
                source: nodeIdx,
                target: cashFlowIdx,
                value: item.total_amount,
                fill: INFLOW_COLOR
            });
        });

        // 2. Cash Flow -> Outflows
        let colorIndex = 0;
        outflows.forEach((item) => {
            totalOutflow += item.total_amount;
            const color = OUTFLOW_PALETTE[colorIndex % OUTFLOW_PALETTE.length];
            colorIndex++;

            const nodeIdx = getNodeIndex(`OUT:${item.name}`, item.name, color);
            links.push({
                source: cashFlowIdx,
                target: nodeIdx,
                value: item.total_amount,
                fill: color
            });
        });

        // 3. Cash Flow -> Surplus
        const surplus = Math.max(0, totalInflow - totalOutflow);
        if (surplus > 0) {
            const surplusIdx = getNodeIndex("SYS:Surplus", "Surplus", SURPLUS_COLOR);
            links.push({
                source: cashFlowIdx,
                target: surplusIdx,
                value: surplus,
                fill: SURPLUS_COLOR
            });
        }

        return { nodes, links };
    }, [inflows, outflows]);

    if (!data.nodes.length || !data.links.length) {
        return <div className="text-center text-muted-foreground py-20 bg-muted/30 rounded-2xl border border-border/50">Not enough data for chart</div>;
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const load = payload[0].payload as any;
            return (
                <div className="bg-popover p-4 border border-border shadow-xl rounded-2xl text-sm z-50 text-popover-foreground min-w-[150px] pointer-events-none select-none">
                    <div className="mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        {load.source && load.target ? (
                            <>
                                <span className="text-foreground">{load.source.name}</span>
                                <span className="mx-2 opacity-50">→</span>
                                <span className="text-foreground">{load.target.name}</span>
                            </>
                        ) : (
                            <span className="text-foreground">{load.name}</span>
                        )}
                    </div>
                    <div className="font-black text-2xl text-foreground tabular-nums tracking-tighter">
                        {symbol}{(payload[0].value as number).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </div>
                </div>
            );
        }
        return null;
    };

    const CustomLink = (props: any) => {
        const { sourceX, sourceY, targetX, targetY, linkWidth, payload } = props;
        const fill = payload?.fill || 'rgba(100,100,100,0.1)';

        return (
            <path
                d={`M${sourceX},${sourceY} C${sourceX + 150},${sourceY} ${targetX - 150},${targetY} ${targetX},${targetY}`}
                stroke={fill}
                strokeWidth={Math.max(2, linkWidth)}
                fill="none"
                opacity={0.8}
                className="transition-all duration-300 hover:opacity-100"
            />
        );
    };

    const CustomNode = (props: any) => {
        const { x, y, width, height, payload } = props;
        const isLeft = x < 100;
        const isRight = x > 700;

        return (
            <g>
                <rect
                    x={x} y={y} width={width} height={height}
                    fill={payload.fill}
                    fillOpacity={0.9}
                    rx={4} ry={4}
                    className="stroke-background stroke-2"
                />
                <text
                    x={isLeft ? x + width + 12 : (isRight ? x - 12 : x + width / 2)}
                    y={y + height / 2 - 4}
                    textAnchor={isLeft ? "start" : (isRight ? "end" : "middle")}
                    className="fill-foreground font-bold tracking-tight text-[12px]"
                    alignmentBaseline="middle"
                >
                    {payload.name}
                </text>
                <text
                    x={isLeft ? x + width + 12 : (isRight ? x - 12 : x + width / 2)}
                    y={y + height / 2 + 12}
                    textAnchor={isLeft ? "start" : (isRight ? "end" : "middle")}
                    className="fill-muted-foreground text-[10px] font-medium tabular-nums tracking-wide"
                    alignmentBaseline="middle"
                >
                    {symbol}{Math.round(payload.value).toLocaleString()}
                </text>
            </g>
        );
    };

    return (
        <div className="w-full h-[500px] bg-card p-6 rounded-3xl relative overflow-hidden border border-border">
            <ResponsiveContainer width="100%" height="100%">
                <Sankey
                    data={data}
                    node={<CustomNode />}
                    nodePadding={24}
                    margin={{ left: 20, right: 20, top: 20, bottom: 20 }}
                    link={<CustomLink />}
                >
                    <Tooltip content={<CustomTooltip />} />
                </Sankey>
            </ResponsiveContainer>
        </div>
    );
}
