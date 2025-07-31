import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { generateLinkedInAuthUrl, LINKEDIN_SCOPES, type LinkedInOAuthConfig } from "@/lib/linkedin-oauth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    // Get current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the base URL from the request
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      `${request.nextUrl.protocol}//${request.nextUrl.host}`

    // LinkedIn OAuth configuration - Updated to match your LinkedIn app settings
    const config: LinkedInOAuthConfig = {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: `${baseUrl}/api/linkedin/callback`,
      scopes: [...LINKEDIN_SCOPES], // Use the updated scopes
    }

    // Validate configuration
    if (!config.clientId || !config.clientSecret) {
      return NextResponse.json({ error: "LinkedIn OAuth configuration missing" }, { status: 500 })
    }

    // Generate state parameter for CSRF protection
    const state = uuidv4()

    // Generate authorization URL
    const authUrl = generateLinkedInAuthUrl(config, state)

    console.log("LinkedIn OAuth Config:", {
      clientId: config.clientId,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      authUrl: authUrl.substring(0, 100) + "...", // Log partial URL for debugging
    })

    return NextResponse.json({
      authUrl,
      state,
      redirectUri: config.redirectUri,
      scopes: config.scopes,
    })
  } catch (error) {
    console.error("LinkedIn authorization error:", error)
    return NextResponse.json({ error: "Failed to generate authorization URL" }, { status: 500 })
  }
}
