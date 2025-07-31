import type { ScheduledPost } from "./types"
import { schedulePostToMake } from "./make-integration"
import { getCurrentUser } from "./auth"

/**
 * Schedule a post with Make.com immediately after creation
 * This doesn't publish the post, just registers it with Make.com
 */
export async function scheduleWithMake(post: ScheduledPost): Promise<boolean> {
  try {
    if (!post || !post.topic || !post.scheduledFor) {
      console.error("Invalid post data for scheduling:", post)
      return false
    }

    // Get current user information
    const userInfo = await getCurrentUser()

    console.log(`Scheduling post "${post.topic.title}" (ID: ${post.id}) with Make.com`)
    console.log(`Scheduled for: ${new Date(post.scheduledFor).toLocaleString()}`)
    console.log(`Platforms: ${post.platforms?.join(", ") || "default platform"}`)

    if (userInfo) {
      console.log(`Scheduling as user: ${userInfo.name} (${userInfo.id})`)
    } else {
      console.log("Scheduling without user information")
    }

    const result = await schedulePostToMake(post, userInfo)

    if (result.success) {
      console.log(`Successfully scheduled post ${post.id} with Make.com`)
      return true
    } else {
      console.error(`Failed to schedule post ${post.id} with Make.com: ${result.message}`)
      return false
    }
  } catch (error) {
    console.error(`Error scheduling post ${post.id} with Make.com:`, error)
    return false
  }
}
