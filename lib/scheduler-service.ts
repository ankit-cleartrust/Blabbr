import { loadScheduledPosts, saveScheduledPosts } from "./storage"
import type { ScheduledPost, UserInfo } from "./types"
import { schedulePostToMake } from "./make-integration"
import { toast } from "@/components/ui/use-toast"
import { getCurrentUser } from "./auth"

// Interval in milliseconds to check for scheduled posts (1 minute)
const CHECK_INTERVAL = 60 * 1000

let schedulerInterval: NodeJS.Timeout | null = null
let isInitialized = false

/**
 * Initialize the scheduler service
 */
export function initSchedulerService() {
  if (typeof window === "undefined" || isInitialized) return

  // Set the initialized flag
  isInitialized = true

  // Start the scheduler interval
  schedulerInterval = setInterval(checkScheduledPosts, CHECK_INTERVAL)

  // Also check immediately on initialization
  checkScheduledPosts()

  // Clean up on page unload
  window.addEventListener("beforeunload", () => {
    if (schedulerInterval) {
      clearInterval(schedulerInterval)
    }
  })

  console.log("Scheduler service initialized")
}

/**
 * Check for posts that are due to be published
 */
export async function checkScheduledPosts() {
  try {
    // Load scheduled posts from storage
    const posts = loadScheduledPosts()
    if (!posts.length) return

    const now = new Date()
    let hasUpdates = false

    // Get current user information
    const userInfo = await getCurrentUser()

    // Find posts that are due to be published
    for (const post of posts) {
      if (!post || !post.scheduledFor) continue

      const scheduledTime = new Date(post.scheduledFor)

      // Check if the post is due and still in "scheduled" status
      if (scheduledTime <= now && post.status === "scheduled") {
        console.log(`Post ${post.id} is due for publishing`)

        // Send the post to Make.com with user information
        await publishPost(post, userInfo)

        // Mark the post as updated
        hasUpdates = true
      }
    }

    // If any posts were updated, save the changes
    if (hasUpdates) {
      saveScheduledPosts(posts)
    }
  } catch (error) {
    console.error("Error checking scheduled posts:", error)
  }
}

/**
 * Publish a post via Make.com
 */
async function publishPost(post: ScheduledPost, userInfo?: UserInfo): Promise<void> {
  try {
    if (!post || !post.topic || !post.scheduledFor) {
      console.error("Invalid post data for publishing:", post)
      return
    }

    const platformsText = post.platforms?.join(", ") || "default platform"
    console.log(`Publishing post "${post.topic.title}" (ID: ${post.id}) to platforms: ${platformsText}`)
    console.log(`Scheduled time: ${new Date(post.scheduledFor).toLocaleString()}`)

    if (userInfo) {
      console.log(`Publishing as user: ${userInfo.name} (${userInfo.id})`)
    } else {
      console.log("Publishing without user information")
    }

    // Send the post to Make.com with user information
    const result = await schedulePostToMake(post, userInfo)

    // Update the post status based on the result
    if (result.success) {
      post.status = "published"
      console.log(`Successfully published post ${post.id} to ${platformsText}`)

      // Show success toast if the user is active on the page
      if (document.visibilityState === "visible") {
        toast({
          title: "Post published",
          description: `Your post "${post.topic.title}" has been published to ${platformsText}`,
        })
      }
    } else {
      post.status = "failed"
      console.error(`Failed to publish post ${post.id}: ${result.message}`)

      // Show error toast if the user is active on the page
      if (document.visibilityState === "visible") {
        toast({
          title: "Failed to publish post",
          description: result.message,
          variant: "destructive",
        })
      }
    }
  } catch (error) {
    console.error(`Error publishing post ${post.id}:`, error)
    post.status = "failed"

    // Show error toast if the user is active on the page
    if (document.visibilityState === "visible") {
      toast({
        title: "Error publishing post",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      })
    }
  }
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
  return checkScheduledPosts()
}
