import { getLinkedInConnection } from "./linkedin-connection"
import { LINKEDIN_API } from "./linkedin-auth"

export interface LinkedInPostData {
  text: string
  images?: string[] // Base64 encoded images
  url?: string
}

/**
 * Posts content directly to LinkedIn using stored connection
 */
export async function postToLinkedInDirect(
  userId: string,
  postData: LinkedInPostData,
): Promise<{ success: boolean; message: string; postId?: string }> {
  try {
    // Get the user's LinkedIn connection
    const connection = getLinkedInConnection(userId)

    if (!connection || !connection.isActive) {
      return {
        success: false,
        message:
          "LinkedIn account not connected or connection is inactive. Please connect your LinkedIn account in Settings.",
      }
    }

    // Prepare the post payload for LinkedIn API v2
    const postPayload = {
      author: `urn:li:person:${connection.profileId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: postData.text,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    // If there's a URL, add it as a link
    if (postData.url) {
      postPayload.specificContent["com.linkedin.ugc.ShareContent"].shareMediaCategory = "ARTICLE"
      postPayload.specificContent["com.linkedin.ugc.ShareContent"].media = [
        {
          status: "READY",
          description: {
            text: postData.text,
          },
          originalUrl: postData.url,
        },
      ]
    }

    // Post to LinkedIn
    const response = await fetch(LINKEDIN_API.POST, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(postPayload),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("LinkedIn API error:", response.status, errorData)

      if (response.status === 401) {
        return {
          success: false,
          message: "LinkedIn connection has expired. Please reconnect your account in Settings.",
        }
      }

      return {
        success: false,
        message: `Failed to post to LinkedIn: ${errorData.message || response.statusText}`,
      }
    }

    const result = await response.json()

    return {
      success: true,
      message: "Successfully posted to LinkedIn",
      postId: result.id,
    }
  } catch (error) {
    console.error("Error posting to LinkedIn:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error occurred while posting to LinkedIn",
    }
  }
}
