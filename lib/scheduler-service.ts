import type { ScheduledPost } from "./types"
import { schedulePostToMake } from "./make-integration"
import { postToLinkedInDirect } from "./linkedin-posting"
import { getLinkedInConnection } from "./linkedin-connection"

// Interval in milliseconds to check for scheduled posts (1 minute)
const CHECK_INTERVAL = 60 * 1000

let schedulerInterval: NodeJS.Timeout | null = null
let isInitialized = false

export interface SchedulerService {
  schedulePost: (post: ScheduledPost) => Promise<void>
  getScheduledPosts: () => ScheduledPost[]
  updatePostStatus: (id: string, status: ScheduledPost["status"], error?: string) => void
  deletePost: (id: string) => void
  publishPost: (post: ScheduledPost) => Promise<void>
}

class LocalSchedulerService implements SchedulerService {
  private posts: ScheduledPost[] = []
  private checkInterval: NodeJS.Timeout | null = null

  constructor() {
    this.loadPosts()
    this.startScheduleChecker()
  }

  private loadPosts(): void {
    try {
      const stored = localStorage.getItem("scheduledPosts")
      if (stored) {
        this.posts = JSON.parse(stored)
      }
    } catch (error) {
      console.error("Failed to load scheduled posts:", error)
      this.posts = []
    }
  }

  private savePosts(): void {
    try {
      localStorage.setItem("scheduledPosts", JSON.stringify(this.posts))
    } catch (error) {
      console.error("Failed to save scheduled posts:", error)
    }
  }

  private startScheduleChecker(): void {
    // Check every minute for posts that need to be published
    this.checkInterval = setInterval(() => {
      this.checkAndPublishPosts()
    }, 60000) // 1 minute
  }

  private async checkAndPublishPosts(): Promise<void> {
    const now = new Date()
    const postsToPublish = this.posts.filter(
      (post) => post.status === "scheduled" && new Date(post.scheduledDate) <= now,
    )

    for (const post of postsToPublish) {
      try {
        this.updatePostStatus(post.id, "publishing")
        await this.publishPost(post)
        this.updatePostStatus(post.id, "published")
      } catch (error) {
        console.error("Failed to publish post:", error)
        this.updatePostStatus(post.id, "failed", error instanceof Error ? error.message : "Unknown error")
      }
    }
  }

  async schedulePost(post: ScheduledPost): Promise<void> {
    this.posts.push(post)
    this.savePosts()
  }

  getScheduledPosts(): ScheduledPost[] {
    return [...this.posts].sort((a, b) => new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime())
  }

  updatePostStatus(id: string, status: ScheduledPost["status"], error?: string): void {
    const post = this.posts.find((p) => p.id === id)
    if (post) {
      post.status = status
      if (error) {
        post.error = error
      }
      this.savePosts()
    }
  }

  deletePost(id: string): void {
    this.posts = this.posts.filter((p) => p.id !== id)
    this.savePosts()
  }

