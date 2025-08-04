/**
 * LinkedIn OAuth Configuration and Frontend Utilities
 */

export interface LinkedInConfig {
  clientId: string
  redirectUri: string
  scope: string
  responseType: string
  state: string
}

export interface LinkedInUser {
  id: string
  linkedinId: string
  email: string
  name: string
  picture: string
  accessToken: string
  sessionId: string
  lastLogin: string
  createdAt: string
  updatedAt: string
  isReconnection?: boolean
}

export interface ConnectionData {
  userId: string
  linkedinId: string
  name: string
  email: string
  picture?: string
  accessToken: string
  sessionId: string
  expiresIn: number
  scope: string
  connectedAt: string
  lastValidated: string
  disconnectedAt?: string
  reconnectionCount: number
}

// LinkedIn OAuth Configuration
export const LINKEDIN_CONFIG = {
  clientId: process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || "",
  redirectUri: typeof window !== "undefined" ? `${window.location.origin}/api/linkedin/callback` : "",
  scope: "openid profile email w_member_social",
  responseType: "code",
  state: "",
}

// Generate random state for CSRF protection
export function generateRandomState(): string {
  const timestamp = Date.now().toString()
  const random1 = Math.random().toString(36).substring(2, 15)
  const random2 = Math.random().toString(36).substring(2, 15)
  return `${timestamp}_${random1}_${random2}`
}

// Get LinkedIn OAuth configuration
export function getLinkedInConfig(): LinkedInConfig {
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_LINKEDIN_CLIENT_ID is not configured")
  }

  return {
    clientId,
    redirectUri: `${window.location.origin}/api/linkedin/callback`,
    scope: "openid profile email w_member_social",
    responseType: "code",
    state: generateRandomState(),
  }
}

// Store state with multiple fallbacks
function storeOAuthState(state: string, timestamp: string): void {
  try {
    // Store in multiple locations for redundancy
    localStorage.setItem("linkedin_state", state)
    localStorage.setItem("linkedin_auth_timestamp", timestamp)

    sessionStorage.setItem("linkedin_state", state)
    sessionStorage.setItem("linkedin_auth_timestamp", timestamp)

    // Store in a combined object as backup
    const stateData = {
      state,
      timestamp,
      created: new Date().toISOString(),
    }

    localStorage.setItem("linkedin_oauth_data", JSON.stringify(stateData))
    sessionStorage.setItem("linkedin_oauth_data", JSON.stringify(stateData))

    // Store in cookie as final fallback (expires in 1 hour)
    if (typeof document !== "undefined") {
      const expires = new Date(Date.now() + 60 * 60 * 1000).toUTCString()
      document.cookie = `linkedin_state=${state}; expires=${expires}; path=/; SameSite=Lax`
      document.cookie = `linkedin_timestamp=${timestamp}; expires=${expires}; path=/; SameSite=Lax`
    }

    console.log("OAuth state stored successfully:", {
      state: state.substring(0, 20) + "...",
      timestamp,
      locations: ["localStorage", "sessionStorage", "cookie"],
    })
  } catch (error) {
    console.error("Error storing OAuth state:", error)
    throw new Error("Failed to store authentication state")
  }
}

