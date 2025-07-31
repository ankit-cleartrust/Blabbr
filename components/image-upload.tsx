"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Upload, AlertTriangle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface ImageUploadProps {
  onImageUpload: (imageData: {
    url: string
    id: string
    base64: string
    fileName?: string
    fileType?: string
    fileSize?: number
  }) => void
  disabled?: boolean
  maxImages?: number
  currentImageCount: number
}

export function ImageUpload({
  onImageUpload,
  disabled = false,
  maxImages = 5,
  currentImageCount = 0,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showFallbackWarning, setShowFallbackWarning] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (disabled || currentImageCount >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add up to ${maxImages} images.`,
        variant: "destructive",
      })
      return
    }

    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (JPEG, PNG, GIF, etc.)",
        variant: "destructive",
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      // 5MB limit
      toast({
        title: "File too large",
        description: "Image size should be less than 5MB",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)
    setShowFallbackWarning(false)

    try {
      // Create a FormData object to send the file
      const formData = new FormData()
      formData.append("file", file)

      // Send the file to our API endpoint
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to upload image")
      }

      const data = await response.json()

      if (data.success && data.url && data.base64) {
        // Check if we're using the base64 fallback
        if (data.warning) {
          setShowFallbackWarning(true)
          console.warn("Using base64 fallback for image storage:", data.warning)

          // Show a warning toast
          toast({
            title: "Using temporary storage",
            description: "Images are stored temporarily and may not persist. Set up Vercel Blob for permanent storage.",
            variant: "warning",
          })
        }

        // Pass the image data to the parent component
        onImageUpload({
          url: data.url,
          id: data.id,
          base64: data.base64,
          fileName: data.fileName,
          fileType: data.fileType,
          fileSize: data.fileSize,
        })

        toast({
          title: "Image uploaded",
          description: "Your image has been uploaded and encoded as base64",
        })
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (error) {
      console.error("Error uploading image:", error)
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleButtonClick = () => {
    if (disabled || currentImageCount >= maxImages) {
      toast({
        title: "Maximum images reached",
        description: `You can only add up to ${maxImages} images.`,
        variant: "destructive",
      })
      return
    }

    fileInputRef.current?.click()
  }

  return (
    <div className="w-full">
      <div
        className={`border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        } ${disabled || isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          disabled={disabled || isUploading || currentImageCount >= maxImages}
        />
        <div className="flex flex-col items-center justify-center py-4">
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-2"></div>
              <p className="text-sm font-medium">Uploading and encoding image...</p>
            </div>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm font-medium">
                {currentImageCount >= maxImages
                  ? `Maximum of ${maxImages} images reached`
                  : "Drag & drop an image or click to browse"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentImageCount >= maxImages ? "Remove an image to add another" : "JPEG, PNG, GIF up to 5MB"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {currentImageCount} of {maxImages} images used
              </p>
            </>
          )}
        </div>
      </div>

      {showFallbackWarning && (
        <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-amber-800">
            <p className="font-medium">Using temporary storage</p>
            <p>
              To enable permanent image storage, set up the BLOB_READ_WRITE_TOKEN environment variable with Vercel Blob.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
