'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Activity, CheckCircle, ShieldAlert, Zap, Server, Database, HardDrive, Cpu } from 'lucide-react'
import { StatCard } from '@/components/dashboard/stat-card'
import { ErrorBreakdown } from '@/components/dashboard/error-breakdown'
import { ValidationChart } from '@/components/dashboard/validation-chart'
import { formatNumber } from '@/lib/utils'
import { fetchMetrics, SystemMetrics } from '@/lib/api'

// Mock chart data - Backend does not yet support time-series history
const mockChartData = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  valid: Math.floor(Math.random() * 5000) + 3000,
  invalid: Math.floor(Math.random() * 500) + 100,
}))

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)

  useEffect(() => {
    // Initial fetch
    fetchMetrics().then(setMetrics).catch(console.error)

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchMetrics().then(setMetrics).catch(console.error)
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const data = metrics || {
    total_processed: 0,
    total_valid: 0,
    total_invalid: 0,
    validation_rate: 0,
    throughput: 0,
    error_breakdown: { 'system_initializing': 1 }
  }

  const validPercentage = data.total_processed > 0
    ? ((data.total_valid / data.total_processed) * 100).toFixed(2)
    : "0.00"

  const invalidPercentage = data.total_processed > 0
    ? ((data.total_invalid / data.total_processed) * 100).toFixed(2)
    : "0.00"

  return (
    <div className="space-y-8 pb-10">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-end justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Overview</h1>
          <p className="text-muted-foreground font-medium">System performance and data validation metrics.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            System Live
          </span>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Processed"
          value={formatNumber(data.total_processed)}
          change={12.5}
          trend="up"
          icon={<Activity className="w-5 h-5" />}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
          delay={0}
        />

        <StatCard
          title="Valid Records"
          value={formatNumber(data.total_valid)}
          change={8.3}
          trend="up"
          icon={<CheckCircle className="w-5 h-5" />}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
          delay={0.1}
        />

        <StatCard
          title="Quarantined"
          value={formatNumber(data.total_invalid)}
          change={-2.1}
          trend="down"
          icon={<ShieldAlert className="w-5 h-5" />}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
          delay={0.2}
        />

        <StatCard
          title="Throughput"
          value={`${formatNumber(data.throughput)}/s`}
          change={15.7}
          trend="up"
          icon={<Zap className="w-5 h-5" />}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
          delay={0.3}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Main Validation Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-border bg-card shadow-sm p-1"
          >
            <ValidationChart data={mockChartData} />
          </motion.div>

          {/* Progress Bars */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="rounded-2xl border border-border bg-card shadow-sm p-6"
          >
            <h3 className="text-base font-semibold text-foreground mb-5">Validation Health</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Valid Messages</span>
                  <span className="text-sm font-bold text-emerald-600">{validPercentage}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${validPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-muted-foreground">Quarantined Messages</span>
                  <span className="text-sm font-bold text-rose-600">{invalidPercentage}%</span>
                </div>
                <div className="h-2.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${invalidPercentage}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full bg-rose-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <ErrorBreakdown data={data.error_breakdown} />
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="rounded-2xl border border-border bg-card shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-foreground">System Status</h3>
              <div className="px-2 py-0.5 rounded text-[10px] font-bold bg-secondary text-muted-foreground uppercase">Real-time</div>
            </div>

            <div className="space-y-3">
              {[
                { name: 'Kafka Consumer', status: 'healthy', icon: Server, color: "text-orange-500" },
                { name: 'Schema Registry', status: 'healthy', icon: Database, color: "text-blue-500" },
                { name: 'PostgreSQL', status: 'healthy', icon: HardDrive, color: "text-indigo-500" },
                { name: 'MinIO Storage', status: 'healthy', icon: Cpu, color: "text-red-500" },
              ].map((service, index) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-1.5 rounded-lg bg-card ${service.color} shadow-sm`}>
                      <service.icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wide">Operational</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
