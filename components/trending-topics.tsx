"use client"

import { getTrendingTopics } from "@/lib/keywords"

interface TrendingTopicsProps {
  onTopicSelect: (topic: string) => void
}

export default function TrendingTopics({ onTopicSelect }: TrendingTopicsProps) {
  const trendingTopics = getTrendingTopics()

  return (
    <div className="pt-8 mb-16">
      <div className="text-center mb-6">
        <h2 className="text-5xl font-bold mb-2">Trending Topics</h2>
        <p className="text-xl mb-1">Lead-fraud space</p>
        <p className="text-sm text-gray-400">More verticals coming soon</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {trendingTopics.map((topic, index) => (
          <button
            key={index}
            onClick={() => onTopicSelect(topic)}
            className="bg-white text-black py-4 px-6 rounded-full text-center hover:bg-gray-100 transition-colors"
          >
            {topic}
          </button>
        ))}
      </div>
    </div>
  )
}
