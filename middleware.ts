import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Exclude API routes, auth routes, and public assets
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".") || pathname === "/login") {
    return NextResponse.next()
  }

  // For all other routes, let the client-side handle authentication
  // This avoids server-side session checking that causes crypto issues
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
