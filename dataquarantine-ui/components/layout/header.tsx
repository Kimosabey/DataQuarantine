'use client'

import { motion } from 'framer-motion'
import { Bell, Search, Command, HelpCircle } from 'lucide-react'

export function Header() {
    return (
        <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-md border-b border-border/50">
            <div className="flex h-16 items-center gap-4 px-6 md:px-8">

                {/* Search Bar - Modern "Command" style */}
                <div className="flex-1 flex justify-center md:justify-start">
                    <div className="relative group w-full max-w-md">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                            <Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search events, schemas, logs..."
                            className="w-full h-10 pl-10 pr-12 bg-secondary/50 border-none rounded-full text-sm focus:bg-background focus:ring-2 focus:ring-primary/20 transition-all font-medium placeholder:text-muted-foreground/70"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </div>
                    </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    <button className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <HelpCircle className="w-5 h-5" />
                    </button>

                    <button className="relative p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors group">
                        <Bell className="w-5 h-5 group-hover:animate-swing" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-background"></span>
                    </button>

                    <div className="h-8 w-[1px] bg-border mx-1 hidden md:block"></div>
                </div>
            </div>
        </header>
    )
}
