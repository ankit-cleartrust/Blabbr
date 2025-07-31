"use client"

import { useEffect } from "react"
import { initSchedulerService, stopSchedulerService, manualCheckScheduledPosts } from "@/lib/scheduler-service"

export function SchedulerProvider() {
  useEffect(() => {
    // Initialize the scheduler service
    initSchedulerService()

    // Clean up on unmount
    return () => {
      stopSchedulerService()
    }
  }, [])

  // Check for scheduled posts when the visibility changes (user returns to the tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        manualCheckScheduledPosts()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  // This component doesn't render anything
  return null
}
