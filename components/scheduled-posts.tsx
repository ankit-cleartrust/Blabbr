"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Edit,
  Trash2,
  Eye,
  Repeat,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  ImageIcon,
} from "lucide-react"
import type { ScheduledPost, Platform, UploadedImage } from "@/lib/types"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { DateTimePicker } from "./date-time-picker"
import { PlatformSelector } from "./platform-selector"
import { RecurrenceSelector } from "./recurrence-selector"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Image from "next/image"
import { Textarea } from "@/components/ui/textarea"
import { schedulePostToMake } from "@/lib/make-integration"
import { toast } from "@/components/ui/use-toast"
import { manualCheckScheduledPosts } from "@/lib/scheduler-service"

interface ScheduledPostsProps {
  posts: ScheduledPost[]
  onEdit: (post: ScheduledPost, newDate: Date, platforms: Platform[], recurrence?: string, content?: string) => void
  onDelete: (postId: string) => void
}

export default function ScheduledPosts({ posts, onEdit, onDelete }: ScheduledPostsProps) {
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [viewingPost, setViewingPost] = useState<ScheduledPost | null>(null)
  const [newScheduledDate, setNewScheduledDate] = useState<Date | undefined>(undefined)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([])
  const [recurrence, setRecurrence] = useState<string>("once")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("all")
  const [editedContent, setEditedContent] = useState<string>("")

  const handleCheckScheduled = async () => {
    toast({
      title: "Checking scheduled posts",
      description: "Checking for posts that are due to be published...",
    })

    await manualCheckScheduledPosts()

    toast({
      title: "Check complete",
      description: "Scheduled posts have been checked",
    })
  }

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post)
    setNewScheduledDate(post.scheduledFor)
    setSelectedPlatforms(post.platforms || ["website"])
    setRecurrence(post.recurrence || "once")
    setEditedContent(post.content)
    setIsEditDialogOpen(true)
  }

  const handleView = (post: ScheduledPost) => {
    setViewingPost(post)
    setIsViewDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (editingPost && newScheduledDate && selectedPlatforms.length > 0) {
      onEdit(editingPost, newScheduledDate, selectedPlatforms, recurrence, editedContent)
      setIsEditDialogOpen(false)
      setEditingPost(null)
    }
  }

  const handleSendToMake = async (post: ScheduledPost) => {
    // Show loading toast
    toast({
      title: "Scheduling post",
      description: "Sending your scheduled post to Make...",
    })

    // Ensure the post has proper date objects before sending
    const postToSend = {
      ...post,
      // Convert scheduledFor to a proper Date if it's not already
      scheduledFor: post.scheduledFor instanceof Date ? post.scheduledFor : new Date(post.scheduledFor),
      // Convert createdAt to a proper Date if it's not already
      createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
    }

    // Send to Make
    const result = await schedulePostToMake(postToSend)

    // Show success or error toast
    if (result.success) {
      toast({
        title: "Post scheduled",
        description: "Your post has been scheduled via Make successfully",
      })
    } else {
      // Check for specific error types
      if (result.error === "no_scenario_listening") {
        toast({
          title: "Make.com Setup Required",
          description:
            "There is no active scenario in Make.com listening for this webhook. Please set up your Make.com scenario first.",
          variant: "destructive",
        })
      } else if (result.error === "missing_webhook_url") {
        toast({
          title: "Configuration Required",
          description:
            "Make webhook URL is not configured. Please add the NEXT_PUBLIC_MAKE_WEBHOOK_URL environment variable.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Failed to schedule post",
          description: result.message,
          variant: "destructive",
        })
      }
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-100 text-blue-800"
      case "published":
        return "bg-green-100 text-green-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case "blog":
        return "Blog Post"
      case "linkedin":
        return "LinkedIn"
      case "newsletter":
        return "Newsletter"
      default:
        return type
    }
  }

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case "website":
        return <Globe className="h-4 w-4" />
      case "linkedin":
        return <Linkedin className="h-4 w-4" />
      case "twitter":
        return <Twitter className="h-4 w-4" />
      case "facebook":
        return <Facebook className="h-4 w-4" />
      case "instagram":
        return <Instagram className="h-4 w-4" />
    }
  }

  // Function to format content with Markdown-like syntax and image placeholders
  const formatContent = (text: string, images?: UploadedImage[]) => {
    if (!text) return []

    // Split by line breaks
    const lines = text.split("\n")
    const contentLines = []
    const imageElements = []

    // Process each line for formatting
    lines.forEach((line, index) => {
      // Handle image placeholders
      const imageMatch = line.match(/\[image:([a-zA-Z0-9-]+)\]/)
      if (imageMatch && imageMatch[1] && images?.length) {
        const imageId = imageMatch[1]
        const image = images.find((img) => img.id === imageId)

        if (image) {
          imageElements.push(
            <div key={`img-${index}`} className="my-4 max-w-full">
              <div className="relative aspect-video max-h-[400px] w-full">
                <Image
                  src={image.url || "/placeholder.svg"}
                  alt="Content image"
                  fill
                  className="object-contain rounded-md"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
            </div>,
          )
        }
        return // Skip adding this line to contentLines
      }

      // Handle headers
      if (line.startsWith("# ")) {
        contentLines.push(
          <h1 key={index} className="text-2xl font-bold mb-4">
            {line.substring(2)}
          </h1>,
        )
      } else if (line.startsWith("## ")) {
        contentLines.push(
          <h2 key={index} className="text-xl font-bold mt-4 mb-2">
            {line.substring(3)}
          </h2>,
        )
      } else if (line.startsWith("### ")) {
        contentLines.push(
          <h3 key={index} className="text-lg font-bold mt-3 mb-2">
            {line.substring(4)}
          </h3>,
        )
      }
      // Handle bullet points
      else if (line.startsWith("- ")) {
        contentLines.push(
          <li key={index} className="ml-4 mb-1">
            {line.substring(2)}
          </li>,
        )
      }
      // Handle numbered lists
      else if (/^\d+\.\s/.test(line)) {
        contentLines.push(
          <li key={index} className="ml-4 mb-1">
            {line.substring(line.indexOf(" ") + 1)}
          </li>,
        )
      }
      // Handle empty lines
      else if (line.trim() === "") {
        contentLines.push(<br key={index} />)
      }
      // Regular paragraph
      else {
        contentLines.push(
          <p key={index} className="mb-4">
            {line}
          </p>,
        )
      }
    })

    // If there are images, add a separator and title before them
    if (imageElements.length > 0) {
      contentLines.push(<div key="image-separator" className="border-t border-gray-200 my-6"></div>)
      contentLines.push(
        <h3 key="image-title" className="text-lg font-bold mb-4">
          Images
        </h3>,
      )
      // Add all images at the bottom
      contentLines.push(...imageElements)
    }

    return contentLines
  }

  // Filter posts based on active tab
  const filteredPosts = posts.filter((post) => {
    if (activeTab === "all") return true
    if (activeTab === "today") {
      const today = new Date()
      const postDate = new Date(post.scheduledFor)
      return (
        postDate.getDate() === today.getDate() &&
        postDate.getMonth() === today.getMonth() &&
        postDate.getFullYear() === today.getFullYear()
      )
    }
    if (activeTab === "upcoming") {
      const today = new Date()
      today.setHours(23, 59, 59, 999) // End of today
      const postDate = new Date(post.scheduledFor)
      return postDate > today
    }
    if (activeTab === "recurring") {
      return post.recurrence && post.recurrence !== "once"
    }
    return true
  })

  // Group posts by date for calendar view
  const groupedByDate = filteredPosts.reduce(
    (acc, post) => {
      const dateKey = format(new Date(post.scheduledFor), "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(post)
      return acc
    },
    {} as Record<string, ScheduledPost[]>,
  )

  return (
    <Card className="bg-white text-black rounded-xl mb-16 overflow-hidden">
      <CardHeader className="bg-[#013060] text-white">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Scheduled Posts
          </CardTitle>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCheckScheduled}
            className="bg-white text-[#013060] hover:bg-gray-200"
          >
            <Clock className="h-4 w-4 mr-2" />
            Check Scheduled
          </Button>
        </div>
      </CardHeader>

      <div className="p-4 border-b">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <CardContent className="p-0">
        {filteredPosts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No scheduled posts yet. Schedule your first post by clicking "Schedule" after generating content.
          </div>
        ) : (
          <div className="divide-y">
            {Object.entries(groupedByDate).map(([dateKey, datePosts]) => (
              <div key={dateKey} className="border-b">
                <div className="bg-gray-50 p-2 px-4 font-medium">{format(new Date(dateKey), "EEEE, MMMM d, yyyy")}</div>
                {datePosts.map((post) => (
                  <div key={post.id} className="p-4 hover:bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-lg">{post.topic.title}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Badge variant="outline" className={getStatusColor(post.status)}>
                            {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                          </Badge>
                          <Badge variant="outline">{getContentTypeLabel(post.contentType)}</Badge>
                          {post.recurrence && post.recurrence !== "once" && (
                            <Badge variant="outline" className="bg-purple-100 text-purple-800 flex items-center gap-1">
                              <Repeat className="h-3 w-3" />
                              {post.recurrence.charAt(0).toUpperCase() + post.recurrence.slice(1)}
                            </Badge>
                          )}
                          {post.images && post.images.length > 0 && (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 flex items-center gap-1">
                              <ImageIcon className="h-3 w-3" />
                              {post.images.length} {post.images.length === 1 ? "image" : "images"}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {/* Swapped positions of "Auto-scheduled" badge and "View" button */}
                        <Badge
                          variant="outline"
                          className="bg-purple-100 text-purple-800 flex items-center gap-1 px-2 py-1"
                        >
                          <Calendar className="h-3 w-3 mr-1" />
                          Auto-scheduled
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(post)}
                          className="text-blue-600 border-blue-600"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(post)}
                          className="text-blue-600 border-blue-600"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(post.id)}
                          className="text-red-600 border-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-2">
                      <Clock className="h-4 w-4" />
                      <span>Scheduled for: {format(new Date(post.scheduledFor), "p")}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {post.platforms &&
                        post.platforms.map((platform) => (
                          <div
                            key={platform}
                            className="text-gray-600 flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1"
                          >
                            {getPlatformIcon(platform)}
                            <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                          </div>
                        ))}
                    </div>
                    <div className="mt-2 text-sm line-clamp-2 text-gray-600">{post.content.substring(0, 150)}...</div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Scheduled Post</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-6 overflow-y-auto flex-1 pr-2">
            <DateTimePicker date={newScheduledDate} setDate={setNewScheduledDate} />

            <Separator className="my-6" />

            <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />

            <Separator className="my-6" />

            <RecurrenceSelector value={recurrence} onChange={setRecurrence} />

            <Separator className="my-6" />

            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">Edit Content:</p>
              <Textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="min-h-[200px] font-mono text-sm resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Full Post Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {viewingPost?.topic.title} - {getContentTypeLabel(viewingPost?.contentType || "")}
            </DialogTitle>
            <DialogDescription>
              Scheduled for: {viewingPost && format(new Date(viewingPost.scheduledFor), "PPP 'at' p")}
              {viewingPost?.recurrence && viewingPost.recurrence !== "once" && (
                <span className="ml-2">(Repeats {viewingPost.recurrence})</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            {viewingPost?.platforms &&
              viewingPost.platforms.map((platform) => (
                <div
                  key={platform}
                  className="text-gray-600 flex items-center gap-1 text-xs bg-gray-100 rounded-full px-2 py-1"
                >
                  {getPlatformIcon(platform)}
                  <span>{platform.charAt(0).toUpperCase() + platform.slice(1)}</span>
                </div>
              ))}

            {viewingPost?.images && viewingPost.images.length > 0 && (
              <div className="text-gray-600 flex items-center gap-1 text-xs bg-blue-100 rounded-full px-2 py-1">
                <ImageIcon className="h-3 w-3" />
                <span>
                  {viewingPost.images.length} {viewingPost.images.length === 1 ? "image" : "images"}
                </span>
              </div>
            )}
          </div>
          <ScrollArea className="flex-1 overflow-auto pr-4">
            <div className="prose max-w-none py-4">
              {viewingPost && formatContent(viewingPost.content, viewingPost.images)}
            </div>
          </ScrollArea>
          <div className="flex justify-end pt-4 border-t">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
