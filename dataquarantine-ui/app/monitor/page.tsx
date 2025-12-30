'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Filter, Terminal, CheckCircle2, AlertOctagon } from 'lucide-react'

// Mock streaming data generator
const generateLog = (id: number) => {
    const isError = Math.random() > 0.7
    return {
        id,
        timestamp: new Date().toISOString(),
        type: isError ? 'ERROR' : 'INFO',
        source: isError ? 'kafka-consumer-error' : 'schema-validator',
        message: isError
            ? `Validation failed: Schema mismatch for user_event v1.${Math.floor(Math.random() * 5)}`
            : `Successfully processed event ${Math.floor(Math.random() * 100000)}`,
        metadata: {
            partition: Math.floor(Math.random() * 3),
            offset: 100000 + id
        }
    }
}

export default function MonitorPage() {
    const [logs, setLogs] = useState<any[]>([])
    const [isPlaying, setIsPlaying] = useState(true)

    useEffect(() => {
        if (!isPlaying) return

        const interval = setInterval(() => {
            setLogs(current => {
                const newLog = generateLog(Date.now())
                return [newLog, ...current].slice(0, 50) // Keep last 50 logs
            })
        }, 800)

        return () => clearInterval(interval)
    }, [isPlaying])

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Live Monitor</h1>
                    <p className="text-muted-foreground mt-1">Real-time event stream inspection</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-all ${isPlaying
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause Stream' : 'Resume Stream'}
                    </button>
                    <button className="px-4 py-2 rounded-xl border border-border bg-card hover:bg-secondary text-foreground flex items-center gap-2 text-sm font-medium">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden flex flex-col h-[70vh]">
                {/* Log Header */}
                <div className="flex items-center justify-between px-6 py-3 bg-secondary/30 border-b border-border">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Terminal className="w-4 h-4" />
                        <span>stream: raw-events</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2">
                            <span className={`${isPlaying ? 'animate-ping' : ''} inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}></span>
                        </span>
                        <span className="text-xs font-medium text-green-600 uppercase tracking-widest">{isPlaying ? 'Live' : 'Paused'}</span>
                    </div>
                </div>

                {/* Logs Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-background/50 font-mono text-sm relative">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{ opacity: 1, x: 0, height: 'auto' }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className={`p-3 rounded-lg border flex items-start gap-4 ${log.type === 'ERROR'
                                        ? 'bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30'
                                        : 'bg-card border-border'
                                    }`}
                            >
                                <div className="mt-0.5">
                                    {log.type === 'ERROR' ? (
                                        <AlertOctagon className="w-4 h-4 text-rose-500" />
                                    ) : (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${log.type === 'ERROR' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                            }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {log.timestamp}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-auto">
                                            partition-{log.metadata.partition} offset:{log.metadata.offset}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${log.type === 'ERROR' ? 'text-rose-900' : 'text-foreground'}`}>
                                        {log.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                            <Terminal className="w-12 h-12 mb-4 opacity-20" />
                            <p>Waiting for incoming events...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
