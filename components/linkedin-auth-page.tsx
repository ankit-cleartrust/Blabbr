"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Linkedin, Shield, Lock, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react"
import { initiateLinkedInAuth, isReconnectionAttempt, clearDisconnectionTracking } from "@/lib/linkedin-frontend-config"

interface LinkedInAuthPageProps {
  onAuthComplete?: (success: boolean) => void
  forceReauth?: boolean
}

export default function LinkedInAuthPage({ onAuthComplete, forceReauth = false }: LinkedInAuthPageProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isReconnection, setIsReconnection] = useState(false)

  useEffect(() => {
    // Check if this is a reconnection attempt
    const reconnectionAttempt = isReconnectionAttempt()
    setIsReconnection(reconnectionAttempt)

    console.log("LinkedIn Auth Page loaded:", {
      forceReauth,
      isReconnection: reconnectionAttempt,
    })
  }, [forceReauth])

  const handleConnect = async () => {
    try {
      setIsConnecting(true)
      setError(null)

      console.log("Initiating LinkedIn authentication:", {
        forceReauth,
        isReconnection,
      })

      // Clear any existing disconnection tracking if this is a fresh start
      if (!isReconnection) {
        clearDisconnectionTracking()
      }

      // Initiate OAuth flow with forced login for reconnections
      initiateLinkedInAuth(forceReauth || isReconnection)
    } catch (error) {
      console.error("LinkedIn auth error:", error)
      setError(error instanceof Error ? error.message : "Failed to initiate LinkedIn authentication")
      setIsConnecting(false)
      onAuthComplete?.(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Linkedin className="h-8 w-8 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">{isReconnection ? "Reconnect to LinkedIn" : "Connect to LinkedIn"}</CardTitle>
          <CardDescription>
            {isReconnection
              ? "You'll need to sign in again to LinkedIn for security purposes"
              : "Authenticate with LinkedIn to enable content sharing"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isReconnection && (
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Enhanced Security:</strong> Since you previously disconnected your LinkedIn account, you'll be
                redirected to LinkedIn's login page to re-enter your credentials for security purposes.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">What happens next:</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-semibold">1</span>
                </div>
                <div>
                  <p className="font-medium">{isReconnection ? "Fresh LinkedIn Login" : "LinkedIn Authorization"}</p>
                  <p className="text-gray-600">
                    {isReconnection
                      ? "You'll be redirected to LinkedIn's login page to enter your credentials"
                      : "You'll be redirected to LinkedIn to authorize our application"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-semibold">2</span>
                </div>
                <div>
                  <p className="font-medium">Grant Permissions</p>
                  <p className="text-gray-600">Allow access to your profile information and posting capabilities</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-semibold">3</span>
                </div>
                <div>
                  <p className="font-medium">Complete Setup</p>
                  <p className="text-gray-600">Return to Blabbr with your LinkedIn account connected</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <Button onClick={handleConnect} disabled={isConnecting} className="w-full" size="lg">
              {isConnecting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  {isReconnection ? "Redirecting to LinkedIn Login..." : "Connecting..."}
                </>
              ) : (
                <>
                  <Linkedin className="mr-2 h-4 w-4" />
                  {isReconnection ? "Sign In to LinkedIn" : "Connect with LinkedIn"}
                </>
              )}
            </Button>

            {isReconnection && (
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  This ensures your account security by requiring fresh authentication
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <h4 className="font-semibold text-sm mb-2">Security Features:</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>OAuth 2.0 secure authentication</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>CSRF protection with state validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{isReconnection ? "Enhanced security for reconnections" : "Encrypted token storage"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="h-3 w-3 text-green-600" />
                <span>
                  {isReconnection ? "Fresh login required after disconnection" : "Minimal permissions requested"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
