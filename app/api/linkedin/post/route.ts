import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { content, accessToken, linkedinId } = await request.json()

    console.log("LinkedIn post request:", {
      hasContent: !!content,
      hasAccessToken: !!accessToken,
      hasLinkedinId: !!linkedinId,
      contentLength: content?.length,
    })

    if (!content || !accessToken || !linkedinId) {
      return NextResponse.json(
        { success: false, error: "Missing required parameters: content, accessToken, or linkedinId" },
        { status: 400 },
      )
    }

    // Validate access token by getting user info
    const userInfoResponse = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    if (!userInfoResponse.ok) {
      console.error("Access token validation failed:", userInfoResponse.status)
      return NextResponse.json(
        { success: false, error: "Invalid or expired access token. Please reconnect your LinkedIn account." },
        { status: 401 },
      )
    }

    const userInfo = await userInfoResponse.json()

    // Verify the LinkedIn ID matches
    if (userInfo.sub !== linkedinId) {
      console.error("LinkedIn ID mismatch:", { expected: linkedinId, actual: userInfo.sub })
      return NextResponse.json(
        { success: false, error: "LinkedIn account mismatch. Please reconnect your account." },
        { status: 403 },
      )
    }

    // Create the UGC post
    const ugcPostData = {
      author: `urn:li:person:${linkedinId}`,
      lifecycleState: "PUBLISHED",
      specificContent: {
        "com.linkedin.ugc.ShareContent": {
          shareCommentary: {
            text: content,
          },
          shareMediaCategory: "NONE",
        },
      },
      visibility: {
        "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
      },
    }

    console.log("Creating LinkedIn UGC post:", {
      author: ugcPostData.author,
      contentLength: content.length,
      visibility: "PUBLIC",
    })

    // Post to LinkedIn UGC API
    const ugcResponse = await fetch("https://api.linkedin.com/v2/ugcPosts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      body: JSON.stringify(ugcPostData),
    })

    if (!ugcResponse.ok) {
      const errorText = await ugcResponse.text()
      console.error("LinkedIn UGC post failed:", ugcResponse.status, errorText)

      // Handle specific LinkedIn API errors
      if (ugcResponse.status === 401) {
        return NextResponse.json(
          { success: false, error: "Access token expired. Please reconnect your LinkedIn account." },
          { status: 401 },
        )
      } else if (ugcResponse.status === 403) {
        return NextResponse.json(
          { success: false, error: "Insufficient permissions. Please reconnect with proper LinkedIn permissions." },
          { status: 403 },
        )
      } else if (ugcResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "LinkedIn API rate limit exceeded. Please try again later." },
          { status: 429 },
        )
      } else {
        return NextResponse.json(
          { success: false, error: `LinkedIn API error: ${ugcResponse.status}` },
          { status: ugcResponse.status },
        )
      }
    }

    const ugcResult = await ugcResponse.json()
    console.log("LinkedIn post successful:", {
      postId: ugcResult.id,
      hasResult: !!ugcResult,
    })

    return NextResponse.json({
      success: true,
      message: "Post shared successfully to LinkedIn!",
      postId: ugcResult.id,
      postUrl: `https://www.linkedin.com/feed/update/${ugcResult.id}`,
    })
  } catch (error) {
    console.error("LinkedIn post error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to post to LinkedIn" },
      { status: 500 },
    )
  }
}
