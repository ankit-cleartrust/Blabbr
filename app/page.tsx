"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import ContentGenerator from "@/components/content-generator"
import UserMenu from "@/components/user-menu"
import { Toaster } from "@/components/ui/toaster"
import { initSchedulerService } from "@/lib/scheduler-service"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === "loading") return // Still loading
    if (!session) {
      router.push("/login")
      return
    }

    // Initialize the scheduler service when user is authenticated
    initSchedulerService()
  }, [session, status, router])

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-[#013060] text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
      </div>
    )
  }

  // Don't render anything if not authenticated (will redirect)
  if (!session) {
    return null
  }

  return (
    <main className="min-h-screen bg-[#013060] text-white">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-end items-center mb-6">
          <UserMenu user={session.user} />
        </div>
        <ContentGenerator />
        <Toaster />
      </div>
    </main>
  )
}
