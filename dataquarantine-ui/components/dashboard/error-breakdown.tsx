'use client'

import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface ErrorBreakdownProps {
    data: Record<string, number>
}

// Modern pastel palette
const COLORS = [
    '#f43f5e', // rose-500
    '#f59e0b', // amber-500
    '#8b5cf6', // violet-500
    '#3b82f6', // blue-500
    '#10b981', // emerald-500
    '#ec4899', // pink-500
]

export function ErrorBreakdown({ data }: ErrorBreakdownProps) {
    const chartData = Object.entries(data).map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
    }))

    const total = chartData.reduce((sum, item) => sum + item.value, 0)

    if (total === 0) {
        return (
            <div className="rounded-[2.5rem] neu-flat p-8 h-full flex flex-col items-center justify-center text-muted-foreground space-y-4">
                <div className="p-4 rounded-full neu-pressed">
                    <span className="text-2xl">🎉</span>
                </div>
                <p className="font-bold">No errors detected</p>
            </div>
        )
    }

    return (
        <div className="rounded-[2.5rem] neu-flat p-8 overflow-hidden relative h-full">
            <h3 className="text-lg font-bold text-foreground mb-6 z-10 relative">ERROR DISTRIBUTION</h3>

            <div className="h-64 relative z-10 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={85}
                            paddingAngle={8}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                            stroke="none"
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                    style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.1))' }}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--background)',
                                border: 'none',
                                borderRadius: '16px',
                                boxShadow: '6px 6px 12px #c5c9cd, -6px -6px 12px #ffffff',
                                color: 'var(--foreground)',
                                padding: '12px 16px'
                            }}
                            itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Total */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none p-4 rounded-full neu-pressed w-32 h-32 flex flex-col items-center justify-center">
                    <div className="text-2xl font-black text-foreground">{total.toLocaleString()}</div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground/70">Total Errors</div>
                </div>
            </div>

            {/* Error list */}
            <div className="space-y-4 relative z-10">
                {chartData.map((item, index) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between p-3 rounded-2xl neu-flat hover:scale-[1.02] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-3 h-3 rounded-full shadow-sm"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-bold text-foreground capitalize">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-xs font-bold text-muted-foreground">{item.value.toLocaleString()}</span>
                            <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-lg shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
