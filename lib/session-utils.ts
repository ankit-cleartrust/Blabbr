import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import type { UserInfo } from "./types"
import { getCurrentUser } from "./auth"

// Re-export getCurrentUser from auth.ts
export { getCurrentUser }

/**
 * Gets the current user information from the server-side session
 * Use this in server components or API routes
 * @returns User information or null if not authenticated
 */
export async function getServerUser(): Promise<UserInfo | null> {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user) {
      console.log("No server session found or user not authenticated")
      return null
    }

    return {
      id: session.user.id || "",
      name: session.user.name || "",
      email: session.user.email || "",
      image: session.user.image || null,
    }
  } catch (error) {
    console.error("Error getting server user:", error)
    return null
  }
}

/**
 * Safely extracts user information from a session
 * Removes sensitive data and only includes necessary fields
 * @param session The NextAuth session
 * @returns Sanitized user information
 */
export function sanitizeUserInfo(session: any): UserInfo | null {
  if (!session || !session.user) {
    return null
  }

  return {
    id: session.user.id || "",
    name: session.user.name || "",
    email: session.user.email || "",
    image: session.user.image || null,
  }
}

/**
 * Logs user information for debugging purposes
 * @param userInfo The user information to log
 * @param context Optional context for the log
 */
export function logUserInfo(userInfo: UserInfo | null, context = "User Info"): void {
  if (!userInfo) {
    console.log(`${context}: No user information available`)
    return
  }

  console.log(`${context}:`, {
    id: userInfo.id,
    name: userInfo.name,
    email: userInfo.email,
    hasImage: !!userInfo.image,
  })
}
