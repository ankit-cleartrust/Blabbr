"use client"

import { useCallback } from "react"

/**
 * A hook for using the Web Share API with proper fallbacks
 */
export function useWebShare() {
  // Check if Web Share API is supported
  const isSupported =
    typeof navigator !== "undefined" &&
    typeof navigator.share === "function" &&
    typeof navigator.canShare === "function"

  // Share function with proper error handling
  const share = useCallback(
    async (data: { title?: string; text?: string; url?: string }): Promise<boolean> => {
      if (!isSupported) {
        return false
      }

      try {
        // Ensure we have a valid URL for sharing
        const shareData: ShareData = {}

        // Add title and text if provided
        if (data.title) shareData.title = data.title
        if (data.text) shareData.text = data.text

        // Add URL if provided and valid
        if (data.url) {
          try {
            shareData.url = new URL(data.url).toString()
          } catch (e) {
            // If URL is invalid, use current URL
            shareData.url = window.location.href
          }
        } else {
          // If no URL provided, use current URL
          shareData.url = window.location.href
        }

        // Check if this data can be shared
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData)
          return true
        }

        // If we can't share with URL, try without it
        if (shareData.url && (shareData.title || shareData.text)) {
          const dataWithoutUrl = { ...shareData }
          delete dataWithoutUrl.url

          if (navigator.canShare(dataWithoutUrl)) {
            await navigator.share(dataWithoutUrl)
            return true
          }
        }

        return false
      } catch (error) {
        // AbortError is thrown when user cancels the share dialog
        if (error instanceof Error && error.name !== "AbortError") {
          console.warn("Web Share API error:", error.message)
        }
        return false
      }
    },
    [isSupported],
  )

  return { share, isSupported }
}
