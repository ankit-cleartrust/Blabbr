"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function WebhookTestWithUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    timestamp: string
    userIncluded?: boolean
  } | null>(null)
  const { data: session } = useSession()

  const testWebhook = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/make/test")
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.success ? data.message : data.error,
        timestamp: new Date().toISOString(),
        userIncluded: data.userIncluded,
      })
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Failed to test webhook",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Make.com Webhook Tester (With User Info)</CardTitle>
        <CardDescription>Test your Make.com webhook connection with user information</CardDescription>
      </CardHeader>
      <CardContent>
        {session ? (
          <Alert className="mb-4 bg-blue-50 border-blue-200">
            <User className="h-4 w-4" />
            <AlertTitle>User Information Available</AlertTitle>
            <AlertDescription>User data will be included in the webhook payload.</AlertDescription>
          </Alert>
        ) : (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No User Session</AlertTitle>
            <AlertDescription>No user is logged in. The webhook will not include user information.</AlertDescription>
          </Alert>
        )}

        {session && (
          <Accordion type="single" collapsible className="mb-4">
            <AccordionItem value="user-info">
              <AccordionTrigger>Current User Information</AccordionTrigger>
              <AccordionContent>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>ID:</strong> {session.user?.id || "Not available"}
                  </div>
                  <div>
                    <strong>Name:</strong> {session.user?.name || "Not available"}
                  </div>
                  <div>
                    <strong>Email:</strong> {session.user?.email || "Not available"}
                  </div>
                  <div>
                    <strong>Image:</strong> {session.user?.image ? "Available" : "Not available"}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            <div className="flex items-start">
              {result.success ? (
                <CheckCircle className="h-4 w-4 mr-2 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2 mt-0.5" />
              )}
              <div>
                <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription className="mt-1">
                  {result.message}
                  {result.userIncluded !== undefined && (
                    <div className="mt-1 font-medium">
                      User information was {result.userIncluded ? "included ✓" : "not included ✗"} in the payload
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">{new Date(result.timestamp).toLocaleString()}</div>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={testWebhook} disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Testing...
            </>
          ) : (
            "Test Make.com Webhook With User Info"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
