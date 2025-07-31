"use client"

import { X, Eye, Copy } from "lucide-react"
import Image from "next/image"
import { toast } from "@/components/ui/use-toast"
import type { UploadedImage } from "@/lib/types"

interface ImageGalleryProps {
  images: UploadedImage[]
  onRemoveImage: (id: string) => void
  onViewImage: (image: UploadedImage) => void
}

export function ImageGallery({ images, onRemoveImage, onViewImage }: ImageGalleryProps) {
  if (images.length === 0) {
    return null
  }

  const copyBase64ToClipboard = (image: UploadedImage) => {
    if (image.base64) {
      navigator.clipboard.writeText(image.base64)
      toast({
        title: "Base64 copied",
        description: "The base64 string has been copied to your clipboard",
      })
    } else {
      toast({
        title: "Base64 not available",
        description: "This image doesn't have base64 data available",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">Uploaded Images</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((image) => (
          <div key={image.id} className="relative group">
            <div className="aspect-video relative overflow-hidden rounded-md border border-gray-200">
              <Image
                src={image.url || "/placeholder.svg"}
                alt={image.fileName || "Uploaded image"}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 200px"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100 gap-1">
                <button
                  onClick={() => onViewImage(image)}
                  className="bg-blue-500 text-white text-xs px-2 py-1 rounded-md flex items-center"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </button>
                <button
                  onClick={() => copyBase64ToClipboard(image)}
                  className="bg-green-500 text-white text-xs px-2 py-1 rounded-md flex items-center"
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Base64
                </button>
              </div>
            </div>
            <button
              onClick={() => onRemoveImage(image.id)}
              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
            {image.fileName && <p className="text-xs text-gray-500 mt-1 truncate">{image.fileName}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
