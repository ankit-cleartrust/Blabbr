import { topics } from "./data"

export interface KeywordData {
  keyword: string
  relevance: number
}

export function findTopKeywords(searchTopic: string): KeywordData[] {
  // First, try to find an exact match in our topics
  const exactMatch = topics.find((topic) => topic.title.toLowerCase() === searchTopic.toLowerCase())

  if (exactMatch) {
    return exactMatch.keywords.map((keyword) => ({
      keyword,
      relevance: 100, // High relevance for direct matches
    }))
  }

  // If no exact match, try partial match
  const partialMatches = topics.filter(
    (topic) =>
      topic.title.toLowerCase().includes(searchTopic.toLowerCase()) ||
      searchTopic.toLowerCase().includes(topic.title.toLowerCase()),
  )

  if (partialMatches.length > 0) {
    // Collect keywords from all partial matches
    const keywordMap = new Map<string, number>()

    partialMatches.forEach((topic) => {
      topic.keywords.forEach((keyword, index) => {
        // Higher index = lower relevance
        const relevance = 100 - index * 5
        keywordMap.set(keyword, Math.max(relevance, keywordMap.get(keyword) || 0))
      })
    })

    // Convert map to array and sort by relevance
    return Array.from(keywordMap.entries())
      .map(([keyword, relevance]) => ({ keyword, relevance }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10) // Get top 10 keywords
  }

  // If no matches at all, use general lead fraud keywords
  return [
    { keyword: "lead generation", relevance: 95 },
    { keyword: "fraud detection", relevance: 90 },
    { keyword: "form filling", relevance: 85 },
    { keyword: "fake submissions", relevance: 80 },
    { keyword: "bot detection", relevance: 75 },
  ]
}

export function getTrendingTopics(): string[] {
  // Return only the lead fraud topics that are marked as trending
  return topics.filter((topic) => topic.trending).map((topic) => topic.title)
}
