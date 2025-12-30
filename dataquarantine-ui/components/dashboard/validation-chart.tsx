'use client'

import { motion } from 'framer-motion'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface ValidationChartProps {
    data: Array<{
        time: string
        valid: number
        invalid: number
    }>
}

export function ValidationChart({ data }: ValidationChartProps) {
    return (
        <div className="w-full h-full p-4 lg:p-6">
            <div className="flex items-center justify-between mb-8 pl-2">
                <h3 className="text-lg font-bold text-foreground">TRAFFIC OVERVIEW</h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neu-pressed">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Valid</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl neu-pressed">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Quarantined</span>
                    </div>
                </div>
            </div>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={data}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorValid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorInvalid" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="var(--muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dy={10}
                            fontWeight={600}
                        />
                        <YAxis
                            stroke="var(--muted-foreground)"
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            dx={-10}
                            fontWeight={600}
                        />
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
                            labelStyle={{ color: 'var(--muted-foreground)', marginBottom: '0.5rem', fontWeight: 700 }}
                            cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1, strokeDasharray: '4 4' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="valid"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorValid)"
                            animationDuration={1500}
                        />
                        <Area
                            type="monotone"
                            dataKey="invalid"
                            stroke="#f43f5e"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorInvalid)"
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
