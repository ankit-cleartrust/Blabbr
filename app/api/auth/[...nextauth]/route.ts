import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// Use Node.js runtime to avoid Edge runtime issues with crypto
export const runtime = "nodejs"

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
