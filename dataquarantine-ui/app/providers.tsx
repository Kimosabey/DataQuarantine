'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import { useState } from 'react'

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000,
                refetchInterval: 2000,
            },
        },
    }))

    return (
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
            <QueryClientProvider client={queryClient}>
                {children}
                <Toaster position="top-right" richColors closeButton theme="system" />
            </QueryClientProvider>
        </ThemeProvider>
    )
}
