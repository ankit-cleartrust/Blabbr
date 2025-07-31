import type { ContentType, Topic } from "./types"
import type { KeywordData } from "./keywords"
import { findTopKeywords } from "./keywords"

// Update the generateContent function to use the API route
export async function generateContent(topic: Topic, contentType: ContentType): Promise<string | { error: string }> {
  try {
    console.log("Generating content for topic:", topic.title, "type:", contentType)

    const response = await fetch("/api/generate/content", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ topic, contentType }),
      cache: "no-store",
    })

    // Check if the response is ok before trying to parse JSON
    if (!response.ok) {
      const errorText = await response.text()
      console.error("API error response:", errorText, "Status:", response.status)
      try {
        // Try to parse the error as JSON
        const errorJson = JSON.parse(errorText)
        return { error: errorJson.error || `Server error: ${response.status}` }
      } catch (parseError) {
        // If parsing fails, return the raw error text
        return { error: `Server error: ${response.status}. ${errorText.substring(0, 100)}...` }
      }
    }

    const data = await response.json()

    if (data.error) {
      console.error("API returned error:", data.error)
      return { error: data.error }
    }

    return data.text
  } catch (error) {
    console.error("Error generating content:", error)
    return {
      error: "⚠️ Failed to generate content. Please check your API key and try again.",
    }
  }
}

// New function to extract keywords from a topic
export async function extractKeywords(topic: string): Promise<KeywordData[] | { error: string }> {
  try {
    // First try to get keywords from local data
    const localKeywords = findTopKeywords(topic)

    // Then try to get keywords from API
    try {
      const response = await fetch("/api/extract/keywords", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ topic }),
        cache: "no-store",
      })

      // Check if the response is ok before trying to parse JSON
      if (!response.ok) {
        console.warn("API error response for keywords, using local fallback")
        return localKeywords
      }

      const data = await response.json()

      if (data.error) {
        console.warn("API returned error for keywords, using local fallback:", data.error)
        return localKeywords
      }

      return data.keywords
    } catch (error) {
      console.warn("Error extracting keywords from API, using local fallback:", error)
      return localKeywords
    }
  } catch (error) {
    console.error("Error extracting keywords:", error)
    // Return default keywords on error
    return [
      { keyword: "content marketing", relevance: 95 },
      { keyword: "digital marketing", relevance: 90 },
      { keyword: "SEO", relevance: 85 },
      { keyword: "content strategy", relevance: 80 },
      { keyword: "marketing", relevance: 75 },
    ]
  }
}
