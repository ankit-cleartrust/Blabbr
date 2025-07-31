import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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

        try {
          const response = await fetch("https://backend.openivt.ai/admin/user/ext/login", {
            method: "POST",
            headers: {
              Origin: "https://wolfv3.replit.app",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!response.ok) {
            console.error("Login API error:", response.status, response.statusText)
            return null
          }

          const data = await response.json()

          // Check if login was successful
          if (data.success || data.token || data.user) {
            return {
              id: data.user?.id || data.id || credentials.email,
              email: credentials.email,
              name: data.user?.name || data.name || credentials.email.split("@")[0],
              image: data.user?.image || data.image || null,
              accessToken: data.token || data.accessToken || null,
            }
          }

          return null
        } catch (error) {
          console.error("Login API error:", error)
          return null
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.accessToken = (user as any).accessToken
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        ;(session as any).accessToken = token.accessToken
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }
