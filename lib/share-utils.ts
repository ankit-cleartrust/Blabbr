import type { ContentType, Topic } from "./types"

/**
 * Formats content for sharing on social media
 * @param content The full content to format
 * @param maxLength Maximum length for the formatted content
 * @returns Formatted content string
 */
export function formatContentForSharing(content: string, maxLength = 280): string {
  if (!content) return ""

  // Get first few sentences or characters
  const sentences = content.split(/[.!?]/).filter((s) => s.trim().length > 0)
  let formatted = sentences.slice(0, 2).join(". ")

  // Add ellipsis if truncated
  if (formatted.length < content.length) {
    formatted += "..."
  }

  // Ensure it doesn't exceed max length
  if (formatted.length > maxLength) {
    formatted = formatted.substring(0, maxLength - 3) + "..."
  }

  return formatted
}

/**
 * Generates a share title based on topic and content type
 */
export function generateShareTitle(topic: Topic | null, contentType: ContentType | null): string {
  if (!topic) return "Check out this content from Blabbr"

  const contentTypeLabel = getContentTypeLabel(contentType)
  return `${topic.title} | ${contentTypeLabel} | Blabbr`
}

/**
 * Gets a human-readable label for content type
 */
export function getContentTypeLabel(contentType: ContentType | null): string {
  switch (contentType) {
    case "blog":
      return "Blog Post"
    case "linkedin":
      return "LinkedIn Post"
    case "newsletter":
      return "Newsletter"
    default:
      return "Content"
  }
}

/**
 * Generates URLs for sharing to different platforms
 */
export function generateShareUrls(title: string, text: string, url: string) {
  return {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + "\n\n" + text)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title + "\n\n" + text)}`,
  }
}

/**
 * Copies content to clipboard for LinkedIn sharing
 */
export function copyContentToClipboard(title: string, text: string): boolean {
  try {
    const formattedContent = `${title}\n\n${text}`
    navigator.clipboard.writeText(formattedContent)
    return true
  } catch (error) {
    console.error("Failed to copy content to clipboard:", error)
    return false
  }
}
