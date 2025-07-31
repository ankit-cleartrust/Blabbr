import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ToastProvider } from "@/components/providers/toast-provider"
import { SchedulerProvider } from "@/components/providers/scheduler-provider"
import { SessionProvider } from "@/components/providers/session-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Content Generation Engine",
  description: "AI-powered content generation for social media and blogs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider>
          {children}
          <ToastProvider />
          <SchedulerProvider />
        </SessionProvider>
      </body>
    </html>
  )
}
