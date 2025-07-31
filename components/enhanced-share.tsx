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

interface EnhancedShareProps {
  topic: Topic | null
  contentType: ContentType | null
  content: string
  url?: string
  variant?: "icon" | "button" | "full"
  className?: string
}

export function EnhancedShare({
  topic,
  contentType,
  content,
  url = typeof window !== "undefined" ? window.location.href : "https://blabbr.ai",
  variant = "button",
  className = "",
}: EnhancedShareProps) {
  const [copied, setCopied] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState("twitter")
  const [customTitle, setCustomTitle] = useState("")
  const [customText, setCustomText] = useState("")

  // Initialize share content
  const defaultTitle = generateShareTitle(topic, contentType)
  const defaultText = formatContentForSharing(content)

  const { share, isSupported } = useWebShare()

  // Reset custom fields when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setCustomTitle(defaultTitle)
      setCustomText(defaultText)
    }
    setIsDialogOpen(open)
  }

  // Update the handleQuickShare function to better handle errors
  const handleQuickShare = () => {
    // For development/preview environments, just open the dialog
    if (
      typeof window !== "undefined" &&
      (window.location.hostname.includes("vusercontent.net") ||
        window.location.hostname.includes("localhost") ||
        window.location.hostname.includes("vercel.app"))
    ) {
      setIsDialogOpen(true)
      return
    }

    // If Web Share API is not supported, open the dialog
    if (!isSupported) {
      setIsDialogOpen(true)
      return
    }

    // Try to use Web Share API (must be in response to a user gesture)
    const shareData = {
      title: defaultTitle,
      text: defaultText,
      url: url,
    }

    // Use a timeout to ensure this happens after the click event is processed
    setTimeout(async () => {
      try {
        const success = await share(shareData)

        if (success) {
          toast({
            title: "Content shared",
            description: "Your content has been shared successfully",
          })
        } else {
          // Fallback to dialog if Web Share API fails
          setIsDialogOpen(true)
        }
      } catch (error) {
        // Fallback to dialog on any error
        setIsDialogOpen(true)
      }
    }, 0)
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

    switch (platform) {
      case "twitter":
        window.open(urls.twitter, "_blank", "noopener,noreferrer")
        break
      case "linkedin":
        window.open(urls.linkedin, "_blank", "noopener,noreferrer")
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

    toast({
      title: "Content shared",
      description: `Your content has been shared to ${platform}`,
    })

    setIsDialogOpen(false)
  }

  // Render different button variants
  const renderTrigger = () => {
    switch (variant) {
      case "icon":
        return (
          <Button variant="ghost" size="icon" className={className} onClick={handleQuickShare}>
            <Share2 className="h-4 w-4" />
            <span className="sr-only">Share content</span>
          </Button>
        )
      case "full":
        return (
          <Button variant="default" className={`w-full ${className}`} onClick={handleQuickShare}>
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
            onClick={handleQuickShare}
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
            <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
