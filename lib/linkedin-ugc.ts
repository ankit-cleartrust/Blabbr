/**
 * LinkedIn UGC API Integration
 * Based on: https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
 */

import { LINKEDIN_API_ENDPOINTS } from "./linkedin-oauth"

export interface LinkedInUGCPost {
  author: string // URN format: urn:li:person:{person-id}
  lifecycleState: "PUBLISHED" | "DRAFT"
  specificContent: {
    "com.linkedin.ugc.ShareContent": {
      shareCommentary: {
        text: string
        attributes?: Array<{
          start: number
          length: number
          value: {
            "com.linkedin.common.CompanyAttributedEntity"?: {
              company: string
            }
            "com.linkedin.common.HashtagAttributedEntity"?: {
              hashtag: string
            }
          }
        }>
      }
      shareMediaCategory: "NONE" | "ARTICLE" | "IMAGE" | "VIDEO"
      media?: Array<{
        status: "READY" | "PROCESSING" | "AVAILABLE"
        description?: {
          text: string
        }
        media?: string // URN for uploaded media
        originalUrl?: string // For articles
        title?: {
          text: string
        }
        thumbnails?: Array<{
          url: string
        }>
      }>
    }
  }
  visibility: {
    "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" | "CONNECTIONS"
  }
}

export interface LinkedInShareData {
  text: string
  url?: string
  title?: string
  description?: string
  imageUrls?: string[]
  visibility?: "PUBLIC" | "CONNECTIONS"
}

/**
 * Create a text-only UGC post on LinkedIn
 */
export async function createLinkedInTextPost(
  accessToken: string,
  personId: string,
  shareData: LinkedInShareData,
): Promise<{ id: string; activity: string }> {
  const ugcPost: LinkedInUGCPost = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: shareData.text,
        },
        shareMediaCategory: "NONE",
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": shareData.visibility || "PUBLIC",
    },
  }

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
    throw new Error(`LinkedIn UGC post failed: ${errorData.message || response.statusText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Create a UGC post with an article link
 */
export async function createLinkedInArticlePost(
  accessToken: string,
  personId: string,
  shareData: LinkedInShareData,
): Promise<{ id: string; activity: string }> {
  if (!shareData.url) {
    throw new Error("URL is required for article posts")
  }

  const ugcPost: LinkedInUGCPost = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: shareData.text,
        },
        shareMediaCategory: "ARTICLE",
        media: [
          {
            status: "READY",
            description: {
              text: shareData.description || shareData.text,
            },
            originalUrl: shareData.url,
            ...(shareData.title && {
              title: {
                text: shareData.title,
              },
            }),
          },
        ],
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": shareData.visibility || "PUBLIC",
    },
  }

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
    throw new Error(`LinkedIn article post failed: ${errorData.message || response.statusText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Upload an image to LinkedIn and get the asset URN
 */
export async function uploadImageToLinkedIn(
  accessToken: string,
  personId: string,
  imageData: string, // Base64 encoded image
  filename: string,
): Promise<string> {
  // Step 1: Register upload
  const registerResponse = await fetch(LINKEDIN_API_ENDPOINTS.ASSETS + "?action=registerUpload", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ["urn:li:digitalmediaRecipe:feedshare-image"],
        owner: `urn:li:person:${personId}`,
        serviceRelationships: [
          {
            relationshipType: "OWNER",
            identifier: "urn:li:userGeneratedContent",
          },
        ],
      },
    }),
  })

  if (!registerResponse.ok) {
    throw new Error(`Image upload registration failed: ${registerResponse.statusText}`)
  }

  const registerData = await registerResponse.json()
  const uploadUrl =
    registerData.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl
  const asset = registerData.value.asset

  // Step 2: Upload the image
  const imageBuffer = Buffer.from(imageData.split(",")[1], "base64")

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/octet-stream",
    },
    body: imageBuffer,
  })

  if (!uploadResponse.ok) {
    throw new Error(`Image upload failed: ${uploadResponse.statusText}`)
  }

  return asset
}

/**
 * Create a UGC post with images
 */
export async function createLinkedInImagePost(
  accessToken: string,
  personId: string,
  shareData: LinkedInShareData,
): Promise<{ id: string; activity: string }> {
  if (!shareData.imageUrls || shareData.imageUrls.length === 0) {
    throw new Error("Image URLs are required for image posts")
  }

  // Upload images and get asset URNs
  const mediaAssets = []
  for (let i = 0; i < shareData.imageUrls.length; i++) {
    const imageData = shareData.imageUrls[i]
    const filename = `image_${i + 1}.jpg`

    try {
      const assetUrn = await uploadImageToLinkedIn(accessToken, personId, imageData, filename)
      mediaAssets.push({
        status: "READY" as const,
        description: {
          text: shareData.description || shareData.text,
        },
        media: assetUrn,
      })
    } catch (error) {
      console.error(`Failed to upload image ${i + 1}:`, error)
      // Continue with other images
    }
  }

  if (mediaAssets.length === 0) {
    throw new Error("No images were successfully uploaded")
  }

  const ugcPost: LinkedInUGCPost = {
    author: `urn:li:person:${personId}`,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: {
          text: shareData.text,
        },
        shareMediaCategory: "IMAGE",
        media: mediaAssets,
      },
    },
    visibility: {
      "com.linkedin.ugc.MemberNetworkVisibility": shareData.visibility || "PUBLIC",
    },
  }

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
    throw new Error(`LinkedIn image post failed: ${errorData.message || response.statusText}`)
  }

  const result = await response.json()
  return result
}

/**
 * Get UGC posts for a person
 */
export async function getLinkedInUGCPosts(accessToken: string, personId: string, count = 10): Promise<any> {
  const response = await fetch(
    `${LINKEDIN_API_ENDPOINTS.UGC_POSTS}?q=authors&authors=urn:li:person:${personId}&count=${count}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    },
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch UGC posts: ${response.statusText}`)
  }

  return response.json()
}
