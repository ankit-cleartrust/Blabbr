import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { linkedInProvider } from "./linkedin-auth"
import type { UserInfo } from "./types"
import { getSession } from "next-auth/react"
import { loginWithCredentials, validateLoginResponse } from "./auth-api"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const loginData = await loginWithCredentials(credentials.email, credentials.password)

        if (!loginData || !validateLoginResponse(loginData)) {
          return null
        }

        return {
          id: loginData.user?.id || loginData.id || credentials.email,
          email: credentials.email,
          name: loginData.user?.name || loginData.name || credentials.email.split("@")[0],
          image: loginData.user?.image || loginData.image || null,
          accessToken: loginData.token || loginData.accessToken || null,
        }
      },
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

        // Include backend access token if available
        if (token.accessToken) {
          ;(session as any).accessToken = token.accessToken
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

        // Store backend access token for credentials login
        if (account.provider === "credentials" && (user as any).accessToken) {
          token.accessToken = (user as any).accessToken
        }

        return {
          ...token,
          accessToken: account.access_token || (user as any).accessToken,
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
