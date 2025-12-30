'use client'

import { Save } from 'lucide-react'

export default function SettingsPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="border-b border-border pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage system configuration and preferences.</p>
            </div>

            <div className="space-y-6">
                <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">General Preferences</h2>
                    <div className="grid gap-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-foreground">Dark Mode</label>
                                <p className="text-xs text-muted-foreground">Toggle system visual theme</p>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-secondary border border-border relative cursor-not-allowed">
                                <div className="absolute top-1 left-1 h-4 w-4 rounded-full bg-muted-foreground/30"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <label className="text-sm font-medium text-foreground">Notifications</label>
                                <p className="text-xs text-muted-foreground">Receive alerts for validation errors</p>
                            </div>
                            <div className="h-6 w-11 rounded-full bg-primary relative cursor-pointer">
                                <div className="absolute top-1 right-1 h-4 w-4 rounded-full bg-white shadow"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">Kafka Configuration</h2>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Bootstrap Servers</label>
                                <input type="text" value="dataquarantine-kafka:9092" disabled className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-transparent text-sm" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-1 block">Consumer Group</label>
                                <input type="text" value="validator-group-01" disabled className="w-full px-3 py-2 rounded-lg bg-secondary/50 border border-transparent text-sm" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 font-medium transition-colors shadow-lg shadow-primary/20">
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    )
}
