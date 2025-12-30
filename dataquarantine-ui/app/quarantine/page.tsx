'use client'

import { motion } from 'framer-motion'
import { Search, Filter, Download, RefreshCw, Eye, AlertOctagon, FileWarning, AlertTriangle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Mock data
const mockQuarantineRecords = Array.from({ length: 10 }, (_, i) => ({
    id: `qr-${i + 1}`,
    topic: 'raw-events',
    partition: Math.floor(Math.random() * 3),
    offset: 12345 + i,
    timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    schema_name: 'user_event',
    schema_version: '1.0.0',
    error_type: ['schema_violation', 'missing_field', 'invalid_format'][Math.floor(Math.random() * 3)],
    error_message: 'Missing required field: user_id',
    created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
}))

const errorTypeConfig = {
    schema_violation: { color: 'text-rose-600 bg-rose-50 border-rose-200', icon: AlertOctagon },
    missing_field: { color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangle },
    invalid_format: { color: 'text-orange-600 bg-orange-50 border-orange-200', icon: FileWarning },
}

export default function QuarantinePage() {
    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex items-end justify-between"
            >
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-1">Quarantine</h1>
                    <p className="text-muted-foreground font-medium">Review and resolve blocked messages.</p>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl neu-flat hover:text-primary transition-all font-bold text-sm text-muted-foreground">
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 hover:scale-105 transition-all font-bold text-sm active:scale-95">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </motion.div>

            {/* Filters */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="neu-flat rounded-[2rem] p-6 lg:p-8"
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by ID, error, or schema..."
                            className="w-full pl-12 pr-4 h-12 neu-pressed rounded-2xl text-sm font-medium focus:outline-none transition-all placeholder:text-muted-foreground/50 bg-transparent"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <div className="relative">
                            <select className="w-full h-12 px-4 neu-pressed rounded-2xl text-sm font-bold text-foreground focus:outline-none appearance-none bg-transparent cursor-pointer">
                                <option>All Topics</option>
                                <option>raw-events</option>
                                <option>user-events</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <Filter className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3">
                        <div className="relative">
                            <select className="w-full h-12 px-4 neu-pressed rounded-2xl text-sm font-bold text-foreground focus:outline-none appearance-none bg-transparent cursor-pointer">
                                <option>All Error Types</option>
                                <option>schema_violation</option>
                                <option>missing_field</option>
                                <option>invalid_format</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                <Filter className="w-4 h-4" />
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <button className="w-full h-12 neu-icon-btn rounded-2xl text-muted-foreground hover:text-primary transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="neu-flat rounded-[2.5rem] p-2 overflow-hidden"
            >
                <div className="overflow-x-auto rounded-[2rem]">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-secondary/30">
                            <tr>
                                {[
                                    'ID', 'Topic', 'Schema', 'Error Type', 'Error Message', 'Time', 'Actions'
                                ].map((header) => (
                                    <th key={header} className="px-8 py-5 text-left text-xs font-black text-muted-foreground/70 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {mockQuarantineRecords.map((record, index) => {
                                const errorConfig = errorTypeConfig[record.error_type as keyof typeof errorTypeConfig] || errorTypeConfig.schema_violation;
                                const ErrorIcon = errorConfig.icon;

                                return (
                                    <tr
                                        key={record.id}
                                        className="hover:bg-primary/5 transition-colors group"
                                    >
                                        <td className="px-8 py-5 text-sm font-mono font-bold text-foreground">
                                            {record.id}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-foreground font-semibold">
                                            {record.topic}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-muted-foreground font-medium">
                                            {record.schema_name} <span className="text-[10px] font-bold bg-secondary px-2 py-1 rounded-lg text-foreground ml-2">v{record.schema_version}</span>
                                        </td>
                                        <td className="px-8 py-5">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl neu-pressed ${errorConfig.color.replace('bg-', 'text-').split(' ')[0]}`}>
                                                <ErrorIcon className="w-3.5 h-3.5" />
                                                {record.error_type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-5 text-sm text-foreground max-w-xs truncate font-medium">
                                            {record.error_message}
                                        </td>
                                        <td className="px-8 py-5 text-sm text-muted-foreground font-medium" suppressHydrationWarning>
                                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                                        </td>
                                        <td className="px-8 py-5">
                                            <button className="neu-icon-btn w-9 h-9 text-muted-foreground hover:text-primary">
                                                <Eye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-8 py-6 border-t border-border/20 flex items-center justify-between">
                    <p className="text-sm font-bold text-muted-foreground">
                        Showing <span className="text-foreground">1-10</span> of <span className="text-foreground">12.2k</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <button className="px-4 py-2 rounded-xl neu-flat hover:text-primary text-sm font-bold text-muted-foreground transition-all disabled:opacity-50">
                            Previous
                        </button>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 rounded-xl bg-primary text-white shadow-lg shadow-primary/30 text-sm font-bold flex items-center justify-center">
                                1
                            </button>
                            <button className="w-9 h-9 rounded-xl neu-flat hover:text-primary text-sm font-bold flex items-center justify-center text-muted-foreground transition-all">
                                2
                            </button>
                            <button className="w-9 h-9 rounded-xl neu-flat hover:text-primary text-sm font-bold flex items-center justify-center text-muted-foreground transition-all">
                                3
                            </button>
                        </div>
                        <button className="px-4 py-2 rounded-xl neu-flat hover:text-primary text-sm font-bold text-muted-foreground transition-all">
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
