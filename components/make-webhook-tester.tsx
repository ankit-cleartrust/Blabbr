"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertCircle, RefreshCw } from "lucide-react"

export function MakeWebhookTester() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    timestamp: string
  } | null>(null)

  const testWebhook = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/make/test")
      const data = await response.json()

      setResult({
        success: data.success,
        message: data.success ? data.message : data.error,
        timestamp: new Date().toISOString(),
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
        <CardTitle>Make.com Webhook Tester</CardTitle>
        <CardDescription>Test your Make.com webhook connection to ensure it's properly configured</CardDescription>
      </CardHeader>
      <CardContent>
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
            "Test Make.com Webhook"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