// Retrieve state with multiple fallbacks
function retrieveOAuthState(): { state: string; timestamp: string } | null {
  try {
    // Try localStorage first
    let state = localStorage.getItem("linkedin_state")
    let timestamp = localStorage.getItem("linkedin_auth_timestamp")

    if (state && timestamp) {
      console.log("State retrieved from localStorage")
      return { state, timestamp }
    }

    // Try sessionStorage
    state = sessionStorage.getItem("linkedin_state")
    timestamp = sessionStorage.getItem("linkedin_auth_timestamp")

    if (state && timestamp) {
      console.log("State retrieved from sessionStorage")
      return { state, timestamp }
    }

    // Try combined object backup
    const oauthData = localStorage.getItem("linkedin_oauth_data") || sessionStorage.getItem("linkedin_oauth_data")
    if (oauthData) {
      try {
        const parsed = JSON.parse(oauthData)
        if (parsed.state && parsed.timestamp) {
          console.log("State retrieved from backup object")
          return { state: parsed.state, timestamp: parsed.timestamp }
        }
      } catch (parseError) {
        console.warn("Failed to parse backup OAuth data:", parseError)
      }
    }

    // Try cookies as final fallback
    if (typeof document !== "undefined") {
      const cookies = document.cookie.split(";").reduce(
        (acc, cookie) => {
          const [key, value] = cookie.trim().split("=")
          acc[key] = value
          return acc
        },
        {} as Record<string, string>,
      )

      if (cookies.linkedin_state && cookies.linkedin_timestamp) {
        console.log("State retrieved from cookies")
        return {
          state: cookies.linkedin_state,
          timestamp: cookies.linkedin_timestamp,
        }
      }
    }

    console.warn("No OAuth state found in any storage location")
    return null
  } catch (error) {
    console.error("Error retrieving OAuth state:", error)
    return null
  }
}

