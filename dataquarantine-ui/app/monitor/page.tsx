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
        <div className="max-w-7xl mx-auto space-y-8 pb-12">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">Live Monitor</h1>
                    <p className="text-muted-foreground font-medium mt-1">Real-time event stream inspection</p>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className={`px-6 py-3 rounded-2xl neu-flat font-bold transition-all active:scale-95 flex items-center gap-2 ${isPlaying ? 'text-amber-600' : 'text-emerald-600'}`}
                    >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Resume'}
                    </button>

                    <button className="px-5 py-3 rounded-2xl neu-flat hover:text-primary text-foreground flex items-center gap-2 text-sm font-bold transition-all">
                        <Filter className="w-4 h-4" />
                        Filters
                    </button>
                </div>
            </div>

            <div className="neu-flat rounded-[3rem] p-4 lg:p-6 h-[75vh] flex flex-col">
                {/* Log Header */}
                <div className="flex items-center justify-between px-6 py-4 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 neu-pressed rounded-full text-muted-foreground">
                            <Terminal className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-bold text-muted-foreground tracking-tight">stream: <span className="text-primary">raw-events</span></span>
                    </div>
                    <div className="flex items-center gap-3 px-4 py-2 neu-pressed rounded-xl">
                        <span className="flex h-2.5 w-2.5">
                            <span className={`${isPlaying ? 'animate-ping' : ''} inline-flex h-full w-full rounded-full bg-green-400 opacity-75`}></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-gradient-to-br from-green-400 to-emerald-600"></span>
                        </span>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">{isPlaying ? 'Live' : 'Paused'}</span>
                    </div>
                </div>

                {/* Logs Stream (Sunken Screen) */}
                <div className="flex-1 neu-pressed rounded-[2rem] p-4 md:p-6 overflow-y-auto space-y-3 relative">
                    <AnimatePresence initial={false}>
                        {logs.map((log) => (
                            <motion.div
                                key={log.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                className={`p-4 rounded-2xl flex items-start gap-4 ${log.type === 'ERROR'
                                    ? 'bg-gradient-to-r from-rose-50 to-transparent border border-rose-100 shadow-sm'
                                    : 'neu-convex'
                                    }`}
                            >
                                <div className="mt-1">
                                    {log.type === 'ERROR' ? (
                                        <div className="p-2 bg-rose-100 rounded-lg text-rose-600 shadow-sm">
                                            <AlertOctagon className="w-4 h-4" />
                                        </div>
                                    ) : (
                                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 shadow-sm">
                                            <CheckCircle2 className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide ${log.type === 'ERROR' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                                            }`}>
                                            {log.type}
                                        </span>
                                        <span className="text-xs font-mono text-muted-foreground">
                                            {log.timestamp.split('T')[1].replace('Z', '')}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground/60 ml-auto uppercase bg-background/50 px-2 py-1 rounded">
                                            P-{log.metadata.partition} : OFF-{log.metadata.offset}
                                        </span>
                                    </div>
                                    <p className={`text-sm font-medium ${log.type === 'ERROR' ? 'text-rose-700' : 'text-foreground'}`}>
                                        {log.message}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {logs.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/40 space-y-4">
                            <div className="p-6 neu-convex rounded-full">
                                <Terminal className="w-12 h-12 opacity-50" />
                            </div>
                            <p className="font-bold text-lg">Waiting for incoming events...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
