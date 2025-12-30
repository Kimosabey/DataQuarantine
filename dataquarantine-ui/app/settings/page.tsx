'use client'

import { Save } from 'lucide-react'

import { useTheme } from 'next-themes'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function SettingsPage() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    // Prevent hydration mismatch
    if (!mounted) return null;

    const isDark = theme === 'dark'

    return (
        <div className="max-w-5xl mx-auto space-y-10 pb-10">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground mb-1">Settings</h1>
                    <p className="text-muted-foreground font-medium">Manage system configuration and preferences.</p>
                </div>
            </div>

            <div className="grid gap-8">
                {/* General Preferences */}
                <div className="neu-flat rounded-[2.5rem] p-8">
                    <h2 className="text-lg font-bold text-foreground mb-6 uppercase tracking-wider">General Preferences</h2>
                    <div className="grid gap-6">
                        <div className="flex items-center justify-between p-4 rounded-3xl neu-pressed">
                            <div className="pl-2">
                                <label className="text-base font-bold text-foreground">Dark Mode</label>
                                <p className="text-sm font-medium text-muted-foreground mt-0.5">Toggle system visual theme</p>
                            </div>
                            <div
                                className={`h-8 w-14 rounded-full relative cursor-pointer transition-colors duration-300 ${isDark ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                            >
                                <motion.div
                                    initial={false}
                                    animate={{ x: isDark ? 24 : 4 }}
                                    className="absolute top-1 h-6 w-6 rounded-full bg-white shadow-md"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-3xl neu-pressed">
                            <div className="pl-2">
                                <label className="text-base font-bold text-foreground">Notifications</label>
                                <p className="text-sm font-medium text-muted-foreground mt-0.5">Receive alerts for validation errors</p>
                            </div>
                            <div className="h-8 w-14 rounded-full bg-primary/10 relative cursor-pointer shadow-inner inset-shadow">
                                <div className="absolute top-1 right-1 h-6 w-6 rounded-full bg-primary shadow-lg shadow-primary/40 transform scale-110"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kafka Config */}
                <div className="neu-flat rounded-[2.5rem] p-8">
                    <h2 className="text-lg font-bold text-foreground mb-6 uppercase tracking-wider">Kafka Configuration</h2>
                    <div className="grid gap-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-2">Bootstrap Servers</label>
                                <input
                                    type="text"
                                    value="dataquarantine-kafka:9092"
                                    disabled
                                    className="w-full px-5 py-3.5 rounded-2xl neu-pressed text-sm font-bold text-foreground bg-transparent border-none opacity-70"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-muted-foreground ml-2">Consumer Group</label>
                                <input
                                    type="text"
                                    value="validator-group-01"
                                    disabled
                                    className="w-full px-5 py-3.5 rounded-2xl neu-pressed text-sm font-bold text-foreground bg-transparent border-none opacity-70"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <button className="flex items-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 font-bold text-lg shadow-xl shadow-primary/30 transition-all">
                        <Save className="w-5 h-5" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
