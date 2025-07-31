"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Link, Shield, Bell, SettingsIcon } from "lucide-react"
import { LinkedInConnectionSettings } from "./linkedin-connection"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface SettingsPageProps {
  defaultTab?: string
}

export function SettingsPage({ defaultTab = "profile" }: SettingsPageProps) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState(defaultTab)

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-600">Please sign in to access settings.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <SettingsIcon className="h-8 w-8 text-gray-700" />
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-600">Manage your account settings, connections, and preferences</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="connections" className="flex items-center space-x-2">
            <Link className="h-4 w-4" />
            <span>Connections</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Your basic profile information from your connected account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={session.user?.image || "/placeholder.svg"} alt={session.user?.name || "User"} />
                  <AvatarFallback className="text-lg">
                    {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{session.user?.name || "Unknown User"}</h3>
                  <p className="text-gray-600">{session.user?.email}</p>
                  <Badge variant="outline">
                    {(session.user as any)?.provider === "linkedin" ? "LinkedIn" : "Google"} Account
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">User ID</label>
                  <p className="text-sm text-gray-600 font-mono">{session.user?.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Account Type</label>
                  <p className="text-sm text-gray-600">
                    {(session.user as any)?.provider === "linkedin" ? "LinkedIn" : "Google"} OAuth
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connections Tab */}
        <TabsContent value="connections" className="space-y-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">Social Media Connections</h2>
              <p className="text-gray-600">
                Connect your social media accounts to enable direct posting and content sharing
              </p>
            </div>

            <LinkedInConnectionSettings />

            {/* Future connections can be added here */}
            <Card className="opacity-60">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle>Twitter Integration</CardTitle>
                      <CardDescription>Connect your Twitter account for direct posting (Coming Soon)</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">Coming Soon</Badge>
                </div>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Security</CardTitle>
              <CardDescription>Manage your privacy settings and data security preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Data Encryption</h4>
                    <p className="text-sm text-gray-600">
                      All sensitive data including access tokens are encrypted before storage
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Minimal Permissions</h4>
                    <p className="text-sm text-gray-600">
                      We only request the minimum permissions required for functionality
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium">Local Storage</h4>
                    <p className="text-sm text-gray-600">
                      Your data is stored locally in your browser and can be cleared at any time
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-2">Data Management</h4>
                <p className="text-sm text-gray-600 mb-4">
                  You have full control over your data and can manage it as needed.
                </p>
                <div className="space-y-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">Export my data</button>
                  <br />
                  <button className="text-sm text-red-600 hover:text-red-800">Delete all my data</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose what notifications you'd like to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Content Generation</h4>
                    <p className="text-sm text-gray-600">Notifications when content generation is complete</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Scheduled Posts</h4>
                    <p className="text-sm text-gray-600">Notifications when scheduled posts are published</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Connection Issues</h4>
                    <p className="text-sm text-gray-600">Alerts when social media connections need attention</p>
                  </div>
                  <Badge variant="outline">Enabled</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
