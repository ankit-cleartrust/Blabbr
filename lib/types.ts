export type ContentType = "blog" | "linkedin" | "newsletter"

export type Platform = "website" | "linkedin" | "twitter" | "facebook" | "instagram"

export interface Topic {
  id: string
  title: string
  keywords: string[]
  description: string
  trendScore: number
  trending: boolean
}

export interface UploadedImage {
  id: string
  url: string
  base64?: string
  fileName?: string
  fileType?: string
  fileSize?: number
}

export interface ScheduledPost {
  id: string
  topic: Topic
  contentType: ContentType
  content: string
  scheduledFor: Date
  status: "scheduled" | "published" | "failed"
  createdAt: Date
  platforms: Platform[] // Added platforms array
  recurrence?: "once" | "daily" | "weekly" | "monthly" // Optional recurrence pattern
  images?: UploadedImage[] // Added images array
}

// Add the missing UserInfo interface
export interface UserInfo {
  id: string
  name: string
  email: string
  image: string | null
}
