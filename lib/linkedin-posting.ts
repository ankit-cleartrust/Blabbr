import { LINKEDIN_API_ENDPOINTS } from "./linkedin-oauth"

export interface LinkedInPostData {
  content: string
  imageUrl?: string
  accessToken: string
  userId: string
}

export interface LinkedInUGCPost {
  author: string
  lifecycleState: "PUBLISHED"
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string
      }
      shareMediaCategory: "NONE" | "IMAGE" | "VIDEO" | "ARTICLE"
      media?: Array<{
        status: "READY"
        description: {
          text: string
        }
        media: string
        title: {
          text: string
        }
      }>
    }
  }
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
  }
}

/**
 * Clean content for LinkedIn posting
 */
function cleanContentForLinkedIn(content: string): string {
  // Remove image placeholder text
  let cleaned = content.replace(/\[Image:.*?\]/g, "").trim()

  // LinkedIn has a 3000 character limit for posts
  if (cleaned.length > 3000) {
    cleaned = cleaned.substring(0, 2997) + "..."
  }

  return cleaned
}

/**
 * Post content directly to LinkedIn using UGC API
 */
export async function postToLinkedInDirect(data: LinkedInPostData): Promise<any> {
  const { content, imageUrl, accessToken, userId } = data

  // Clean the content for LinkedIn
  const cleanedContent = cleanContentForLinkedIn(content)

  if (!cleanedContent.trim()) {
    throw new Error("Content is empty after cleaning")
  }

  // Construct the UGC post payload
  const ugcPost: LinkedInUGCPost = {
    author: `urn:li:person:${userId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: cleanedContent,
        },
        shareMediaCategory: imageUrl ? "IMAGE" : "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
    },
  }

  // If there's an image, we would need to upload it first
  // For now, we'll post text-only content
  if (imageUrl) {
    console.warn("Image posting to LinkedIn not yet implemented, posting text only")
  }

  try {
    const response = await fetch(LINKEDIN_API_ENDPOINTS.UGC_POSTS, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcPost),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error("LinkedIn API Error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })

      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error("LinkedIn access token expired. Please reconnect your LinkedIn account.")
      } else if (response.status === 403) {
        throw new Error("Insufficient permissions to post to LinkedIn. Please check your app permissions.")
      } else if (response.status === 429) {
        throw new Error("LinkedIn API rate limit exceeded. Please try again later.")
      } else {
        throw new Error(`LinkedIn posting failed: ${errorData.message || response.statusText}`)
      }
    }

    const result = await response.json()
    console.log("LinkedIn post successful:", result)
    return result
  } catch (error) {
    console.error("Error posting to LinkedIn:", error)

    if (error instanceof Error) {
      throw error
    } else {
      throw new Error("Unknown error occurred while posting to LinkedIn")
    }
  }
}

/**
 * Validate LinkedIn access token
 */
export async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    return response.ok
  } catch (error) {
    console.error("Token validation failed:", error)
    return false
  }
}

/**
 * Get LinkedIn posting capabilities for a user
 */
export async function getLinkedInCapabilities(accessToken: string): Promise<{
  canPost: boolean
  scopes: string[]
  expiresAt?: number
}> {
  try {
    // This would typically involve checking the token introspection endpoint
    // For now, we'll do a simple validation
    const isValid = await validateLinkedInToken(accessToken)

    return {
      canPost: isValid,
      scopes: ["w_member_social"], // Assume we have the required scope
      expiresAt: undefined, // Would need to get this from token introspection
    }
  } catch (error) {
    console.error("Error checking LinkedIn capabilities:", error)
    return {
      canPost: false,
      scopes: [],
    }
  }
}
