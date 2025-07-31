import type { ScheduledPost } from "./types"

const STORAGE_KEY = "blabbr_scheduled_posts"

// Helper function to safely parse JSON with Date objects
function reviveDates(key: string, value: any): any {
  // Check if the value is a date string (ISO format)
  const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/
  if (typeof value === "string" && dateRegex.test(value)) {
    return new Date(value)
  }
  return value
}

// Save scheduled posts to localStorage
export function saveScheduledPosts(posts: ScheduledPost[]): boolean {
  try {
    const serializedPosts = JSON.stringify(posts)
    localStorage.setItem(STORAGE_KEY, serializedPosts)
    return true
  } catch (error) {
    console.error("Error saving scheduled posts to localStorage:", error)
    return false
  }
}

// Load scheduled posts from localStorage
export function loadScheduledPosts(): ScheduledPost[] {
  try {
    const serializedPosts = localStorage.getItem(STORAGE_KEY)
    if (!serializedPosts) {
      return []
    }

    // Parse JSON with date revival
    const posts = JSON.parse(serializedPosts, reviveDates)

    // Ensure all date objects are properly converted
    return posts.map((post: any) => ({
      ...post,
      scheduledFor: post.scheduledFor instanceof Date ? post.scheduledFor : new Date(post.scheduledFor),
      createdAt: post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt),
    }))
  } catch (error) {
    console.error("Error loading scheduled posts from localStorage:", error)
    return []
  }
}

// Clear all scheduled posts from localStorage
export function clearScheduledPosts(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error("Error clearing scheduled posts from localStorage:", error)
    return false
  }
}

// Check if localStorage is available
export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__"
    localStorage.setItem(testKey, testKey)
    localStorage.removeItem(testKey)
    return true
  } catch (e) {
    return false
  }
}
