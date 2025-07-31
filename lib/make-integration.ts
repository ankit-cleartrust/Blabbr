import type { ContentType, Topic, UploadedImage, ScheduledPost, Platform, UserInfo } from "./types"
import { sendContentToPlatform, sendContentToLinkedIn, schedulePost } from "./make-webhook"

/**
 * Posts content to LinkedIn via Make integration
 */
export async function postToLinkedIn(
  topic: Topic | null,
  contentType: ContentType | null,
  content: string,
  images?: UploadedImage[],
  userInfo?: UserInfo,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const result = await sendContentToLinkedIn(topic, contentType, content, images, userInfo)
    return result
  } catch (error) {
    console.error("Error in postToLinkedIn:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      message: errorMessage || "Failed to post to LinkedIn",
      error: "unknown_error",
    }
  }
}

/**
 * Schedules a post to be published via Make
 */
export async function schedulePostToMake(
  post: ScheduledPost,
  userInfo?: UserInfo,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const result = await schedulePost(post, userInfo)
    return result
  } catch (error) {
    console.error("Error in schedulePostToMake:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      message: errorMessage || "Failed to schedule post",
      error: "unknown_error",
    }
  }
}

/**
 * Post content to a specific platform via Make
 */
export async function postToPlatform(
  topic: Topic | null,
  contentType: ContentType | null,
  content: string,
  platform: Platform,
  images?: UploadedImage[],
  userInfo?: UserInfo,
): Promise<{ success: boolean; message: string; error?: string }> {
  try {
    const result = await sendContentToPlatform(topic, contentType, content, platform, images, userInfo)
    return result
  } catch (error) {
    console.error(`Error in postToPlatform (${platform}):`, error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      message: errorMessage || `Failed to post to ${platform}`,
      error: "unknown_error",
    }
  }
}