  async publishPost(post: ScheduledPost): Promise<void> {
    const results: { platform: string; success: boolean; error?: string }[] = []

    // Check if LinkedIn is in the platforms and attempt direct posting
    if (post.platforms.includes("linkedin")) {
      try {
        const linkedinConnection = await getLinkedInConnection()

        if (linkedinConnection?.accessToken) {
          // Attempt direct LinkedIn posting
          try {
            await postToLinkedInDirect({
              content: post.content,
              imageUrl: post.imageUrl,
              accessToken: linkedinConnection.accessToken,
              userId: linkedinConnection.userId,
            })

            results.push({ platform: "linkedin", success: true })

            // Show success notification
            if (typeof window !== "undefined") {
              const event = new CustomEvent("toast", {
                detail: {
                  title: "LinkedIn Post Published",
                  description: "Your scheduled post was successfully published to LinkedIn.",
                  type: "success",
                },
              })
              window.dispatchEvent(event)
            }
          } catch (linkedinError) {
            console.error("Direct LinkedIn posting failed:", linkedinError)
            results.push({
              platform: "linkedin",
              success: false,
              error: linkedinError instanceof Error ? linkedinError.message : "LinkedIn posting failed",
            })

            // Show error notification
            if (typeof window !== "undefined") {
              const event = new CustomEvent("toast", {
                detail: {
                  title: "LinkedIn Post Failed",
                  description: `Failed to post to LinkedIn: ${linkedinError instanceof Error ? linkedinError.message : "Unknown error"}`,
                  type: "error",
                },
              })
              window.dispatchEvent(event)
            }
          }
        } else {
          results.push({
            platform: "linkedin",
            success: false,
            error: "LinkedIn not connected. Please connect your LinkedIn account in settings.",
          })

          // Show connection error notification
          if (typeof window !== "undefined") {
            const event = new CustomEvent("toast", {
              detail: {
                title: "LinkedIn Not Connected",
                description: "Please connect your LinkedIn account in settings to post directly.",
                type: "error",
              },
            })
            window.dispatchEvent(event)
          }
        }
      } catch (error) {
        console.error("Error checking LinkedIn connection:", error)
        results.push({
          platform: "linkedin",
          success: false,
          error: "Failed to check LinkedIn connection",
        })
      }
    }

    // Always send to Make.com for other platforms or as backup
    try {
      await schedulePostToMake({
        content: post.content,
        platforms: post.platforms,
        scheduledDate: post.scheduledDate,
        imageUrl: post.imageUrl,
        contentType: post.contentType,
        topic: post.topic,
        recurrence: post.recurrence,
      })

      // Add success for non-LinkedIn platforms
      const otherPlatforms = post.platforms.filter((p) => p !== "linkedin")
      otherPlatforms.forEach((platform) => {
        results.push({ platform, success: true })
      })
    } catch (makeError) {
      console.error("Make.com webhook failed:", makeError)

      // Add failure for non-LinkedIn platforms
      const otherPlatforms = post.platforms.filter((p) => p !== "linkedin")
      otherPlatforms.forEach((platform) => {
        results.push({
          platform,
          success: false,
          error: makeError instanceof Error ? makeError.message : "Make.com webhook failed",
        })
      })
    }

    // Determine overall success
    const hasSuccess = results.some((r) => r.success)
    const hasFailure = results.some((r) => !r.success)

    if (hasFailure && !hasSuccess) {
      // All platforms failed
      const errors = results
        .filter((r) => !r.success)
        .map((r) => `${r.platform}: ${r.error}`)
        .join("; ")
      throw new Error(`All platforms failed: ${errors}`)
    } else if (hasFailure && hasSuccess) {
      // Partial success
      const failedPlatforms = results
        .filter((r) => !r.success)
        .map((r) => r.platform)
        .join(", ")
      console.warn(`Partial success - failed platforms: ${failedPlatforms}`)

      // Update post with partial success info
      const post = this.posts.find((p) => p.id === post.id)
      if (post) {
        post.error = `Partial success - failed: ${failedPlatforms}`
      }
    }

    // If we get here, at least one platform succeeded
  }

  destroy(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }
}

// Singleton instance
let schedulerInstance: LocalSchedulerService | null = null

export function getSchedulerService(): SchedulerService {
  if (!schedulerInstance) {
    schedulerInstance = new LocalSchedulerService()
  }
  return schedulerInstance
}

// Cleanup function for when the app unmounts
export function destroySchedulerService(): void {
  if (schedulerInstance) {
    schedulerInstance.destroy()
    schedulerInstance = null
  }
}

/**
 * Initialize the scheduler service
 */
export function initSchedulerService() {
  if (typeof window === "undefined" || isInitialized) return

  // Set the initialized flag
  isInitialized = true

  // Start the scheduler interval
  schedulerInterval = setInterval(() => {
    getSchedulerService().checkAndPublishPosts()
  }, CHECK_INTERVAL)

  // Also check immediately on initialization
  getSchedulerService().checkAndPublishPosts()

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    if (schedulerInterval) {
      clearInterval(schedulerInterval)
    }
  })

  console.log("Scheduler service initialized")
}

/**
 * Stop the scheduler service
 */
export function stopSchedulerService() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval)
    schedulerInterval = null
  }
  isInitialized = false
}

/**
 * Manually trigger a check for scheduled posts
 */
export function manualCheckScheduledPosts() {
  return getSchedulerService().checkAndPublishPosts()
}
