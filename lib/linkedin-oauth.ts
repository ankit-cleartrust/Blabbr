/**
 * LinkedIn OAuth 2.0 Integration
 * Based on Microsoft Learn documentation:
 * - https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow
 * - https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access
 * - https://learn.microsoft.com/en-us/linkedin/consumer/integrations/self-serve/share-on-linkedin
 */

// LinkedIn OAuth 2.0 endpoints
export const LINKEDIN_OAUTH_ENDPOINTS = {
  AUTHORIZATION: "https://www.linkedin.com/oauth/v2/authorization",
  ACCESS_TOKEN: "https://www.linkedin.com/oauth/v2/accessToken",
  INTROSPECT: "https://www.linkedin.com/oauth/v2/introspectToken",
} as const

// LinkedIn API v2 endpoints
export const LINKEDIN_API_ENDPOINTS = {
  PROFILE: "https://api.linkedin.com/v2/people/~",
  UGC_POSTS: "https://api.linkedin.com/v2/ugcPosts",
  SHARES: "https://api.linkedin.com/v2/shares",
  ASSETS: "https://api.linkedin.com/v2/assets",
} as const

// Updated scopes to match your LinkedIn app configuration
export const LINKEDIN_SCOPES = [
  "openid", // OpenID Connect for authentication
  "profile", // Read basic profile information
  "email", // Read email address
  "w_member_social", // Post, comment and like posts on behalf of the user
] as const

// LinkedIn OAuth 2.0 configuration
export interface LinkedInOAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

/**
 * Generate LinkedIn OAuth 2.0 authorization URL
 */
export function generateLinkedInAuthUrl(config: LinkedInOAuthConfig, state?: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scopes.join(" "),
    ...(state && { state }),
  })

  return `${LINKEDIN_OAUTH_ENDPOINTS.AUTHORIZATION}?${params.toString()}`
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  config: LinkedInOAuthConfig,
  authorizationCode: string,
): Promise<{
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
}> {
  const response = await fetch(LINKEDIN_OAUTH_ENDPOINTS.ACCESS_TOKEN, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authorizationCode,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(`LinkedIn OAuth error: ${errorData.error_description || response.statusText}`)
  }

  return response.json()
}

/**
 * Introspect access token to validate and get token info
 */
export async function introspectToken(
  clientId: string,
  clientSecret: string,
  accessToken: string,
): Promise<{
  active: boolean
  client_id?: string
  scope?: string
  expires_at?: number
}> {
  const response = await fetch(LINKEDIN_OAUTH_ENDPOINTS.INTROSPECT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      token: accessToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  if (!response.ok) {
    throw new Error(`Token introspection failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get LinkedIn profile information using OpenID Connect
 */
export async function getLinkedInProfile(accessToken: string): Promise<{
  sub: string
  name: string
  given_name: string
  family_name: string
  picture?: string
  email?: string
  email_verified?: boolean
}> {
  const response = await fetch("https://api.linkedin.com/v2/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`LinkedIn profile fetch failed: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get LinkedIn email address (fallback method)
 */
export async function getLinkedInEmail(accessToken: string): Promise<{
  elements: Array<{
    "handle~": {
      emailAddress: string
    }
    handle: string
    primary: boolean
    type: string
  }>
}> {
  const response = await fetch(`https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`LinkedIn email fetch failed: ${response.statusText}`)
  }

  return response.json()
}
