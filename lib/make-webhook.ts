/**
 * Centralized Make.com webhook integration module
 * This ensures consistent payload formatting and error handling for all Make.com webhook calls
 */

import type { ContentType, Platform, ScheduledPost, Topic, UploadedImage, UserInfo } from "./types"

// Define the structure for Make.com webhook responses
interface MakeWebhookResponse {
  success: boolean
  message: string
  error?: string
  data?: any
}

/**
 * Base function to send data to Make.com webhook with proper formatting
 * @param payload The data to send to Make.com
 * @param userInfo Optional user information to include in the payload
 * @returns Response with success status and message
 */
async function sendToMakeWebhook(payload: any, userInfo?: UserInfo): Promise<MakeWebhookResponse> {
  try {
    // Get the Make webhook URL from environment variables
    const makeWebhookUrl = process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL

    if (!makeWebhookUrl) {
      console.error("Make webhook URL is not configured")
      return {
        success: false,
        message:
          "Make webhook URL is not configured. Please add the NEXT_PUBLIC_MAKE_WEBHOOK_URL environment variable.",
        error: "missing_webhook_url",
      }
    }

    // Add user information to the payload if provided
    const payloadWithUser = userInfo
      ? {
          ...payload,
          user: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            // Only include image if it exists
            ...(userInfo.image ? { image: userInfo.image } : {}),
          },
        }
      : payload

    // Ensure the payload has the required 'url' parameter at the top level
    // This is critical for Make.com webhook validation
    const formattedPayload = {
      ...payloadWithUser,
      url: makeWebhookUrl, // Add the required url parameter at the top level
    }

    console.log("Sending to Make webhook:", JSON.stringify(formattedPayload, null, 2))

    // Send the data to Make
    const response = await fetch(makeWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedPayload),
    })

    // Handle non-OK responses
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Make webhook responded with status ${response.status}:`, errorText)

      // Check for specific error about no scenario listening
      if (errorText.includes("no scenario") || errorText.includes("not found")) {
        return {
          success: false,
          message:
            "There is no active scenario in Make.com listening for this webhook. Please check your Make.com setup.",
          error: "no_scenario_listening",
        }
      }

      return {
        success: false,
        message: `Error from Make: ${errorText || response.statusText}`,
        error: `http_error_${response.status}`,
      }
    }

    // Process the response
    try {
      // Try to parse as JSON
      const responseContentType = response.headers.get("content-type")
      if (responseContentType && responseContentType.includes("application/json")) {
        const data = await response.json()
        return {
          success: true,
          message: data.message || "Request processed successfully by Make.com",
          data,
        }
      } else {
        // Handle plain text responses
        const textResponse = await response.text()
        return {
          success: true,
          message: `Request processed by Make.com. Response: ${textResponse}`,
        }
      }
    } catch (parseError) {
      console.error("Error parsing Make.com response:", parseError)
      // If parsing fails, return a generic success message
      return {
        success: true,
        message: "Request sent to Make.com successfully, but couldn't parse the response.",
      }
    }
  } catch (error) {
    console.error("Error sending to Make webhook:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)

    return {
      success: false,
      message: errorMessage || "Failed to send request to Make.com",
      error: "request_failed",
    }
  }
}

/**
 * Send content to a specific platform via Make.com
 */
export async function sendContentToPlatform(
  topic: Topic | null,
  contentType: ContentType | null,
  content: string,
  platform: Platform,
  images?: UploadedImage[],
  userInfo?: UserInfo,
): Promise<MakeWebhookResponse> {
  // Create the payload with the content data
  const payload = {
    content: {
      topic: topic?.title || "Untitled Topic",
      contentType: contentType || "post",
      text: content,
      keywords: topic?.keywords || [],
      images: images || [],
      platform, // Include the specific platform
      timestamp: new Date().toISOString(),
    },
    // The 'url' parameter will be added by sendToMakeWebhook
    // User information will be added by sendToMakeWebhook if provided
  }

  return sendToMakeWebhook(payload, userInfo)
}

/**
 * Send content specifically to LinkedIn via Make.com
 */
export async function sendContentToLinkedIn(
  topic: Topic | null,
  contentType: ContentType | null,
  content: string,
  images?: UploadedImage[],
  userInfo?: UserInfo,
): Promise<MakeWebhookResponse> {
  return sendContentToPlatform(topic, contentType, content, "linkedin", images, userInfo)
}

/**
 * Schedule a post to be published via Make.com
 */
export async function schedulePost(post: ScheduledPost, userInfo?: UserInfo): Promise<MakeWebhookResponse> {
  // Ensure we have valid date objects
  const scheduledFor = post.scheduledFor instanceof Date ? post.scheduledFor : new Date(post.scheduledFor)
  const createdAt = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt)

  // Create the payload with the scheduled post data
  const payload = {
    scheduledPost: {
      id: post.id,
      topic: {
        title: post.topic?.title || "Untitled Topic",
        keywords: post.topic?.keywords || [],
      },
      contentType: post.contentType || "blog",
      content: post.content || "",
      scheduledFor: scheduledFor.toISOString(),
      scheduledTime: {
        timestamp: scheduledFor.getTime(),
        iso: scheduledFor.toISOString(),
        formatted: scheduledFor.toLocaleString(),
        date: scheduledFor.toLocaleDateString(),
        time: scheduledFor.toLocaleTimeString(),
      },
      platforms: post.platforms || ["website"],
      recurrence: post.recurrence || "once",
      images: post.images || [],
      createdAt: createdAt.toISOString(),
      isAutomatedSchedule: true,
    },
    // The 'url' parameter will be added by sendToMakeWebhook
    // User information will be added by sendToMakeWebhook if provided
  }

  return sendToMakeWebhook(payload, userInfo)
}

/**
 * Test the Make.com webhook connection
 * Useful for verifying that the webhook is properly configured
 */
export async function testMakeWebhookConnection(userInfo?: UserInfo): Promise<MakeWebhookResponse> {
  const payload = {
    test: true,
    timestamp: new Date().toISOString(),
    message: "This is a test connection from the Content Generation Engine",
  }

  return sendToMakeWebhook(payload, userInfo)
}
