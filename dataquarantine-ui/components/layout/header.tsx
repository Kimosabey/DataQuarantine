'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Search, Command, HelpCircle, Trash2, RefreshCw, Power } from 'lucide-react'
import { toast } from 'sonner'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { Modal } from '@/components/ui/modal'

export function Header() {
    const [isActionsOpen, setIsActionsOpen] = useState(false)

    const handleAction = (action: string) => {
        toast.success(`${action} triggered successfully!`)
        setIsActionsOpen(false)
    }

    return (
        <>
            <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm pt-4 px-6 md:px-8 pb-2 transition-all duration-300">
                <div className="flex h-16 items-center gap-4">

                    {/* Search Bar - Neumorphic Pressed/Inset */}
                    <div className="flex-1 flex justify-center md:justify-start">
                        <div className="relative group w-full max-w-md">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search events, schemas, logs..."
                                className="w-full h-12 pl-12 pr-14 neu-pressed rounded-2xl text-sm focus:outline-none transition-all font-bold text-foreground placeholder:text-muted-foreground/60"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                <kbd className="hidden md:inline-flex h-6 items-center gap-1 rounded-lg border border-transparent bg-transparent font-mono text-xs font-bold text-muted-foreground/50">
                                    ⌘K
                                </kbd>
                            </div>
                        </div>
                    </div>

                    {/* Right Actions - Neumorphic Flat Buttons */}
                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        <button
                            className="neu-icon-btn w-11 h-11 text-muted-foreground"
                            onClick={() => toast.info("Help Center is currently under maintenance.")}
                        >
                            <HelpCircle className="w-5 h-5" />
                        </button>

                        <button
                            className="neu-icon-btn w-11 h-11 text-muted-foreground relative group"
                            onClick={() => toast.success("No new notifications.", { description: "You are all caught up!" })}
                        >
                            <Bell className="w-5 h-5 group-hover:text-primary transition-colors" />
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border border-background shadow-sm"></span>
                        </button>

                        <div className="pl-2">
                            <button
                                className="h-11 px-4 neu-flat rounded-xl flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary transition-all active:scale-95 active:neu-pressed"
                                onClick={() => setIsActionsOpen(true)}
                            >
                                <Command className="w-4 h-4" />
                                <span>Actions</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Actions Modal */}
            <Modal isOpen={isActionsOpen} onClose={() => setIsActionsOpen(false)} title="Quick Actions">
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => handleAction('System Cache Cleared')}
                        className="neu-flat p-6 rounded-2xl flex flex-col items-center gap-3 hover:scale-105 transition-transform group text-muted-foreground hover:text-red-500"
                    >
                        <div className="p-3 rounded-full neu-pressed group-hover:bg-red-50 dark:group-hover:bg-red-900/20">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Clear Cache</span>
                    </button>

                    <button
                        onClick={() => handleAction('Services Restarted')}
                        className="neu-flat p-6 rounded-2xl flex flex-col items-center gap-3 hover:scale-105 transition-transform group text-muted-foreground hover:text-blue-500"
                    >
                        <div className="p-3 rounded-full neu-pressed group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20">
                            <RefreshCw className="w-6 h-6" />
                        </div>
                        <span className="font-bold text-sm">Restart Services</span>
                    </button>

                    <button
                        onClick={() => handleAction('System Reboot Initiated')}
                        className="col-span-2 neu-flat p-4 rounded-xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-transform text-red-500 font-bold"
                    >
                        <Power className="w-5 h-5" />
                        <span>Reboot System</span>
                    </button>
                </div>

                <div className="mt-8 p-4 rounded-xl neu-pressed bg-opacity-50">
                    <p className="text-xs text-center text-muted-foreground font-medium">
                        Administrator access verified. Actions are logged.
                    </p>
                </div>
            </Modal>
        </>
    )
}
