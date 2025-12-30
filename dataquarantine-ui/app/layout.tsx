import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DataQuarantine | Modern Validated Streams",
  description: "Real-time data validation and quarantine system.",
};

import Providers from "./providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground min-h-screen`}>
        <Providers>
          {/* Main Application Wrapper */}
          <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden md:ml-64">
              {/* Header */}
              <Header />

              {/* Main Content */}
              <main className="w-full flex-grow p-6 md:p-8 lg:p-10 transition-all duration-300">
                <div className="mx-auto w-full max-w-7xl animate-fade-in">
                  {children}
                </div>
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