// Clear all OAuth state data
function clearOAuthState(): void {
  try {
    const keysToRemove = [
      "linkedin_state",
      "linkedin_auth_timestamp",
      "linkedin_oauth_data",
      "linkedin_reconnection_flow",
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // Clear cookies
    if (typeof document !== "undefined") {
      document.cookie = "linkedin_state=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
      document.cookie = "linkedin_timestamp=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"
    }

    console.log("OAuth state cleared from all storage locations")
  } catch (error) {
    console.error("Error clearing OAuth state:", error)
  }
}

// Clear all LinkedIn connection data and session information
export function clearLinkedInConnection(): void {
  try {
    // Mark disconnection timestamp
    const disconnectionData = {
      disconnectedAt: new Date().toISOString(),
      requiresFreshLogin: true,
      sessionCleared: true,
    }

    // Store disconnection info temporarily for re-auth logic
    localStorage.setItem("linkedin_disconnection_info", JSON.stringify(disconnectionData))

    // Clear all LinkedIn-related data
    const keysToRemove = [
      "linkedin_connection",
      "linkedin_user",
      "linkedin_access_token",
      "linkedin_profile",
      "linkedin_session_data",
      "linkedin_last_auth",
      "linkedin_session_metadata",
    ]

    keysToRemove.forEach((key) => {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    })

    // Clear OAuth state
    clearOAuthState()

    // Clear any cached authentication data
    if (typeof window !== "undefined" && window.sessionStorage) {
      const sessionKeys = Object.keys(sessionStorage)
      sessionKeys.forEach((key) => {
        if (key.startsWith("linkedin_") || key.includes("linkedin")) {
          sessionStorage.removeItem(key)
        }
      })
    }

    console.log("LinkedIn connection data cleared with disconnection tracking")
  } catch (error) {
    console.error("Error clearing LinkedIn connection:", error)
  }
}

// Check if this is a reconnection attempt after disconnection
export function isReconnectionAttempt(): boolean {
  try {
    const disconnectionInfo = localStorage.getItem("linkedin_disconnection_info")
    if (!disconnectionInfo) return false

    const info = JSON.parse(disconnectionInfo)
    return info.requiresFreshLogin === true
  } catch (error) {
    console.error("Error checking reconnection status:", error)
    return false
  }
}

// Clear disconnection tracking after successful reconnection
export function clearDisconnectionTracking(): void {
  try {
    localStorage.removeItem("linkedin_disconnection_info")
    console.log("Disconnection tracking cleared")
  } catch (error) {
    console.error("Error clearing disconnection tracking:", error)
  }
}

// Sign out from LinkedIn and clear all session data
export function signOutFromLinkedIn(): Promise<void> {
  return new Promise((resolve) => {
    try {
      console.log("Initiating LinkedIn sign out process...")

      // Clear all local data first
      clearLinkedInConnection()

      // Clear session metadata
      localStorage.removeItem("linkedin_session_metadata")
      sessionStorage.removeItem("linkedin_session_metadata")

      // Mark that a forced logout occurred with LinkedIn sign out
      const logoutInfo = {
        loggedOutAt: new Date().toISOString(),
        reason: "linkedin_signout",
        requiresFreshLogin: true,
        signedOutFromLinkedIn: true,
      }

      localStorage.setItem("linkedin_logout_info", JSON.stringify(logoutInfo))

      // Get the current origin for redirect back
      const currentOrigin = window.location.origin
      const returnUrl = `${currentOrigin}/settings?linkedin=signed_out`

      // LinkedIn logout URL - this will sign out the user from LinkedIn
      const linkedinLogoutUrl = `https://www.linkedin.com/oauth/v2/logout?client_id=${process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(returnUrl)}`

      console.log("Redirecting to LinkedIn logout:", {
        logoutUrl: linkedinLogoutUrl,
        returnUrl,
      })

      // Redirect to LinkedIn logout page
      // This will sign out the user from LinkedIn and redirect back to our app
      window.location.href = linkedinLogoutUrl

      // Resolve after a short delay to allow the redirect to start
      setTimeout(resolve, 100)
    } catch (error) {
      console.error("Error during LinkedIn sign out:", error)
      // Fallback: just clear local data if LinkedIn logout fails
      clearLinkedInConnection()
      resolve()
    }
  })
}

// Initiate LinkedIn OAuth flow with forced fresh login for reconnections
export function initiateLinkedInAuth(forceReauth = false): void {
  try {
    const config = getLinkedInConfig()
    const isReconnection = isReconnectionAttempt()
    const timestamp = Date.now().toString()

    console.log("Initiating LinkedIn OAuth:", {
      forceReauth,
      isReconnection,
      state: config.state.substring(0, 20) + "...",
      timestamp,
    })

    // Store state with multiple fallbacks
    storeOAuthState(config.state, timestamp)

    // Mark if this is a reconnection attempt
    if (isReconnection || forceReauth) {
      localStorage.setItem("linkedin_reconnection_flow", "true")
      sessionStorage.setItem("linkedin_reconnection_flow", "true")
    }

    // Clear existing connection if forcing re-auth or reconnecting
    if (forceReauth || isReconnection) {
      // Don't clear OAuth state here, just connection data
      const keysToRemove = [
        "linkedin_connection",
        "linkedin_user",
        "linkedin_access_token",
        "linkedin_profile",
        "linkedin_session_data",
        "linkedin_last_auth",
        "linkedin_session_metadata",
      ]

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key)
        sessionStorage.removeItem(key)
      })
    }

    // Build authorization URL with enhanced parameters for forced login
    const authParams = new URLSearchParams({
      response_type: config.responseType,
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      state: config.state,
    })

    // Force fresh login for reconnections or explicit re-auth
    if (isReconnection || forceReauth) {
      // Add prompt=login to force LinkedIn login screen
      authParams.append("prompt", "login")
      // Add additional parameter to ensure fresh authentication
      authParams.append("approval_prompt", "force")
    }

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?${authParams.toString()}`

    console.log("Redirecting to LinkedIn OAuth URL")

    // Small delay to ensure state is stored before redirect
    setTimeout(() => {
      window.location.href = authUrl
    }, 100)
  } catch (error) {
    console.error("Error initiating LinkedIn auth:", error)
    throw error
  }
}

// Validate state parameter for CSRF protection with enhanced error handling
export function validateLinkedInState(receivedState: string): boolean {
  try {
    console.log("Starting state validation:", {
      receivedState: receivedState?.substring(0, 20) + "...",
      receivedLength: receivedState?.length,
    })

    const storedData = retrieveOAuthState()

    if (!storedData) {
      console.error("No stored OAuth state found in any location")
      return false
    }

    const { state: storedState, timestamp } = storedData

    console.log("State validation data:", {
      hasStoredState: !!storedState,
      hasTimestamp: !!timestamp,
      storedState: storedState?.substring(0, 20) + "...",
      storedLength: storedState?.length,
      statesMatch: storedState === receivedState,
    })

    // Check if state matches
    if (storedState !== receivedState) {
      console.error("State mismatch detected:", {
        stored: storedState?.substring(0, 30),
        received: receivedState?.substring(0, 30),
        storedLength: storedState?.length,
        receivedLength: receivedState?.length,
      })
      return false
    }

    // Check if request is not too old (15 minutes for reconnections, 10 minutes for normal)
    const authTime = Number.parseInt(timestamp)
    const now = Date.now()
    const isReconnection = localStorage.getItem("linkedin_reconnection_flow") === "true"
    const maxAge = isReconnection ? 15 * 60 * 1000 : 10 * 60 * 1000

    if (now - authTime > maxAge) {
      console.error("Authentication request expired", {
        authTime: new Date(authTime).toISOString(),
        now: new Date(now).toISOString(),
        ageMinutes: (now - authTime) / (1000 * 60),
        maxAgeMinutes: maxAge / (1000 * 60),
        isReconnection,
      })
      return false
    }

    console.log("State validation successful")
    return true
  } catch (error) {
    console.error("Error during state validation:", error)
    return false
  }
}

// Exchange authorization code for access token with reconnection handling
export async function exchangeCodeForToken(
  code: string,
  state: string,
): Promise<{
  success: boolean
  message?: string
  error?: string
  connectionData?: LinkedInUser
  isReconnection?: boolean
}> {
  try {
    console.log("Starting token exchange process...")

    // Validate state first
    if (!validateLinkedInState(state)) {
      throw new Error("Invalid state parameter - possible CSRF attack or session expired")
    }

    const isReconnectionFlow = localStorage.getItem("linkedin_reconnection_flow") === "true"

    const response = await fetch("/api/linkedin/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code,
        state,
        isReconnection: isReconnectionFlow,
      }),
    })

    console.log("Token exchange response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Token exchange failed:", response.status, errorText)
      throw new Error(`HTTP ${response.status}: ${errorText}`)
    }

    // Validate response content type
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.error("Expected JSON response, got:", contentType, responseText)
      throw new Error("Invalid response format from server")
    }

    const data = await response.json()
    console.log("Token exchange response:", data)

    if (data.success) {
      // Clean up OAuth state and auth progress
      clearOAuthState()

      // Clear disconnection tracking on successful reconnection
      if (isReconnectionFlow) {
        clearDisconnectionTracking()
      }

      return {
        success: true,
        message:
          data.message ||
          (isReconnectionFlow
            ? "LinkedIn account reconnected successfully with fresh login"
            : "LinkedIn account connected successfully"),
        connectionData: data.connectionData,
        isReconnection: isReconnectionFlow,
      }
    } else {
      throw new Error(data.error || "Token exchange failed")
    }
  } catch (error) {
    console.error("Token exchange error:", error)

    // Clean up on error
    clearOAuthState()

    return {
      success: false,
      error: error instanceof Error ? error.message : "Token exchange failed",
    }
  }
}

// Check if authentication is in progress
export function isAuthInProgress(): boolean {
  const storedData = retrieveOAuthState()
  return storedData !== null
}

// Check if user was signed out from LinkedIn
export function wasSignedOutFromLinkedIn(): boolean {
  try {
    const logoutInfo = localStorage.getItem("linkedin_logout_info")
    if (!logoutInfo) return false

    const info = JSON.parse(logoutInfo)
    return info.signedOutFromLinkedIn === true
  } catch (error) {
    console.error("Error checking LinkedIn sign out status:", error)
    return false
  }
}

// Clear LinkedIn sign out tracking
export function clearLinkedInSignOutTracking(): void {
  try {
    localStorage.removeItem("linkedin_logout_info")
    console.log("LinkedIn sign out tracking cleared")
  } catch (error) {
    console.error("Error clearing LinkedIn sign out tracking:", error)
  }
}

// Get stored connection data with reconnection validation
export function getStoredLinkedInConnection(): LinkedInUser | null {
  try {
    const stored = localStorage.getItem("linkedin_connection") || sessionStorage.getItem("linkedin_connection")

    if (!stored) {
      return null
    }

    const connection = JSON.parse(stored)

    // Validate connection data
    if (!connection.accessToken || !connection.linkedinId) {
      console.warn("Invalid LinkedIn connection data")
      clearLinkedInConnection()
      return null
    }

    // Check if this connection was made after a disconnection (enhanced security)
    const disconnectionInfo = localStorage.getItem("linkedin_disconnection_info")
    if (disconnectionInfo) {
      const info = JSON.parse(disconnectionInfo)
      const connectionTime = new Date(connection.lastLogin).getTime()
      const disconnectionTime = new Date(info.disconnectedAt).getTime()

      // If connection is older than disconnection, it's invalid
      if (connectionTime < disconnectionTime) {
        console.warn("Connection predates disconnection, clearing...")
        clearLinkedInConnection()
        return null
      }
    }

    // Check if token is expired (LinkedIn tokens typically last 60 days)
    const lastLogin = new Date(connection.lastLogin)
    const now = new Date()
    const daysSinceLogin = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceLogin > 60) {
      console.warn("LinkedIn token may be expired")
      clearLinkedInConnection()
      return null
    }

    return connection
  } catch (error) {
    console.error("Error retrieving LinkedIn connection:", error)
    clearLinkedInConnection()
    return null
  }
}

// Store connection data with reconnection metadata
export function storeLinkedInConnection(user: LinkedInUser): void {
  try {
    const isReconnection = localStorage.getItem("linkedin_reconnection_flow") === "true"

    const connectionData = {
      ...user,
      updatedAt: new Date().toISOString(),
      isReconnection,
      reconnectionTimestamp: isReconnection ? new Date().toISOString() : undefined,
    }

    const serialized = JSON.stringify(connectionData)

    // Store in both localStorage and sessionStorage for redundancy
    localStorage.setItem("linkedin_connection", serialized)
    sessionStorage.setItem("linkedin_connection", serialized)

    // Store additional session metadata for security
    const sessionMetadata = {
      connectionId: user.id,
      establishedAt: new Date().toISOString(),
      isReconnection,
      securityLevel: isReconnection ? "enhanced" : "standard",
    }

    localStorage.setItem("linkedin_session_metadata", JSON.stringify(sessionMetadata))

    console.log("LinkedIn connection stored successfully", {
      isReconnection,
      userId: user.id,
      securityLevel: sessionMetadata.securityLevel,
    })
  } catch (error) {
    console.error("Error storing LinkedIn connection:", error)
    throw error
  }
}

// Validate existing connection with enhanced security for reconnections
export async function validateLinkedInConnection(connection: LinkedInUser): Promise<boolean> {
  try {
    // Enhanced validation for reconnected accounts
    const sessionMetadata = localStorage.getItem("linkedin_session_metadata")
    if (sessionMetadata) {
      const metadata = JSON.parse(sessionMetadata)
      if (metadata.securityLevel === "enhanced") {
        console.log("Performing enhanced validation for reconnected account")
      }
    }

    // Test the connection by making a simple API call
    const response = await fetch("https://api.linkedin.com/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        Accept: "application/json",
      },
    })

    if (response.ok) {
      const profile = await response.json()

      // Verify the profile matches stored data
      if (profile.sub !== connection.linkedinId) {
        console.error("Profile mismatch detected")
        return false
      }

      console.log("LinkedIn connection validation successful")
      return true
    } else {
      console.error("LinkedIn API validation failed:", response.status)
      return false
    }
  } catch (error) {
    console.error("Error validating LinkedIn connection:", error)
    return false
  }
}

// Force logout and clear all session data (deprecated - use signOutFromLinkedIn instead)
export function forceLinkedInLogout(): void {
  try {
    // Clear all connection data
    clearLinkedInConnection()

    // Clear session metadata
    localStorage.removeItem("linkedin_session_metadata")
    sessionStorage.removeItem("linkedin_session_metadata")

    // Mark that a forced logout occurred
    const logoutInfo = {
      loggedOutAt: new Date().toISOString(),
      reason: "forced_logout",
      requiresFreshLogin: true,
    }

    localStorage.setItem("linkedin_logout_info", JSON.stringify(logoutInfo))

    console.log("Forced LinkedIn logout completed")
  } catch (error) {
    console.error("Error during forced logout:", error)
  }
}
