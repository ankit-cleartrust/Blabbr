import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID

    if (!clientId) {
      return NextResponse.json({ error: "LinkedIn client ID not configured" }, { status: 500 })
    }

    const config = {
      clientId,
      redirectUri: `${request.nextUrl.origin}/api/linkedin/callback`,
      scope: "openid profile email w_member_social",
      responseType: "code",
      authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
      supportsForceLogin: true,
    }

    console.log("LinkedIn auth config requested:", config)

    return NextResponse.json(config)
  } catch (error) {
    console.error("Error in LinkedIn auth route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
