import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import { linkedInProvider } from "./linkedin-auth"
import type { UserInfo } from "./types"
import { getSession } from "next-auth/react"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    linkedInProvider,
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string

        // Include provider information
        if (token.provider) {
          ;(session.user as any).provider = token.provider
        }

        // Include LinkedIn access token if available
        if (token.linkedinAccessToken) {
          ;(session.user as any).linkedinAccessToken = token.linkedinAccessToken
        }

        // Ensure we're passing the image URL correctly
        if (token.picture) {
          session.user.image = token.picture as string
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.provider = account.provider

        // Store LinkedIn access token
        if (account.provider === "linkedin" && account.access_token) {
          token.linkedinAccessToken = account.access_token
        }

        return {
          ...token,
          accessToken: account.access_token,
          picture: user.image,
        }
      }
      return token
    },
  },
}

/**
 * Gets the current user information from the client-side session
 * Use this in client components
 * @returns User information or null if not authenticated
 */
export async function getCurrentUser(): Promise<UserInfo | null> {
  try {
    const session = await getSession()

    if (!session || !session.user) {
      console.log("No session found or user not authenticated")
      return null
    }

    return {
      id: session.user.id || "",
      name: session.user.name || "",
      email: session.user.email || "",
      image: session.user.image || null,
    }
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
