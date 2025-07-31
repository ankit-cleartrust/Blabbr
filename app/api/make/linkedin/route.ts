import { NextResponse } from "next/server"
import { sendContentToLinkedIn } from "@/lib/make-webhook"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { sanitizeUserInfo } from "@/lib/session-utils"

export const runtime = "nodejs" // Ensure we're using Node.js runtime for NextAuth

export async function POST(request: Request) {
  try {
    const { topic, contentType, content, images } = await request.json()

    // Get the user session
    const session = await getServerSession(authOptions)
    const userInfo = sanitizeUserInfo(session)

    // Use the centralized webhook function with user info
    const result = await sendContentToLinkedIn(topic, contentType, content, images, userInfo)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Content sent to LinkedIn successfully",
      data: result.data,
    })
  } catch (error) {
    console.error("Error in LinkedIn route:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
