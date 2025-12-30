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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Quarantine</h1>
                    <p className="text-muted-foreground font-medium">Review and resolve blocked messages.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-xl bg-card border border-border hover:bg-secondary text-foreground text-sm font-medium flex items-center gap-2 transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Export
                    </button>

                    <button className="px-4 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium flex items-center gap-2 shadow-md transition-all active:scale-95">
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
                className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6"
            >
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by ID, error, or schema..."
                            className="w-full pl-10 pr-4 py-2.5 bg-secondary/30 border border-transparent hover:border-border focus:bg-background focus:border-ring rounded-xl text-sm transition-all outline-none"
                        />
                    </div>

                    <div className="md:col-span-3">
                        <select className="w-full px-4 py-2.5 bg-secondary/30 border border-transparent hover:border-border focus:bg-background focus:border-ring rounded-xl text-sm transition-all outline-none cursor-pointer">
                            <option>All Topics</option>
                            <option>raw-events</option>
                            <option>user-events</option>
                        </select>
                    </div>

                    <div className="md:col-span-3">
                        <select className="w-full px-4 py-2.5 bg-secondary/30 border border-transparent hover:border-border focus:bg-background focus:border-ring rounded-xl text-sm transition-all outline-none cursor-pointer">
                            <option>All Error Types</option>
                            <option>schema_violation</option>
                            <option>missing_field</option>
                            <option>invalid_format</option>
                        </select>
                    </div>

                    <div className="md:col-span-1">
                        <button className="w-full h-full px-4 py-2.5 bg-secondary/30 hover:bg-secondary border border-transparent rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                            <Filter className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Table */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap">
                        <thead className="bg-secondary/30">
                            <tr>
                                {[
                                    'ID', 'Topic', 'Schema', 'Error Type', 'Error Message', 'Time', 'Actions'
                                ].map((header) => (
                                    <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {mockQuarantineRecords.map((record, index) => {
                                const errorConfig = errorTypeConfig[record.error_type as keyof typeof errorTypeConfig] || errorTypeConfig.schema_violation;
                                const ErrorIcon = errorConfig.icon;

                                return (
                                    <tr
                                        key={record.id}
                                        className="hover:bg-muted/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4 text-sm font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                                            {record.id}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground font-medium">
                                            {record.topic}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {record.schema_name} <span className="text-xs bg-secondary px-1.5 py-0.5 rounded text-foreground">v{record.schema_version}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border ${errorConfig.color}`}>
                                                <ErrorIcon className="w-3 h-3" />
                                                {record.error_type.replace('_', ' ')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-foreground max-w-xs truncate font-medium">
                                            {record.error_message}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(record.created_at), { addSuffix: true })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
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
                <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-secondary/10">
                    <p className="text-sm text-muted-foreground font-medium">
                        Showing <span className="text-foreground">1</span> to <span className="text-foreground">10</span> of <span className="text-foreground">12,222</span> results
                    </p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium text-foreground transition-colors disabled:opacity-50">
                            Previous
                        </button>
                        <div className="flex gap-1">
                            <button className="w-8 h-8 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center shadow-sm">
                                1
                            </button>
                            <button className="w-8 h-8 rounded-lg text-foreground hover:bg-secondary text-sm font-medium flex items-center justify-center transition-colors">
                                2
                            </button>
                            <button className="w-8 h-8 rounded-lg text-foreground hover:bg-secondary text-sm font-medium flex items-center justify-center transition-colors">
                                3
                            </button>
                        </div>
                        <button className="px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-sm font-medium text-foreground transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
