import LinkedInProvider from "next-auth/providers/linkedin"

// LinkedIn OAuth scopes for content posting and profile access
export const LINKEDIN_SCOPES = [
  "openid",
  "profile",
  "email",
  "w_member_social", // Required for posting content
].join(" ")

// LinkedIn provider configuration
export const linkedInProvider = LinkedInProvider({
  clientId: process.env.LINKEDIN_CLIENT_ID || "",
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || "",
  authorization: {
    params: {
      scope: LINKEDIN_SCOPES,
    },
  },
  // Use LinkedIn v2 API
  wellKnown: "https://www.linkedin.com/oauth/.well-known/openid_configuration",
})

// LinkedIn API endpoints
export const LINKEDIN_API = {
  PROFILE: "https://api.linkedin.com/v2/people/~",
  POST: "https://api.linkedin.com/v2/ugcPosts",
  SHARES: "https://api.linkedin.com/v2/shares",
} as const

// Helper function to validate LinkedIn access token
export async function validateLinkedInToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch(LINKEDIN_API.PROFILE, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    return response.ok
  } catch (error) {
    console.error("Error validating LinkedIn token:", error)
    return false
  }
}

// Helper function to get LinkedIn profile information
export async function getLinkedInProfile(accessToken: string) {
  try {
    const response = await fetch(LINKEDIN_API.PROFILE, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`LinkedIn API error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error("Error fetching LinkedIn profile:", error)
    throw error
  }
}
