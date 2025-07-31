import { NextResponse } from "next/server"
import { testMakeWebhookConnection } from "@/lib/make-webhook"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { sanitizeUserInfo } from "@/lib/session-utils"

export const runtime = "nodejs" // Ensure we're using Node.js runtime for NextAuth

export async function GET() {
  try {
    // Get the user session
    const session = await getServerSession(authOptions)
    const userInfo = sanitizeUserInfo(session)

    // Log the user information for debugging
    console.log(
      "Test webhook user info:",
      userInfo
        ? {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            hasImage: !!userInfo.image,
          }
        : "No user info available",
    )

    // Test the Make.com webhook connection with user info
    const result = await testMakeWebhookConnection(userInfo)

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Make.com webhook connection test successful",
      data: result.data,
      userIncluded: !!userInfo,
    })
  } catch (error) {
    console.error("Error testing Make.com webhook:", error)
    return NextResponse.json({ error: "Failed to test Make.com webhook connection" }, { status: 500 })
  }
}
