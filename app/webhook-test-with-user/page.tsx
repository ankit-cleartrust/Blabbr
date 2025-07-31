import { WebhookTestWithUser } from "@/components/webhook-test-with-user"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export default async function WebhookTestWithUserPage() {
  const session = await getServerSession(authOptions)

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">Make.com Webhook Test with User Information</h1>
      <div className="mb-4 text-center">
        <p className="text-gray-600">
          {session
            ? `Logged in as: ${session.user?.name || session.user?.email || "Unknown user"}`
            : "Not logged in - user information will not be included"}
        </p>
      </div>
      <WebhookTestWithUser />
    </div>
  )
}
