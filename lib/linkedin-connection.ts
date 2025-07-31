import { validateLinkedInToken, getLinkedInProfile } from "./linkedin-auth"

export interface LinkedInConnection {
  id: string
  userId: string
  accessToken: string
  refreshToken?: string
  profileId: string
  profileName: string
  profileEmail: string
  profilePicture?: string
  connectedAt: Date
  lastValidated: Date
  isActive: boolean
  permissions: string[]
}

// In a real application, this would be stored in a database
// For this example, we'll use localStorage with encryption
const LINKEDIN_CONNECTIONS_KEY = "linkedin_connections"

/**
 * Encrypts sensitive data before storing
 * In production, use a proper encryption library
 */
function encryptData(data: string): string {
  // Simple base64 encoding for demo - use proper encryption in production
  return btoa(data)
}

/**
 * Decrypts sensitive data after retrieving
 */
function decryptData(encryptedData: string): string {
  try {
    return atob(encryptedData)
  } catch {
    return ""
  }
}

/**
 * Stores LinkedIn connection securely
 */
export function storeLinkedInConnection(connection: LinkedInConnection): boolean {
  try {
    const connections = getStoredConnections()

    // Remove existing connection for this user
    const filteredConnections = connections.filter((c) => c.userId !== connection.userId)

    // Encrypt sensitive data
    const secureConnection = {
      ...connection,
      accessToken: encryptData(connection.accessToken),
      refreshToken: connection.refreshToken ? encryptData(connection.refreshToken) : undefined,
      connectedAt: connection.connectedAt.toISOString(),
      lastValidated: connection.lastValidated.toISOString(),
    }

    filteredConnections.push(secureConnection)

    localStorage.setItem(LINKEDIN_CONNECTIONS_KEY, JSON.stringify(filteredConnections))

    // Also store in sessionStorage as backup for API calls
    sessionStorage.setItem(`linkedin_connection_${connection.userId}`, JSON.stringify(secureConnection))

    console.log("LinkedIn connection stored successfully for user:", connection.userId)
    return true
  } catch (error) {
    console.error("Error storing LinkedIn connection:", error)
    return false
  }
}

/**
 * Retrieves stored LinkedIn connections
 */
function getStoredConnections(): LinkedInConnection[] {
  try {
    const stored = localStorage.getItem(LINKEDIN_CONNECTIONS_KEY)
    if (!stored) return []

    const connections = JSON.parse(stored)

    // Decrypt sensitive data and convert dates
    return connections.map((conn: any) => ({
      ...conn,
      accessToken: decryptData(conn.accessToken),
      refreshToken: conn.refreshToken ? decryptData(conn.refreshToken) : undefined,
      connectedAt: new Date(conn.connectedAt),
      lastValidated: new Date(conn.lastValidated),
    }))
  } catch (error) {
    console.error("Error retrieving LinkedIn connections:", error)
    return []
  }
}

/**
 * Gets LinkedIn connection for a specific user
 */
export function getLinkedInConnection(userId: string): LinkedInConnection | null {
  try {
    // First try localStorage
    const connections = getStoredConnections()
    let connection = connections.find((c) => c.userId === userId && c.isActive)

    // If not found in localStorage, try sessionStorage
    if (!connection) {
      const sessionStored = sessionStorage.getItem(`linkedin_connection_${userId}`)
      if (sessionStored) {
        const sessionConn = JSON.parse(sessionStored)
        connection = {
          ...sessionConn,
          accessToken: decryptData(sessionConn.accessToken),
          refreshToken: sessionConn.refreshToken ? decryptData(sessionConn.refreshToken) : undefined,
          connectedAt: new Date(sessionConn.connectedAt),
          lastValidated: new Date(sessionConn.lastValidated),
        }
      }
    }

    console.log("Retrieved LinkedIn connection for user:", userId, connection ? "Found" : "Not found")
    return connection || null
  } catch (error) {
    console.error("Error getting LinkedIn connection:", error)
    return null
  }
}

/**
 * Validates and updates LinkedIn connection
 */
export async function validateLinkedInConnection(userId: string): Promise<boolean> {
  const connection = getLinkedInConnection(userId)
  if (!connection) {
    console.log("No LinkedIn connection found for validation")
    return false
  }

  try {
    console.log("Validating LinkedIn connection for user:", userId)
    const isValid = await validateLinkedInToken(connection.accessToken)

    if (isValid) {
      // Update last validated timestamp
      connection.lastValidated = new Date()
      storeLinkedInConnection(connection)
      console.log("LinkedIn connection validated successfully")
      return true
    } else {
      // Mark connection as inactive
      connection.isActive = false
      storeLinkedInConnection(connection)
      console.log("LinkedIn connection validation failed - marked as inactive")
      return false
    }
  } catch (error) {
    console.error("Error validating LinkedIn connection:", error)
    return false
  }
}

/**
 * Disconnects LinkedIn account
 */
export function disconnectLinkedIn(userId: string): boolean {
  try {
    const connections = getStoredConnections()
    const updatedConnections = connections.filter((c) => c.userId !== userId)

    localStorage.setItem(LINKEDIN_CONNECTIONS_KEY, JSON.stringify(updatedConnections))
    sessionStorage.removeItem(`linkedin_connection_${userId}`)

    console.log("LinkedIn connection disconnected for user:", userId)
    return true
  } catch (error) {
    console.error("Error disconnecting LinkedIn:", error)
    return false
  }
}

/**
 * Creates a LinkedIn connection from session data
 */
export async function createLinkedInConnectionFromSession(
  userId: string,
  accessToken: string,
  userInfo: any,
): Promise<LinkedInConnection | null> {
  try {
    console.log("Creating LinkedIn connection from session for user:", userId)

    // Get LinkedIn profile information
    const profile = await getLinkedInProfile(accessToken)

    const connection: LinkedInConnection = {
      id: `linkedin_${userId}_${Date.now()}`,
      userId,
      accessToken,
      profileId: profile.id || profile.sub || userInfo.id,
      profileName:
        profile.name ||
        `${profile.localizedFirstName || profile.given_name || ""} ${profile.localizedLastName || profile.family_name || ""}`.trim() ||
        userInfo.name,
      profileEmail: profile.email || userInfo.email || "",
      profilePicture: profile.picture || profile.profilePicture?.displayImage || userInfo.image,
      connectedAt: new Date(),
      lastValidated: new Date(),
      isActive: true,
      permissions: ["openid", "profile", "email", "w_member_social"],
    }

    const success = storeLinkedInConnection(connection)
    console.log("LinkedIn connection creation result:", success ? "Success" : "Failed")
    return success ? connection : null
  } catch (error) {
    console.error("Error creating LinkedIn connection:", error)
    return null
  }
}

/**
 * Server-side function to get LinkedIn connection
 * This can be used in API routes where localStorage is not available
 */
export function getLinkedInConnectionFromHeaders(headers: Headers, userId: string): LinkedInConnection | null {
  try {
    // Try to get connection data from custom header (if passed from client)
    const connectionHeader = headers.get("x-linkedin-connection")
    if (connectionHeader) {
      const connectionData = JSON.parse(atob(connectionHeader))
      return {
        ...connectionData,
        connectedAt: new Date(connectionData.connectedAt),
        lastValidated: new Date(connectionData.lastValidated),
      }
    }
    return null
  } catch (error) {
    console.error("Error getting LinkedIn connection from headers:", error)
    return null
  }
}
