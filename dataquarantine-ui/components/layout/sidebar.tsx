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
    { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
    const pathname = usePathname()

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="fixed left-0 top-0 h-screen w-64 bg-card border-r-2 border-slate-200 hidden md:flex flex-col z-50 shadow-sm"
        >
            {/* Logo Area */}
            <div className="p-6 pb-8">
                <Link href="/" className="flex items-center gap-4 group">
                    <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-500/30 transition-transform group-hover:scale-105 active:scale-95">
                        <ShieldCheck className="w-7 h-7" strokeWidth={2.5} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-xl tracking-tight text-foreground leading-none">
                            DataQuarantine
                        </span>
                        <span className="text-[10px] uppercase tracking-wider font-extrabold text-primary mt-1">
                            Streaming Validation
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-3 overflow-y-auto">
                {navigation.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-4 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-300 group relative',
                                isActive
                                    ? 'neu-pressed text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:neu-convex'
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-colors duration-300",
                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                            )}>
                                <Icon className="w-5 h-5" />
                            </div>
                            <span>{item.name}</span>
                        </Link>
                    )
                })}
            </nav>

            {/* User / Status */}
            <div className="p-4">
                <div className="flex items-center gap-3 p-4 rounded-2xl neu-convex">
                    <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            AD
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">Admin User</span>
                        <span className="text-xs text-muted-foreground font-medium">Connected</span>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
