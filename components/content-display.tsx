"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { ContentType, Topic, Platform, UploadedImage } from "@/lib/types"
import { Copy, Check, RefreshCw, Calendar, Edit2, Eye, ImageIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Textarea } from "@/components/ui/textarea"
import Image from "next/image"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ImageUpload } from "./image-upload"
import { ImageGallery } from "./image-gallery"
import { DateTimePicker } from "./date-time-picker"
import { PlatformSelector } from "./platform-selector"
import { RecurrenceSelector } from "./recurrence-selector"
import { Separator } from "@/components/ui/separator"

interface ContentDisplayProps {
  topic: Topic | null
  contentType: ContentType | null
  content: string
  isLoading: boolean
  onRefresh: () => void
  onSchedule?: (
    scheduledDate: Date,
    platforms: Platform[],
    recurrence?: string,
    editedContent?: string,
    images?: UploadedImage[],
  ) => void
}

export default function ContentDisplay({
  topic,
  contentType,
  content,
  isLoading,
  onRefresh,
  onSchedule,
}: ContentDisplayProps) {
  const [copied, setCopied] = useState(false)
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(
    new Date(new Date().getTime() + 24 * 60 * 60 * 1000), // Default to tomorrow
  )
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(["website"])
  const [recurrence, setRecurrence] = useState<string>("once")
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedContent, setEditedContent] = useState("")
  const [images, setImages] = useState<UploadedImage[]>([])
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false)
  const [isImageViewerOpen, setIsImageViewerOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<UploadedImage | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update editedContent when content changes
  useEffect(() => {
    setEditedContent(content)
  }, [content])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditMode) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [editedContent, isEditMode])

  const handleCopy = () => {
    const contentToCopy = isEditMode ? editedContent : content
    if (!contentToCopy) return

    navigator.clipboard.writeText(contentToCopy)
    setCopied(true)

    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  const handleSchedule = () => {
    if (scheduledDate && onSchedule && selectedPlatforms.length > 0) {
      // Pass the current user information to the onSchedule function
      onSchedule(scheduledDate, selectedPlatforms, recurrence, editedContent, images)
      setIsScheduleDialogOpen(false)
    } else if (selectedPlatforms.length === 0) {
      toast({
        title: "No platforms selected",
        description: "Please select at least one platform to publish to.",
        variant: "destructive",
      })
    }
  }

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  const handleImageUpload = (imageData: {
    url: string
    id: string
    base64: string
    fileName?: string
    fileType?: string
    fileSize?: number
  }) => {
    if (images.length >= 5) {
      toast({
        title: "Maximum images reached",
        description: "You can only add up to 5 images.",
        variant: "destructive",
      })
      return
    }

    const newImage: UploadedImage = {
      id: imageData.id,
      url: imageData.url,
      base64: imageData.base64,
      fileName: imageData.fileName,
      fileType: imageData.fileType,
      fileSize: imageData.fileSize,
    }

    const updatedImages = [...images, newImage]
    setImages(updatedImages)

    // Automatically switch to edit mode if not already in it
    if (!isEditMode) {
      setIsEditMode(true)
    }

    setIsImageUploadOpen(false)

    toast({
      title: "Image added",
      description: "Image has been uploaded and encoded as base64",
    })
  }

  const handleRemoveImage = (id: string) => {
    setImages(images.filter((img) => img.id !== id))
  }

  const handleViewImage = (image: UploadedImage) => {
    setSelectedImage(image)
    setIsImageViewerOpen(true)
  }

  const getContentTypeTitle = () => {
    switch (contentType) {
      case "blog":
        return "SEO Blog Post"
      case "linkedin":
        return "LinkedIn Post"
      case "newsletter":
        return "Newsletter"
      default:
        return "Content"
    }
  }

  // Function to get base64 data for an image
  const getBase64ForImage = (imageId: string): string | null => {
    const image = images.find((img) => img.id === imageId)
    return image?.base64 || null
  }

  // Function to copy base64 data to clipboard
  const copyBase64ToClipboard = (base64: string) => {
    navigator.clipboard.writeText(base64)
    toast({
      title: "Base64 copied",
      description: "The base64 string has been copied to your clipboard",
    })
  }

  return (
    <>
      <Card className="bg-white text-black rounded-xl mt-16 overflow-hidden">
        <div className="bg-[#013060] text-white p-4 flex justify-between items-center relative">
          <h3 className="text-xl font-bold">
            {topic ? `${getContentTypeTitle()}: ${topic.title}` : "Generated Content"}
          </h3>

          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsImageUploadOpen(true)}
              disabled={isLoading || !content}
              className="bg-white text-[#013060] hover:bg-gray-200"
            >
              <ImageIcon className="h-4 w-4 mr-2" />
              Add Images {images.length > 0 && `(${images.length})`}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="bg-white text-[#013060] hover:bg-gray-200"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopy}
              disabled={isLoading || !content}
              className="bg-white text-[#013060] hover:bg-gray-200"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={isLoading || !content}
                  className="bg-white text-[#013060] hover:bg-gray-200"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={toggleEditMode}>
                  {isEditMode ? (
                    <>
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </>
                  ) : (
                    <>
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsScheduleDialogOpen(true)}
                  disabled={isLoading || !content}
                  onSelect={(e) => e.preventDefault()}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#013060]"></div>
            </div>
          ) : content ? (
            isEditMode ? (
              <div className="space-y-4">
                <Textarea
                  ref={textareaRef}
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[400px] font-mono text-base resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Edit your content here..."
                />
              </div>
            ) : (
              <div className="prose max-w-none">
                {editedContent.split("\n").map((line, index) => (
                  <p key={index} className="mb-4">
                    {line}
                  </p>
                ))}
              </div>
            )
          ) : (
            <div className="h-64 flex items-center justify-center flex-col">
              <div className="text-red-500 text-5xl mb-4">⚠️</div>
              <p className="text-center text-gray-500 text-lg font-medium">API Key Error</p>
              <p className="text-center text-gray-500 mt-2">
                No content generated. Please check your API key and try again.
              </p>
            </div>
          )}

          {/* Display images section */}
          {images.length > 0 && (
            <div className="mt-6 border-t pt-4">
              <h3 className="text-lg font-bold mb-4">Images</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative group">
                    <div
                      className="aspect-video relative overflow-hidden rounded-md border border-gray-200 cursor-pointer"
                      onClick={() => handleViewImage(image)}
                    >
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.fileName || "Uploaded image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 200px"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white text-black hover:bg-gray-200"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (image.base64) {
                              copyBase64ToClipboard(image.base64)
                            }
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Base64
                        </Button>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      ×
                    </Button>
                    {image.fileName && <p className="text-xs text-gray-500 mt-1 truncate">{image.fileName}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Dialog */}
      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Schedule Post</DialogTitle>
            <DialogDescription>Choose when and where to publish your content</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-6 overflow-y-auto flex-1 pr-2">
            <DateTimePicker date={scheduledDate} setDate={setScheduledDate} />

            <Separator className="my-6" />

            <PlatformSelector selectedPlatforms={selectedPlatforms} onChange={setSelectedPlatforms} />

            <Separator className="my-6" />

            <RecurrenceSelector value={recurrence} onChange={setRecurrence} />

            {images.length > 0 && (
              <>
                <Separator className="my-6" />
                <div>
                  <h3 className="text-sm font-medium mb-2">Included Images:</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((image) => (
                      <div key={image.id} className="relative">
                        <div className="aspect-video relative overflow-hidden rounded-md border border-gray-200">
                          <Image
                            src={image.url || "/placeholder.svg"}
                            alt={image.fileName || "Uploaded image"}
                            fill
                            className="object-cover"
                            sizes="100px"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1 truncate">{image.fileName || "Image"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsScheduleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>Schedule Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Upload Dialog */}
      <Dialog open={isImageUploadOpen} onOpenChange={setIsImageUploadOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Images</DialogTitle>
            <DialogDescription>Upload images and get base64 encoded strings</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <ImageUpload
              onImageUpload={handleImageUpload}
              disabled={isLoading}
              maxImages={5}
              currentImageCount={images.length}
            />
            <ImageGallery images={images} onRemoveImage={handleRemoveImage} onViewImage={handleViewImage} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageUploadOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={isImageViewerOpen} onOpenChange={setIsImageViewerOpen}>
        <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedImage?.fileName || "Image Details"}</DialogTitle>
            <DialogDescription>
              {selectedImage?.fileSize && `Size: ${Math.round(selectedImage.fileSize / 1024)} KB`}
              {selectedImage?.fileType && ` • Type: ${selectedImage.fileType}`}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 flex flex-col gap-4">
            {selectedImage && (
              <>
                <div className="relative aspect-video max-h-[400px] w-full">
                  <Image
                    src={selectedImage.url || "/placeholder.svg"}
                    alt={selectedImage.fileName || "Image"}
                    fill
                    className="object-contain rounded-md"
                    sizes="(max-width: 768px) 100vw, 800px"
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Base64 String:</h3>
                  <div className="relative">
                    <div className="bg-gray-100 p-2 rounded-md text-xs font-mono overflow-hidden max-h-[100px] overflow-y-auto">
                      {selectedImage.base64 ? (
                        <div className="break-all">{selectedImage.base64}</div>
                      ) : (
                        <div className="text-gray-500">Base64 data not available</div>
                      )}
                    </div>
                    {selectedImage.base64 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => copyBase64ToClipboard(selectedImage.base64 || "")}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImageViewerOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
