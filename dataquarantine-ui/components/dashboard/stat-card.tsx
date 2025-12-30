'use client'

import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
    title: string
    value: string | number
    change?: number
    icon: React.ReactNode
    trend?: 'up' | 'down' | 'neutral'
    colorClass?: string  // e.g. text-blue-600
    bgClass?: string     // e.g. bg-blue-100
    delay?: number
}

export function StatCard({
    title,
    value,
    change,
    icon,
    trend,
    colorClass = "text-primary",
    bgClass = "bg-primary/10",
    delay = 0,
}: StatCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            className="group relative overflow-hidden rounded-2xl bg-card border border-border shadow-sm p-6 hover:shadow-md transition-all duration-300"
        >
            <div className="flex items-start justify-between">
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.4, delay: delay + 0.1 }}
                        className="text-3xl font-bold text-foreground tracking-tight"
                    >
                        {value}
                    </motion.div>
                </div>
                <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110 duration-500", bgClass, colorClass)}>
                    {icon}
                </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
                {change !== undefined && (
                    <div className={cn(
                        "flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full",
                        trend === 'up' ? "text-green-600 bg-green-100" :
                            trend === 'down' ? "text-red-600 bg-red-100" : "text-gray-600 bg-gray-100"
                    )}>
                        {trend === 'up' ? <ArrowUp className="w-3 h-3" /> :
                            trend === 'down' ? <ArrowDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span>{Math.abs(change)}%</span>
                    </div>
                )}
                <span className="text-xs text-muted-foreground">vs last hour</span>
            </div>
        </motion.div>
    )
}
