import { NextResponse } from "next/server"
import { schedulePost } from "@/lib/make-webhook"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanitizeUserInfo } from "@/lib/session-utils"

export const runtime = "nodejs" // Ensure we're using Node.js runtime for NextAuth

export async function POST(request: Request) {
  try {
    const requestData = await request.json()

    // Extract the post data, handling both direct post objects and nested structures
    const post = requestData.post?.scheduledPost || requestData.post || {}

    // Validate that we have the necessary data
    if (!post || !post.topic) {
      console.error("Invalid post data structure:", JSON.stringify(requestData, null, 2))
      return NextResponse.json(
        {
          error: "Invalid post data structure. Missing required fields.",
        },
        { status: 400 },
      )
    }

    // Get the user session
    const session = await getServerSession(authOptions)
    const userInfo = sanitizeUserInfo(session)

    // Use the centralized webhook function with user info
    const result = await schedulePost(post, userInfo)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Post scheduled successfully",
      data: result.data,
    })
  } catch (error) {
    console.error("Error in schedule route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
