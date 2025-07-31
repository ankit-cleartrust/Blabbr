"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Lightbulb, RefreshCw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { KeywordData } from "@/lib/keywords"

interface BlogIdeasDisplayProps {
  topic: string
  ideas: string[]
  keywords: KeywordData[]
  isLoading: boolean
  onIdeaSelect: (idea: string) => void
  onRefresh: () => void
}

export default function BlogIdeasDisplay({
  topic,
  ideas,
  keywords,
  isLoading,
  onIdeaSelect,
  onRefresh,
}: BlogIdeasDisplayProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleIdeaClick = (index: number, idea: string) => {
    setSelectedIndex(index)
    onIdeaSelect(idea)
  }

  return (
    <Card className="bg-white text-black rounded-xl mb-16 overflow-hidden">
      <div className="bg-[#013060] text-white p-4 flex justify-between items-center">
        <div className="flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          <h3 className="text-xl font-bold">Content ideas for: {topic}</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
          className="bg-white text-[#013060] hover:bg-gray-200"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Ideas
        </Button>
      </div>

      {/* Keywords section */}
      {keywords.length > 0 && (
        <div className="bg-gray-100 p-3 border-b">
          <p className="text-sm font-medium mb-2">Extracted Keywords:</p>
          <div className="flex flex-wrap gap-2">
            {keywords.map((keyword, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`bg-white ${keyword.relevance > 80 ? "border-blue-500 text-blue-700" : ""}`}
              >
                {keyword.keyword}
                {keyword.relevance > 80 && <span className="ml-1 text-xs text-blue-500">★</span>}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#013060]"></div>
          </div>
        ) : ideas.length > 0 ? (
          <ul className="divide-y">
            {ideas.map((idea, index) => (
              <li
                key={index}
                className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedIndex === index ? "bg-blue-50" : ""
                }`}
                onClick={() => handleIdeaClick(index, idea)}
              >
                <span className="text-lg">{idea}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="h-64 flex items-center justify-center flex-col">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-center text-gray-500 text-lg font-medium">API Key Error</p>
            <p className="text-center text-gray-500 mt-2">
              No ideas generated. Please check your API key and try again.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
