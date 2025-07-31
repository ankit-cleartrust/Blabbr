/**
 * LinkedIn Database Simulation
 * Simulates database operations for LinkedIn user data
 */

export interface LinkedInUser {
  id: string
  linkedinId: string
  email: string
  name: string
  picture: string
  accessToken: string
  sessionId: string
  lastLogin: Date
  createdAt: Date
  updatedAt: Date
  isReconnection?: boolean
  reconnectionCount?: number
}

export class LinkedInUserModel {
  private static STORAGE_KEY = "linkedin_users_db"

  // Get all users from localStorage (simulating database)
  static getAllUsers(): LinkedInUser[] {
    try {
      if (typeof window === "undefined") return []

      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (!stored) return []

      const users = JSON.parse(stored)
      return users.map((user: any) => ({
        ...user,
        lastLogin: new Date(user.lastLogin),
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      }))
    } catch (error) {
      console.error("Error getting all LinkedIn users:", error)
      return []
    }
  }

  // Find user by LinkedIn ID
  static findByLinkedInId(linkedinId: string): LinkedInUser | null {
    try {
      const users = this.getAllUsers()
      return users.find((user) => user.linkedinId === linkedinId) || null
    } catch (error) {
      console.error("Error finding LinkedIn user by ID:", error)
      return null
    }
  }

  // Find user by session ID
  static findBySessionId(sessionId: string): LinkedInUser | null {
    try {
      const users = this.getAllUsers()
      return users.find((user) => user.sessionId === sessionId) || null
    } catch (error) {
      console.error("Error finding LinkedIn user by session ID:", error)
      return null
    }
  }

  // Create new user
  static create(userData: Omit<LinkedInUser, "id" | "createdAt" | "updatedAt">): LinkedInUser | null {
    try {
      if (typeof window === "undefined") return null

      const users = this.getAllUsers()
      const newUser: LinkedInUser = {
        ...userData,
        id: Math.random().toString(36).substring(7),
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: new Date(userData.lastLogin),
      }

      users.push(newUser)
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))

      console.log("LinkedIn user created:", newUser.id)
      return newUser
    } catch (error) {
      console.error("Error creating LinkedIn user:", error)
      return null
    }
  }

  // Update existing user
  static update(id: string, updateData: Partial<LinkedInUser>): LinkedInUser | null {
    try {
      if (typeof window === "undefined") return null

      const users = this.getAllUsers()
      const userIndex = users.findIndex((user) => user.id === id)

      if (userIndex === -1) return null

      const updatedUser = {
        ...users[userIndex],
        ...updateData,
        updatedAt: new Date(),
      }

      users[userIndex] = updatedUser
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users))

      console.log("LinkedIn user updated:", id)
      return updatedUser
    } catch (error) {
      console.error("Error updating LinkedIn user:", error)
      return null
    }
  }

  // Delete user
  static delete(id: string): boolean {
    try {
      if (typeof window === "undefined") return false

      const users = this.getAllUsers()
      const filteredUsers = users.filter((user) => user.id !== id)

      if (filteredUsers.length === users.length) return false

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredUsers))

      console.log("LinkedIn user deleted:", id)
      return true
    } catch (error) {
      console.error("Error deleting LinkedIn user:", error)
      return false
    }
  }

  // Clear all users
  static clearAll(): boolean {
    try {
      if (typeof window === "undefined") return false

      localStorage.removeItem(this.STORAGE_KEY)
      console.log("All LinkedIn users cleared")
      return true
    } catch (error) {
      console.error("Error clearing all LinkedIn users:", error)
      return false
    }
  }
}
