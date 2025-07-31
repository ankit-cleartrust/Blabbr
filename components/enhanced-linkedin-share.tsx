"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Linkedin, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { useSession } from "next-auth/react"
import { getLinkedInConnection } from "@/lib/linkedin-connection"
import type { ContentType, Topic, UploadedImage } from "@/lib/types"

interface EnhancedLinkedInShareProps {
  topic: Topic | null
  contentType: ContentType | null
  content: string
  images?: UploadedImage[]
  url?: string
  className?: string
}

export function EnhancedLinkedInShare({
  topic,
  contentType,
  content,
  images,
  url,
  className = "",
}: EnhancedLinkedInShareProps) {
  const { data: session } = useSession()
  const [isPosting, setIsPosting] = useState(false)

  const handleLinkedInPost = async () => {
    if (!session?.user?.id) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to post to LinkedIn",
        variant: "destructive",
      })
      return
    }

    // Check if LinkedIn is connected
    const connection = getLinkedInConnection(session.user.id)
    if (!connection || !connection.isActive) {
      toast({
        title: "LinkedIn Not Connected",
        description: "Please connect your LinkedIn account in Settings to enable posting",
        variant: "destructive",
      })
      return
    }

    if (!content.trim()) {
      toast({
        title: "No Content",
        description: "Please generate content before posting to LinkedIn",
        variant: "destructive",
      })
      return
    }

    setIsPosting(true)

    try {
      // Prepare post data
      const postData = {
        text: content,
        url: url,
        title: topic?.title,
        description: `Generated content about ${topic?.title}`,
        imageUrls: images?.map((img) => img.base64).filter(Boolean),
        visibility: "PUBLIC",
      }

      // Post to LinkedIn via our API
      const response = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Posted to LinkedIn",
          description: "Your content has been successfully posted to LinkedIn using the UGC API!",
        })
      } else {
        throw new Error(result.error || "Failed to post to LinkedIn")
      }
    } catch (error) {
      console.error("LinkedIn posting error:", error)
      toast({
        title: "LinkedIn Post Failed",
        description: error instanceof Error ? error.message : "Failed to post to LinkedIn",
        variant: "destructive",
      })
    } finally {
      setIsPosting(false)
    }
  }

  return (
    <Button
      onClick={handleLinkedInPost}
      disabled={isPosting || !content}
      className={`bg-[#0077B5] hover:bg-[#005e8b] text-white ${className}`}
    >
      {isPosting ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          Posting...
        </>
      ) : (
        <>
          <Linkedin className="h-4 w-4 mr-2" />
          Post to LinkedIn
        </>
      )}
    </Button>
  )
}
