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

    return (
        <div className="rounded-2xl border border-border bg-card shadow-sm p-6 overflow-hidden relative">
            <h3 className="text-base font-semibold text-foreground mb-4 z-10 relative">Error Distribution</h3>

            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

            <div className="h-64 relative z-10">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            animationBegin={0}
                            animationDuration={1500}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--popover)',
                                border: '1px solid var(--border)',
                                borderRadius: '12px',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                color: 'var(--foreground)'
                            }}
                            itemStyle={{ fontSize: '12px', color: 'var(--foreground)' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Total */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-2xl font-bold text-foreground">{total.toLocaleString()}</div>
                    <div className="text-[10px] uppercase font-semibold text-muted-foreground">Total Errors</div>
                </div>
            </div>

            {/* Error list */}
            <div className="mt-6 space-y-3 relative z-10">
                {chartData.map((item, index) => (
                    <div
                        key={item.name}
                        className="flex items-center justify-between p-2.5 rounded-xl hover:bg-secondary/50 transition-colors group"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-2.5 h-2.5 rounded-full ring-2 ring-white/50"
                                style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm font-medium text-foreground capitalize group-hover:text-primary transition-colors">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{item.value.toLocaleString()}</span>
                            <span className="text-xs font-bold text-foreground bg-secondary px-1.5 py-0.5 rounded-md border border-border">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
