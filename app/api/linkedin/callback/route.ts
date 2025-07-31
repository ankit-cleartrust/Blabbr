import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { code, state, isReconnection } = await request.json()

    console.log("LinkedIn callback received:", {
      hasCode: !!code,
      hasState: !!state,
      state: state?.substring(0, 20) + "...",
      isReconnection,
    })

    if (!code || !state) {
      console.error("Missing required parameters:", { code: !!code, state: !!state })
      return NextResponse.json({ success: false, error: "Missing authorization code or state" }, { status: 400 })
    }

    // Validate environment variables
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      console.error("Missing LinkedIn credentials")
      return NextResponse.json({ success: false, error: "LinkedIn credentials not configured" }, { status: 500 })
    }

    // Exchange authorization code for access token
    const tokenUrl = "https://www.linkedin.com/oauth/v2/accessToken"
    const redirectUri = `${request.nextUrl.origin}/api/linkedin/callback`

    const tokenParams = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    })

    console.log("Exchanging code for token:", {
      tokenUrl,
      redirectUri,
      clientId,
      hasClientSecret: !!clientSecret,
    })

    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: tokenParams.toString(),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error("Token exchange failed:", tokenResponse.status, errorText)
      return NextResponse.json(
        { success: false, error: `Token exchange failed: ${tokenResponse.status}` },
        { status: tokenResponse.status },
      )
    }

    const tokenData = await tokenResponse.json()
    console.log("Token exchange successful:", {
      hasAccessToken: !!tokenData.access_token,
      expiresIn: tokenData.expires_in,
      scope: tokenData.scope,
    })

    if (!tokenData.access_token) {
      console.error("No access token in response:", tokenData)
      return NextResponse.json({ success: false, error: "No access token received" }, { status: 400 })
    }

    // Get user profile information
    const profileResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/json",
      },
    })

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text()
      console.error("Profile fetch failed:", profileResponse.status, errorText)
      return NextResponse.json(
        { success: false, error: `Profile fetch failed: ${profileResponse.status}` },
        { status: profileResponse.status },
      )
    }

    const profileData = await profileResponse.json()
    console.log("Profile fetch successful:", {
      hasProfile: !!profileData,
      id: profileData.sub,
      name: profileData.name,
      email: profileData.email,
    })

    // Create connection data
    const connectionData = {
      id: `linkedin_${profileData.sub}_${Date.now()}`,
      linkedinId: profileData.sub,
      email: profileData.email,
      name: profileData.name || `${profileData.given_name || ""} ${profileData.family_name || ""}`.trim(),
      picture: profileData.picture || "",
      accessToken: tokenData.access_token,
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isReconnection: isReconnection || false,
    }

    console.log("LinkedIn connection established:", {
      userId: connectionData.id,
      linkedinId: connectionData.linkedinId,
      name: connectionData.name,
      email: connectionData.email,
      isReconnection: connectionData.isReconnection,
    })

    return NextResponse.json({
      success: true,
      message: isReconnection
        ? "LinkedIn account reconnected successfully with fresh authentication"
        : "LinkedIn account connected successfully",
      connectionData,
    })
  } catch (error) {
    console.error("LinkedIn callback error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  // Handle GET requests (for direct callback URLs)
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  if (error) {
    console.error("LinkedIn OAuth error:", error)
    const errorDescription = searchParams.get("error_description") || error
    return NextResponse.redirect(
      `${request.nextUrl.origin}/settings?linkedin=error&error=${encodeURIComponent(errorDescription)}`,
    )
  }

  if (code && state) {
    // Redirect to settings page with callback parameters
    return NextResponse.redirect(`${request.nextUrl.origin}/settings?linkedin=callback&code=${code}&state=${state}`)
  }

  // Invalid callback
  return NextResponse.redirect(`${request.nextUrl.origin}/settings?linkedin=error&error=Invalid callback parameters`)
}
