import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import {
  exchangeCodeForToken,
  getLinkedInProfile,
  getLinkedInEmail,
  type LinkedInOAuthConfig,
} from "@/lib/linkedin-oauth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")
    const errorDescription = searchParams.get("error_description")

    // Handle OAuth errors
    if (error) {
      console.error("LinkedIn OAuth error:", error, errorDescription)
      return NextResponse.redirect(
        new URL(`/settings?tab=connections&error=${encodeURIComponent(errorDescription || error)}`, request.url),
      )
    }

    // Validate required parameters
    if (!code) {
      return NextResponse.redirect(new URL("/settings?tab=connections&error=Missing authorization code", request.url))
    }

    // Get current session
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL("/login", request.url))
    }

    // LinkedIn OAuth configuration
    const config: LinkedInOAuthConfig = {
      clientId: process.env.LINKEDIN_CLIENT_ID || "",
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
      redirectUri: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL}/api/auth/linkedin/callback`,
      scopes: ["r_liteprofile", "r_emailaddress", "w_member_social"],
    }

    // Validate configuration
    if (!config.clientId || !config.clientSecret) {
      console.error("LinkedIn OAuth configuration missing")
      return NextResponse.redirect(
        new URL("/settings?tab=connections&error=LinkedIn configuration missing", request.url),
      )
    }

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(config, code)

    // Get LinkedIn profile information
    const [profileData, emailData] = await Promise.all([
      getLinkedInProfile(tokenData.access_token),
      getLinkedInEmail(tokenData.access_token),
    ])

    // Extract profile information
    const firstName = Object.values(profileData.firstName.localized)[0] || ""
    const lastName = Object.values(profileData.lastName.localized)[0] || ""
    const fullName = `${firstName} ${lastName}`.trim()
    const email = emailData.elements?.[0]?.["handle~"]?.emailAddress || ""

    // Store connection data in the response
    const connectionData = {
      userId: session.user.id,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
      profileId: profileData.id,
      profileName: fullName,
      profileEmail: email,
      profilePicture: profileData.profilePicture?.displayImage,
      connectedAt: new Date().toISOString(),
    }

    // Redirect to settings with connection data
    const redirectUrl = new URL("/settings", request.url)
    redirectUrl.searchParams.set("tab", "connections")
    redirectUrl.searchParams.set("linkedin_connected", "true")
    redirectUrl.searchParams.set("connection_data", btoa(JSON.stringify(connectionData)))

    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("LinkedIn OAuth callback error:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    return NextResponse.redirect(
      new URL(`/settings?tab=connections&error=${encodeURIComponent(errorMessage)}`, request.url),
    )
  }
}
