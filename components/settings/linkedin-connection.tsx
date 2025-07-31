"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Linkedin,
  CheckCircle,
  XCircle,
  User,
  Mail,
  Calendar,
  Loader2,
  RefreshCw,
  ExternalLink,
  Shield,
  AlertTriangle,
  Lock,
  Info,
  LogOut,
} from "lucide-react"
import {
  initiateLinkedInAuth,
  getStoredLinkedInConnection,
  storeLinkedInConnection,
  exchangeCodeForToken,
  isReconnectionAttempt,
  validateLinkedInConnection,
  isAuthInProgress,
  wasSignedOutFromLinkedIn,
  clearLinkedInSignOutTracking,
  type LinkedInUser,
  clearLinkedInConnection,
} from "@/lib/linkedin-frontend-config"

export function LinkedInConnectionSettings() {
  const [connection, setConnection] = useState<LinkedInUser | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isProcessingCallback, setIsProcessingCallback] = useState(false)
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false)
  const [isReconnectionFlow, setIsReconnectionFlow] = useState(false)
  const [authInProgress, setAuthInProgress] = useState(false)
  const [wasSignedOut, setWasSignedOut] = useState(false)

  useEffect(() => {
    loadConnection()
    checkAuthProgress()
    handleUrlParams()
    checkReconnectionStatus()
    checkSignOutStatus()
  }, [])

  const loadConnection = () => {
    try {
      const stored = getStoredLinkedInConnection()
      setConnection(stored)
      console.log("LinkedIn connection loaded:", !!stored)
    } catch (error) {
      console.error("Error loading connection:", error)
      setError("Failed to load connection data")
    }
  }

  const checkAuthProgress = () => {
    const inProgress = isAuthInProgress()
    setAuthInProgress(inProgress)
    if (inProgress) {
      console.log("Authentication in progress detected")
    }
  }

  const checkReconnectionStatus = () => {
    const isReconnection = isReconnectionAttempt()
    setIsReconnectionFlow(isReconnection)

    if (isReconnection) {
      console.log("Reconnection flow detected")
    }
  }

  const checkSignOutStatus = () => {
    const signedOut = wasSignedOutFromLinkedIn()
    setWasSignedOut(signedOut)

    if (signedOut) {
      console.log("User was signed out from LinkedIn")
      setSuccess("Successfully signed out from LinkedIn. Next connection will require fresh login.")
      // Clear the sign out tracking after showing the message
      setTimeout(() => {
        clearLinkedInSignOutTracking()
        setWasSignedOut(false)
      }, 3000)
    }
  }

  const handleUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search)
    const code = urlParams.get("code")
    const state = urlParams.get("state")
    const error = urlParams.get("error")
    const linkedin = urlParams.get("linkedin")

    if (linkedin === "callback" && code && state) {
      handleOAuthCallback(code, state)
    } else if (linkedin === "signed_out") {
      // User returned from LinkedIn sign out
      setSuccess("Successfully signed out from LinkedIn. You can now connect with a fresh login.")
      setIsReconnectionFlow(true)
      cleanUpUrl()
    } else if (linkedin === "error" || error) {
      const errorDescription = urlParams.get("error_description") || error || "Authentication failed"
      setError(errorDescription)
      cleanUpUrl()
    }
  }

  const handleOAuthCallback = async (code: string, state: string) => {
    setIsProcessingCallback(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Processing OAuth callback:", {
        code: !!code,
        state: state?.substring(0, 10) + "...",
        authInProgress,
      })

      // Exchange code for token with reconnection context
      const result = await exchangeCodeForToken(code, state)

      if (result.success && result.connectionData) {
        // Store the connection data
        storeLinkedInConnection(result.connectionData)
        setConnection(result.connectionData)

        const successMessage = result.isReconnection
          ? "LinkedIn account reconnected successfully with fresh authentication!"
          : "LinkedIn account connected successfully!"

        setSuccess(successMessage)
        setIsReconnectionFlow(false)
        setAuthInProgress(false)
        setWasSignedOut(false)

        // Clean up URL parameters
        cleanUpUrl()
      } else {
        throw new Error(result.error || "Connection failed")
      }
    } catch (error) {
      console.error("OAuth callback error:", error)
      const errorMsg = error instanceof Error ? error.message : "Connection failed"

      // Provide more specific error messages
      if (errorMsg.includes("state parameter") || errorMsg.includes("CSRF")) {
        setError(
          "Authentication security check failed. This can happen if you took too long or opened multiple tabs. Please try connecting again.",
        )
      } else if (errorMsg.includes("expired")) {
        setError("Authentication session expired. Please try connecting again.")
      } else if (errorMsg.includes("session expired")) {
        setError("Your authentication session has expired. Please start the connection process again.")
      } else {
        setError(errorMsg)
      }

      setAuthInProgress(false)
    } finally {
      setIsProcessingCallback(false)
      setIsConnecting(false)
    }
  }

  const handleRetryConnection = async () => {
    try {
      setError(null)
      setSuccess(null)
      setAuthInProgress(false)

      console.log("Retrying LinkedIn connection...")

      // Wait a moment then retry
      setTimeout(() => {
        handleConnect(isReconnectionFlow)
      }, 500)
    } catch (error) {
      console.error("Retry connection error:", error)
      setError("Failed to retry connection")
    }
  }

  const cleanUpUrl = () => {
    const cleanUrl = new URL(window.location.href)
    cleanUrl.searchParams.delete("code")
    cleanUrl.searchParams.delete("state")
    cleanUrl.searchParams.delete("linkedin")
    cleanUrl.searchParams.delete("error")
    cleanUrl.searchParams.delete("error_description")
    window.history.replaceState({}, "", cleanUrl.toString())
  }

  const handleConnect = async (forceReauth = false) => {
    setIsConnecting(true)
    setError(null)
    setSuccess(null)
    setAuthInProgress(true)

    try {
      console.log("Initiating LinkedIn connection:", { forceReauth, isReconnectionFlow })

      // Show immediate feedback
      if (isReconnectionFlow || forceReauth) {
        setSuccess("Preparing secure authentication... You'll be redirected to LinkedIn shortly.")
      } else {
        setSuccess("Preparing LinkedIn connection... You'll be redirected shortly.")
      }

      // Initiate OAuth flow with forced login for reconnections
      initiateLinkedInAuth(forceReauth || isReconnectionFlow)
    } catch (error) {
      console.error("Connection error:", error)
      setError(error instanceof Error ? error.message : "Failed to initiate connection")
      setIsConnecting(false)
      setAuthInProgress(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Disconnecting and signing out from LinkedIn...")

      // Show immediate feedback
      setSuccess("Clearing your LinkedIn connection and signing out... Please wait.")

      // Clear all local data immediately
      clearLinkedInConnection()
      setConnection(null)
      setShowDisconnectDialog(false)
      setIsReconnectionFlow(true)
      setAuthInProgress(false)

      // Mark disconnection
      const logoutInfo = {
        loggedOutAt: new Date().toISOString(),
        reason: "manual_disconnect",
        requiresFreshLogin: true,
        signedOutFromLinkedIn: true,
      }
      localStorage.setItem("linkedin_logout_info", JSON.stringify(logoutInfo))

      // Show success message
      setSuccess("LinkedIn account disconnected successfully. Opening LinkedIn logout page...")

      // Open LinkedIn logout in a new tab for user convenience
      setTimeout(() => {
        const linkedinLogoutUrl = "https://www.linkedin.com/m/logout"
        const logoutWindow = window.open(
          linkedinLogoutUrl,
          "_blank",
          "width=600,height=400,scrollbars=yes,resizable=yes",
        )

        // Close the logout tab after a few seconds
        setTimeout(() => {
          if (logoutWindow && !logoutWindow.closed) {
            logoutWindow.close()
          }
        }, 3000)

        // Update success message
        setSuccess(
          "LinkedIn account disconnected successfully. You've been signed out from LinkedIn. Next connection will require fresh login.",
        )
        setWasSignedOut(true)
      }, 500)

      console.log("LinkedIn disconnect completed successfully")
    } catch (error) {
      console.error("Disconnect error:", error)
      setError("Failed to disconnect LinkedIn account")
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleReconnect = async () => {
    try {
      setError(null)
      setSuccess("Initiating secure reconnection...")

      // Force fresh authentication
      await handleConnect(true)
    } catch (error) {
      console.error("Reconnection error:", error)
      setError("Failed to initiate reconnection")
    }
  }

  const handleValidate = async () => {
    if (!connection) return

    setIsValidating(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("Validating LinkedIn connection...")

      const isValid = await validateLinkedInConnection(connection)

      if (isValid) {
        // Update connection with new validation timestamp
        const updatedConnection = {
          ...connection,
          updatedAt: new Date().toISOString(),
        }
        storeLinkedInConnection(updatedConnection)
        setConnection(updatedConnection)
        setSuccess("LinkedIn connection is valid and active")
      } else {
        setError("LinkedIn connection is invalid or expired. Please reconnect.")
        // Don't automatically clear - let user decide
      }
    } catch (error) {
      console.error("Validation error:", error)
      setError("Failed to validate LinkedIn connection")
    } finally {
      setIsValidating(false)
    }
  }

  const handleTestPost = async () => {
    if (!connection) return

    setIsTesting(true)
    setError(null)
    setSuccess(null)

    try {
      const testContent = `🚀 Test post from Blabbr AI Content Generator - ${new Date().toLocaleString()}\n\nThis post was created using the LinkedIn UGC API with enhanced security${connection.isReconnection ? " and fresh authentication" : ""}. #LinkedInAPI #ContentAutomation #OAuth2`

      const response = await fetch("/api/linkedin/post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: testContent,
          accessToken: connection.accessToken,
          linkedinId: connection.linkedinId,
        }),
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSuccess(result.message || "Test post shared successfully!")
      } else {
        // Handle specific error cases that might require re-authentication
        if (response.status === 401 || response.status === 403) {
          setError(result.error + " Your session may have expired. Please reconnect.")
          // Mark for reconnection
          setIsReconnectionFlow(true)
        } else {
          throw new Error(result.error || "Test post failed")
        }
      }
    } catch (error) {
      console.error("Test post error:", error)
      setError(error instanceof Error ? error.message : "Test post failed")
    } finally {
      setIsTesting(false)
    }
  }

  if (isProcessingCallback) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {isReconnectionFlow ? "Processing Secure Reconnection" : "Processing Authentication"}
          </h3>
          <p className="text-sm text-gray-600 text-center">
            {isReconnectionFlow
              ? "Completing your secure LinkedIn reconnection with fresh authentication..."
              : "Please wait while we complete your LinkedIn connection..."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Social Media Connections</h2>
        <p className="text-gray-600">Connect your social media accounts to enable direct posting and content sharing</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Linkedin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">LinkedIn Integration</CardTitle>
                <CardDescription>
                  Connect your LinkedIn account using OAuth 2.0 with enhanced security and proper sign-out
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {connection?.isReconnection && (
                <Badge variant="outline" className="text-xs">
                  <Shield className="h-3 w-3 mr-1" />
                  Secure Reconnection
                </Badge>
              )}
              {authInProgress && (
                <Badge variant="secondary" className="text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Auth in Progress
                </Badge>
              )}
              {wasSignedOut && (
                <Badge variant="outline" className="text-xs">
                  <LogOut className="h-3 w-3 mr-1" />
                  Signed Out
                </Badge>
              )}
              <Badge variant={connection ? "default" : "secondary"}>{connection ? "Connected" : "Not Connected"}</Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                {(error.includes("state parameter") ||
                  error.includes("expired") ||
                  error.includes("security check failed") ||
                  error.includes("session expired")) && (
                  <Button variant="outline" size="sm" onClick={handleRetryConnection} className="ml-4 bg-transparent">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {authInProgress && !isProcessingCallback && (
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Authentication in Progress:</strong> If you're not redirected automatically, please check if
                popups are blocked or try again.
              </AlertDescription>
            </Alert>
          )}

          {(isReconnectionFlow || wasSignedOut) && !connection && (
            <Alert className="border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Enhanced Security Mode:</strong>{" "}
                {wasSignedOut
                  ? "You've been signed out from LinkedIn."
                  : "Since you previously disconnected your LinkedIn account,"}{" "}
                you'll be redirected to LinkedIn's login page to re-enter your credentials for security purposes.
              </AlertDescription>
            </Alert>
          )}

          {connection ? (
            <div className="space-y-6">
              {/* Connected User Info */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4 mb-4">
                  {connection.picture ? (
                    <img
                      src={connection.picture || "/placeholder.svg"}
                      alt={connection.name}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{connection.name}</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {connection.email}
                    </p>
                    {connection.isReconnection && (
                      <div className="flex items-center gap-1 mt-1">
                        <Shield className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600 font-medium">Securely Reconnected</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Connected:</span>
                    <p className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(connection.lastLogin).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p>{new Date(connection.updatedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              {/* Granted Permissions */}
              <div>
                <h4 className="font-semibold mb-2">Granted Permissions</h4>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">openid</Badge>
                  <Badge variant="outline">profile</Badge>
                  <Badge variant="outline">email</Badge>
                  <Badge variant="outline">w_member_social</Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={handleValidate} disabled={isValidating} variant="outline" size="sm">
                  {isValidating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Validate
                    </>
                  )}
                </Button>

                <Button onClick={handleTestPost} disabled={isTesting} size="sm">
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Test Post
                    </>
                  )}
                </Button>

                <Button onClick={handleReconnect} variant="secondary" size="sm">
                  <Lock className="mr-2 h-4 w-4" />
                  Secure Reconnect
                </Button>

                <Button onClick={() => setShowDisconnectDialog(true)} variant="destructive" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out & Disconnect
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              <div className="p-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Linkedin className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isReconnectionFlow || wasSignedOut
                    ? "Reconnect Your LinkedIn Account"
                    : "Connect Your LinkedIn Account"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {isReconnectionFlow || wasSignedOut
                    ? "For security purposes, you'll need to sign in to LinkedIn again to reconnect your account."
                    : "Connect your LinkedIn account using OAuth 2.0 authentication and the LinkedIn UGC API for direct posting."}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => handleConnect(isReconnectionFlow || wasSignedOut)}
                    disabled={isConnecting || authInProgress}
                    size="lg"
                  >
                    {isConnecting || authInProgress ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {isReconnectionFlow || wasSignedOut ? "Redirecting to LinkedIn Login..." : "Connecting..."}
                      </>
                    ) : (
                      <>
                        {isReconnectionFlow || wasSignedOut ? (
                          <Lock className="mr-2 h-4 w-4" />
                        ) : (
                          <Linkedin className="mr-2 h-4 w-4" />
                        )}
                        {isReconnectionFlow || wasSignedOut ? "Sign In to LinkedIn" : "Connect LinkedIn"}
                      </>
                    )}
                  </Button>
                </div>

                {(isReconnectionFlow || wasSignedOut) && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Enhanced Security:</strong> This ensures your account security by requiring fresh
                      authentication {wasSignedOut ? "after signing out from LinkedIn" : "after disconnection"}.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Separator />

          {/* Configuration Info */}
          <div className="space-y-4">
            <h4 className="font-semibold">LinkedIn App Configuration Checklist</h4>

            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Products:</p>
                  <p className="text-xs text-gray-600">Share on LinkedIn, Sign In with LinkedIn using OpenID Connect</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">OAuth 2.0 Scopes:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">openid profile email w_member_social</code>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Redirect URLs:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/api/linkedin/callback`
                      : "https://blabbr.agent91.ai/api/linkedin/callback"}
                  </code>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Logout Redirect URLs:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded break-all">
                    {typeof window !== "undefined"
                      ? `${window.location.origin}/settings`
                      : "https://blabbr.agent91.ai/settings"}
                  </code>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Enhanced Features List */}
          <div className="space-y-4">
            <h4 className="font-semibold">Enhanced LinkedIn Integration Features</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <LogOut className="h-4 w-4 text-green-600" />
                <span className="text-sm">Proper LinkedIn sign-out on disconnect</span>
              </div>

              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-600" />
                <span className="text-sm">Enhanced security for reconnections</span>
              </div>

              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-green-600" />
                <span className="text-sm">Forced fresh login after sign-out</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Multi-layer OAuth state protection</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Post content directly to LinkedIn feed</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Share articles with custom descriptions</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Upload and share images with posts</span>
              </div>

              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="text-sm">Seamless reconnection with fresh authentication</span>
              </div>

              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm">Session validation and security monitoring</span>
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Redundant secure token storage</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Disconnect Confirmation Dialog */}
      <Dialog open={showDisconnectDialog} onOpenChange={setShowDisconnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-600" />
              Sign Out & Disconnect LinkedIn Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your LinkedIn account? This will clear your connection and open
              LinkedIn's logout page in a new tab to help you sign out.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">Secure Disconnect Process</h4>
              <p className="text-sm text-amber-700">
                This will clear your LinkedIn connection from our app and open LinkedIn's logout page in a new tab to
                help you sign out from LinkedIn. Your next connection will require fresh authentication.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">This will:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Remove your stored LinkedIn credentials and access tokens
                </li>
                <li className="flex items-center gap-2">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Disable direct posting to LinkedIn via the UGC API
                </li>
                <li className="flex items-center gap-2">
                  <ExternalLink className="h-3 w-3 text-blue-500" />
                  Open LinkedIn logout page in a new tab (for your convenience)
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-3 w-3 text-blue-500" />
                  Require fresh LinkedIn login for reconnection (maximum security)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Not affect any posts already published to LinkedIn
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDisconnectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisconnect} disabled={isDisconnecting}>
              {isDisconnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out & Disconnect
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LinkedInConnectionSettings
