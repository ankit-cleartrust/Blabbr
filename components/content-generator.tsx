"use client"

import { CardContent } from "@/components/ui/card"
import { Card } from "@/components/ui/card"
import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { generateContent, extractKeywords } from "@/lib/generate-content"
import ContentTypeSelector from "./content-type-selector"
import ContentDisplay from "./content-display"
import ScheduledPosts from "./scheduled-posts"
import { findTopKeywords, type KeywordData } from "@/lib/keywords"
import type { ContentType, Topic, ScheduledPost, Platform, UploadedImage } from "@/lib/types"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Search, Calendar } from "lucide-react"
import { v4 as uuidv4 } from "uuid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { saveScheduledPosts, loadScheduledPosts, isStorageAvailable } from "@/lib/storage"
import { scheduleWithMake } from "@/lib/make"

export default function ContentGenerator() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null)
  const [contentType, setContentType] = useState<ContentType | null>(null)
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [isExtractingKeywords, setIsExtractingKeywords] = useState(false)
  const [keywords, setKeywords] = useState<KeywordData[]>([])
  const [showContentTypeSelector, setShowContentTypeSelector] = useState(false)
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([])
  const [activeTab, setActiveTab] = useState("create")
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)

  // Check if localStorage is available and load saved posts on initial render
  useEffect(() => {
    const storage = isStorageAvailable()
    setStorageAvailable(storage)

    if (storage) {
      const savedPosts = loadScheduledPosts()
      setScheduledPosts(savedPosts)
    } else {
      toast({
        title: "Storage Unavailable",
        description: "Local storage is not available. Your scheduled posts will not be saved between sessions.",
        variant: "destructive",
      })
    }
  }, [])

  // Save posts to localStorage whenever they change
  useEffect(() => {
    if (storageAvailable && scheduledPosts.length > 0) {
      saveScheduledPosts(scheduledPosts)
    }
  }, [scheduledPosts, storageAvailable])

  // Update the handleGenerateContent function to handle error objects
  const handleGenerateContent = async (type: ContentType) => {
    // Reset any previous errors
    setApiError(null)

    // Use the search query as the topic title
    const topicTitle = searchQuery

    if (!topicTitle.trim()) {
      toast({
        title: "Please enter a topic",
        description: "Enter a topic to generate content.",
        variant: "destructive",
      })
      return
    }

    // Create a topic based on the topic title and extracted keywords
    const topic: Topic = {
      id: "custom",
      title: topicTitle,
      keywords: keywords.map((k) => k.keyword) || ["content marketing", "digital marketing", "SEO"],
      description: "Custom topic based on user input",
      trendScore: 75,
      trending: false,
    }

    setSelectedTopic(topic)
    setContentType(type)
    setIsGenerating(true)

    try {
      console.log("Generating content for:", topic.title, "Type:", type)
      const result = await generateContent(topic, type)

      // Check if the result is an error object
      if (typeof result === "object" && "error" in result) {
        console.error("Content generation error:", result.error)
        setApiError(result.error)
        toast({
          title: "Content Generation Error",
          description: result.error,
          variant: "destructive",
        })
        setGeneratedContent("")
      } else {
        setGeneratedContent(result)
      }
    } catch (error) {
      console.error("Error generating content:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setApiError(errorMessage)
      toast({
        title: "Error generating content",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setGeneratedContent("")
    } finally {
      setIsGenerating(false)
    }
  }

  // Update the handleRefreshContent function to handle error objects
  const handleRefreshContent = async () => {
    if (!selectedTopic || !contentType) return

    // Reset any previous errors
    setApiError(null)
    setIsGenerating(true)

    try {
      const result = await generateContent(selectedTopic, contentType)

      // Check if the result is an error object
      if (typeof result === "object" && "error" in result) {
        setApiError(result.error)
        toast({
          title: "API Key Error",
          description: result.error,
          variant: "destructive",
        })
        // Don't update the content if there's an error
      } else {
        setGeneratedContent(result)
        toast({
          title: "Content refreshed",
          description: "New content has been generated.",
        })
      }
    } catch (error) {
      console.error("Error refreshing content:", error)
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      setApiError(errorMessage)
      toast({
        title: "Error refreshing content",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  // New function to extract keywords from user input
  const fetchKeywords = async (topic: string) => {
    setIsExtractingKeywords(true)
    setKeywords([])

    try {
      console.log("Extracting keywords for topic:", topic)
      const result = await extractKeywords(topic)

      if (typeof result === "object" && "error" in result) {
        toast({
          title: "Using local keywords",
          description: "We couldn't connect to the AI service, so we're using local keywords instead.",
        })
        // Fallback to local keyword extraction
        const localKeywords = findTopKeywords(topic)
        setKeywords(localKeywords)
        return localKeywords
      } else {
        console.log("Keywords extracted:", result.length)
        setKeywords(result)
        return result
      }
    } catch (error) {
      console.error("Error extracting keywords:", error)
      // Return default keywords on error
      const defaultKeywords = [
        { keyword: "content marketing", relevance: 100 },
        { keyword: "digital marketing", relevance: 95 },
        { keyword: "SEO", relevance: 90 },
        { keyword: "content strategy", relevance: 85 },
        { keyword: "marketing", relevance: 80 },
      ]
      setKeywords(defaultKeywords)

      toast({
        title: "Using default keywords",
        description: "We encountered an error extracting keywords, so we're using default keywords instead.",
      })

      return defaultKeywords
    } finally {
      setIsExtractingKeywords(false)
    }
  }

  const processTopicSearch = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a topic",
        description: "Enter a topic to generate content.",
        variant: "destructive",
      })
      return
    }

    // Reset previous selections and errors
    setGeneratedContent("")
    setApiError(null)

    // Extract keywords for the topic
    await fetchKeywords(searchQuery)

    // Show content type selector
    setShowContentTypeSelector(true)

    // Scroll to the content type selector
    setTimeout(() => {
      const selector = document.getElementById("content-type-selector")
      if (selector) {
        selector.scrollIntoView({ behavior: "smooth" })
      }
    }, 100)
  }

  const handleSchedulePost = async (
    scheduledDate: Date,
    platforms: Platform[],
    recurrence?: string,
    editedContent?: string,
    images?: UploadedImage[],
  ) => {
    if (!selectedTopic || !contentType || !generatedContent) {
      toast({
        title: "Cannot schedule post",
        description: "Please generate content first.",
        variant: "destructive",
      })
      return
    }

    const newScheduledPost: ScheduledPost = {
      id: uuidv4(),
      topic: selectedTopic,
      contentType: contentType,
      content: editedContent || generatedContent, // Use edited content if available
      scheduledFor: scheduledDate,
      status: "scheduled",
      createdAt: new Date(),
      platforms: platforms,
      recurrence: recurrence as "once" | "daily" | "weekly" | "monthly" | undefined,
      images: images || [], // Include images if available
    }

    const updatedPosts = [...scheduledPosts, newScheduledPost]
    setScheduledPosts(updatedPosts)

    // Schedule with Make.com
    scheduleWithMake(newScheduledPost)

    const platformText =
      platforms.length > 1
        ? `${platforms.length} platforms`
        : platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1)

    const recurrenceText = recurrence && recurrence !== "once" ? ` (repeats ${recurrence})` : ""

    toast({
      title: "Post scheduled",
      description: `Your content has been scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()} on ${platformText}${recurrenceText}`,
    })

    // Log the scheduling
    console.log(`Post scheduled for ${scheduledDate.toLocaleString()} on ${platforms.join(", ")}`)
  }

  const handleEditScheduledPost = (
    post: ScheduledPost,
    newDate: Date,
    platforms: Platform[],
    recurrence?: string,
    content?: string,
  ) => {
    const updatedPosts = scheduledPosts.map((p) =>
      p.id === post.id
        ? {
            ...p,
            scheduledFor: newDate,
            platforms: platforms,
            recurrence: recurrence as "once" | "daily" | "weekly" | "monthly" | undefined,
            content: content || p.content, // Update content if provided
          }
        : p,
    )
    setScheduledPosts(updatedPosts)

    const platformText =
      platforms.length > 1
        ? `${platforms.length} platforms`
        : platforms[0].charAt(0).toUpperCase() + platforms[0].slice(1)

    const recurrenceText = recurrence && recurrence !== "once" ? ` (repeats ${recurrence})` : ""

    toast({
      title: "Post updated",
      description: `Your content has been rescheduled for ${newDate.toLocaleDateString()} at ${newDate.toLocaleTimeString()} on ${platformText}${recurrenceText}`,
    })

    // Log the schedule update
    console.log(`Post schedule updated for ${newDate.toLocaleString()} on ${platforms.join(", ")}`)
  }

  const handleDeleteScheduledPost = (postId: string) => {
    setScheduledPosts(scheduledPosts.filter((p) => p.id !== postId))

    toast({
      title: "Post deleted",
      description: "The scheduled post has been removed.",
    })
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      <div className="flex justify-start items-center mb-12 -ml-4">
        <div className="relative w-[500px] h-[200px]">
          <Image
            src="/blabbr-logo.png"
            alt="blabbr - Untangle your thoughts"
            fill
            priority
            className="object-contain object-left"
          />
        </div>
      </div>

      {apiError && (
        <Card className="bg-red-50 border-red-200 mb-8">
          <CardContent className="p-4">
            <h3 className="text-red-800 font-semibold mb-2">API Error</h3>
            <p className="text-red-700">{apiError}</p>
            <p className="text-sm text-red-600 mt-2">
              Please check your OpenAI API key in the environment variables or try again later.
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-12">
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
          <TabsTrigger value="create">Create Content</TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Scheduled Posts
            {scheduledPosts.length > 0 && (
              <span className="bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {scheduledPosts.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-0 pt-6">
          <div className="text-center mb-16">
            <h2 className="text-5xl font-bold mb-8">Create with Blabbr</h2>
            <form onSubmit={processTopicSearch} className="max-w-2xl mx-auto mb-4">
              <div className="relative">
                <Input
                  className="bg-white text-black rounded-full py-6 px-8 text-center text-lg pr-16"
                  placeholder="Enter a topic for content generation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full h-10 w-10 p-0"
                  disabled={isExtractingKeywords}
                >
                  {isExtractingKeywords ? (
                    <div className="animate-spin h-5 w-5 border-t-2 border-b-2 border-white rounded-full" />
                  ) : (
                    <Search className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-sm mt-2 text-gray-300">Enter a topic to generate optimized content</p>
            </form>

            <div className="mt-8 mb-16">
              <h3 className="text-xl font-semibold mb-4">How it works:</h3>
              <div className="flex flex-col md:flex-row justify-center gap-4 text-left">
                <div className="bg-[#01407A] p-4 rounded-lg flex-1 max-w-xs mx-auto">
                  <div className="bg-[#013060] rounded-full h-8 w-8 flex items-center justify-center mb-2">1</div>
                  <h4 className="font-bold mb-1">Enter a Topic</h4>
                  <p className="text-sm text-gray-300">Type your topic to get started</p>
                </div>
                <div className="bg-[#01407A] p-4 rounded-lg flex-1 max-w-xs mx-auto">
                  <div className="bg-[#013060] rounded-full h-8 w-8 flex items-center justify-center mb-2">2</div>
                  <h4 className="font-bold mb-1">Choose Content Type</h4>
                  <p className="text-sm text-gray-300">Select the type of content you want to generate</p>
                </div>
                <div className="bg-[#01407A] p-4 rounded-lg flex-1 max-w-xs mx-auto">
                  <div className="bg-[#013060] rounded-full h-8 w-8 flex items-center justify-center mb-2">3</div>
                  <h4 className="font-bold mb-1">Get Optimized Content</h4>
                  <p className="text-sm text-gray-300">Receive SEO-optimized content based on extracted keywords</p>
                </div>
              </div>
            </div>
          </div>

          {/* Display keywords being extracted */}
          {isExtractingKeywords && (
            <Card className="bg-white text-black rounded-xl mb-16 overflow-hidden">
              <div className="bg-[#013060] text-white p-4">
                <h3 className="text-xl font-bold">Extracting keywords...</h3>
              </div>
              <CardContent className="p-6 flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#013060]"></div>
              </CardContent>
            </Card>
          )}

          {/* Content type selector */}
          <div id="content-type-selector" className="mt-8 mb-16">
            {showContentTypeSelector && !isExtractingKeywords && (
              <>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold">Choose content type to generate:</h3>
                  {keywords.length > 0 && (
                    <div className="mt-4 max-w-2xl mx-auto">
                      <p className="text-sm font-medium mb-2 text-gray-300">Using these extracted keywords:</p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {keywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="inline-block px-3 py-1 rounded-full text-sm bg-blue-600 text-white"
                          >
                            {keyword.keyword}
                            {keyword.relevance > 80 && <span className="ml-1">★</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <ContentTypeSelector onSelect={handleGenerateContent} isGenerating={isGenerating} />
              </>
            )}
          </div>

          {/* Display generated content */}
          {(generatedContent || isGenerating) && (
            <ContentDisplay
              topic={selectedTopic}
              contentType={contentType}
              content={generatedContent}
              isLoading={isGenerating}
              onRefresh={handleRefreshContent}
              onSchedule={handleSchedulePost}
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="mt-0 pt-6">
          <div className="text-center mb-8">
            <h2 className="text-4xl font-bold mb-4">Scheduled Posts</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Manage your scheduled content. You can edit the publishing time or delete scheduled posts.
            </p>
          </div>

          <ScheduledPosts
            posts={scheduledPosts}
            onEdit={handleEditScheduledPost}
            onDelete={handleDeleteScheduledPost}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
