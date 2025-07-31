import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 })
    }

    // Generate a unique ID for the image
    const imageId = uuidv4()

    // Convert the file to base64 regardless of Blob storage availability
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64 = buffer.toString("base64")
    const dataUrl = `data:${file.type};base64,${base64}`

    try {
      // Check if BLOB_READ_WRITE_TOKEN is configured
      const blobToken = process.env.BLOB_READ_WRITE_TOKEN

      if (blobToken) {
        // Generate a unique filename
        const filename = `${imageId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`

        // Upload to Vercel Blob Storage
        const blob = await put(filename, file, {
          access: "public",
          contentType: file.type,
        })

        // Return both the Blob URL and base64 data
        return NextResponse.json({
          success: true,
          id: imageId,
          url: blob.url,
          base64: dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        })
      } else {
        // If no Blob token, just return the base64 data
        return NextResponse.json({
          success: true,
          id: imageId,
          url: dataUrl, // Use base64 as URL too
          base64: dataUrl,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          warning: "Using base64 encoding as fallback. BLOB_READ_WRITE_TOKEN is not configured.",
        })
      }
    } catch (uploadError) {
      console.error("Error uploading to Blob storage:", uploadError)

      // If Blob storage fails, just return the base64 data
      return NextResponse.json({
        success: true,
        id: imageId,
        url: dataUrl, // Use base64 as URL too
        base64: dataUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        warning: `Failed to upload to Blob storage: ${uploadError instanceof Error ? uploadError.message : "Unknown error"}. Using base64 encoding as fallback.`,
      })
    }
  } catch (error) {
    console.error("Error processing image upload:", error)
    return NextResponse.json({ error: "Failed to process image upload" }, { status: 500 })
  }
}
