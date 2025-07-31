"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Linkedin, Twitter, Facebook, Copy, Check, Mail } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ContentType, Topic } from "@/lib/types"
import { formatContentForSharing, generateShareTitle, generateShareUrls } from "@/lib/share-utils"
import { useWebShare } from "@/hooks/use-web-share"
import { postToLinkedIn } from "@/lib/make-integration"

interface SocialShareProps {
  topic: Topic | null
  contentType: ContentType | null
  content: string
  url?: string
  variant?: "icon" | "button" | "full"
  className?: string
}

export function SocialShare({
  topic,
  contentType,
  content,
  url = typeof window !== "undefined" ? window.location.href : "https://blabbr.ai",
  variant = "button",
  className = "",
}: SocialShareProps) {
  const [copied, setCopied] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("twitter")
  const [customTitle, setCustomTitle] = useState("")
  const [customText, setCustomText] = useState("")

  const { share, isSupported } = useWebShare()

  // Initialize share content
  const defaultTitle = generateShareTitle(topic, contentType)
  const defaultText = formatContentForSharing(content)

  // Reset custom fields when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCustomTitle(defaultTitle)
      setCustomText(defaultText)
    }
    setIsDialogOpen(open)
  }

  // Handle share button click
  const handleShare = async () => {
    // Try to use Web Share API first
    if (isSupported) {
      const shareData = {
        title: defaultTitle,
        text: defaultText,
        url: url,
      }

      try {
        const success = await share(shareData)

        if (success) {
          toast({
            title: "Content shared",
            description: "Your content has been shared successfully",
          })
          return
        }
      } catch (error) {
        console.error("Error sharing content:", error)
      }
    }

    // Fallback to dialog if Web Share API is not supported or fails
    setIsDialogOpen(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url)
    setCopied(true)

    toast({
      title: "Link copied",
      description: "Link has been copied to clipboard",
    })

    setTimeout(() => setCopied(false), 2000)
  }

  const shareToSocial = (platform: string) => {
    const title = customTitle || defaultTitle
    const text = customText || defaultText

    // Use a generic URL for sharing in development/preview environments
    const shareUrl =
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vusercontent.net") ||
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("vercel.app"))
        ? "https://blabbr.ai"
        : url

    const urls = generateShareUrls(title, text, shareUrl)

    // Special handling for LinkedIn
    if (platform === "linkedin") {
      // First copy the content to clipboard
      const copied = copyContentToClipboard(title, text)
      if (copied) {
        toast({
          title: "Content copied to clipboard",
          description: "Your content has been copied to clipboard. Paste it into the LinkedIn post editor.",
        })
      }
      // Then open LinkedIn sharing dialog
      window.open(urls.linkedin, "_blank", "noopener,noreferrer")
    } else {
      // Handle other platforms normally
      switch (platform) {
        case "twitter":
          window.open(urls.twitter, "_blank", "noopener,noreferrer")
          break
        case "facebook":
          window.open(urls.facebook, "_blank", "noopener,noreferrer")
          break
        case "email":
          window.open(
            `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + "\n\n" + shareUrl)}`,
            "_blank",
            "noopener,noreferrer",
          )
          break
      }
    }

    toast({
      title: "Content shared",
      description: `Your content has been shared to ${platform}`,
    })

    setIsDialogOpen(false)
  }

  const handlePostToLinkedIn = async () => {
    // Show loading toast
    toast({
      title: "Posting to LinkedIn",
      description: "Sending your content to LinkedIn...",
    })

    // Close the dialog
    setIsDialogOpen(false)

    // Post to LinkedIn via Make
    const result = await postToLinkedIn(topic, contentType, customText || defaultText, topic?.images)

    // Show success or error toast
    if (result.success) {
      toast({
        title: "Posted to LinkedIn",
        description: "Your content has been posted to LinkedIn successfully",
      })
    } else {
      toast({
        title: "Failed to post to LinkedIn",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  // Render different button variants
  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button variant="ghost" size="icon" className={className} onClick={handleShare}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share content</span>
          </Button>
        )
      case "full":
        return (
          <Button variant="default" className={`w-full ${className}`} onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Content
          </Button>
        )
      default:
        return (
          <Button
            variant="secondary"
            size="sm"
            className={`bg-white text-[#013060] hover:bg-gray-200 ${className}`}
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        )
    }
  }

  return (
    <>
      {renderTrigger()}

      <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Content</DialogTitle>
            <DialogDescription>Share your content to social media platforms</DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="twitter" className="flex items-center gap-1">
                <Twitter className="h-3 w-3" />
                <span className="hidden sm:inline">Twitter</span>
              </TabsTrigger>
              <TabsTrigger value="linkedin" className="flex items-center gap-1">
                <Linkedin className="h-3 w-3" />
                <span className="hidden sm:inline">LinkedIn</span>
              </TabsTrigger>
              <TabsTrigger value="facebook" className="flex items-center gap-1">
                <Facebook className="h-3 w-3" />
                <span className="hidden sm:inline">Facebook</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
            </TabsList>

            <div className="space-y-4 py-2 pb-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter a title for sharing"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter your message"
                  className="min-h-[100px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link">Link</Label>
                <div className="flex items-center space-x-2">
                  <Input id="link" value={url} readOnly className="flex-1" />
                  <Button type="button" size="icon" variant="outline" onClick={handleCopyLink}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span className="sr-only">Copy link</span>
                  </Button>
                </div>
                {typeof window !== "undefined" &&
                  (window.location.hostname.includes("vusercontent.net") ||
                    window.location.hostname.includes("localhost") ||
                    window.location.hostname.includes("vercel.app")) && (
                    <p className="text-xs text-amber-600">
                      Note: When sharing from preview environments, a generic URL will be used instead.
                    </p>
                  )}
              </div>
            </div>
          </Tabs>

          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="default" onClick={() => shareToSocial(activeTab)}>
              Share to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </Button>
            <Button
              type="button"
              variant="default"
              onClick={handlePostToLinkedIn}
              className="bg-[#0077B5] hover:bg-[#005e8b]"
            >
              <Linkedin className="h-4 w-4 mr-2" />
              Post directly to LinkedIn
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

async function copyContentToClipboard(title: string, text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(`${title}\n\n${text}`)
    return true
  } catch (err) {
    console.error("Failed to copy text: ", err)
    return false
  }
}
