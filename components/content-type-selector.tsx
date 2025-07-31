"use client"

import type { ContentType } from "@/lib/types"

interface ContentTypeSelectorProps {
  onSelect: (type: ContentType) => void
  isGenerating: boolean
}

export default function ContentTypeSelector({ onSelect, isGenerating }: ContentTypeSelectorProps) {
  return (
    <div className="flex justify-center gap-8 flex-wrap">
      <button
        onClick={() => onSelect("blog")}
        disabled={isGenerating}
        className="bg-white text-black rounded-full w-64 h-64 flex flex-col items-center justify-center transition-transform hover:scale-105 disabled:opacity-70"
      >
        <span className="text-4xl font-bold mb-2">blogs</span>
        <span className="text-lg">200-400 words</span>
      </button>

      <button
        onClick={() => onSelect("newsletter")}
        disabled={isGenerating}
        className="bg-white text-black rounded-full w-64 h-64 flex flex-col items-center justify-center transition-transform hover:scale-105 disabled:opacity-70"
      >
        <span className="text-4xl font-bold mb-2">newsletter</span>
        <span className="text-lg">200-1k words</span>
      </button>

      <button
        onClick={() => onSelect("linkedin")}
        disabled={isGenerating}
        className="bg-white text-black rounded-full w-64 h-64 flex flex-col items-center justify-center transition-transform hover:scale-105 disabled:opacity-70"
      >
        <span className="text-4xl font-bold mb-2">posts</span>
        <span className="text-lg">instagram, linkedin,</span>
        <span className="text-lg">yt and more</span>
      </button>
    </div>
  )
}
