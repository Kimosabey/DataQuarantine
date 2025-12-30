'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
    LayoutDashboard,
    ShieldAlert,
    Activity,
    Database,
    Settings,
    ShieldCheck,
    Cpu
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Quarantine', href: '/quarantine', icon: ShieldAlert },
    { name: 'Live Monitor', href: '/monitor', icon: Activity },
    { name: 'Schemas', href: '/schemas', icon: Database },
    { name: 'System', href: '/system', icon: Cpu },
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-0 h-screen w-64 bg-card border-r border-border hidden md:flex flex-col z-50 shadow-sm"
        >
            {/* Logo Area */}
            <div className="p-6 pb-8 border-b border-border/40">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform group-hover:scale-105">
                        <ShieldCheck className="w-6 h-6" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight text-foreground leading-none">
                            DataQuarantine
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground mt-1">
                            Schema Enforcer
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative',
                                isActive
                                    ? 'text-primary bg-primary/10'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-active"
                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                />
                            )}
                            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User / Status */}
            <div className="p-4 border-t border-border/40">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-border/50">
                    <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            AD
                        </div>
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-semibold text-foreground">Admin User</span>
                        <span className="text-xs text-muted-foreground">Connected</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
