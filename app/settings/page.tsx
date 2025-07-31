import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SettingsPage } from "@/components/settings/settings-page"

interface SettingsPageProps {
  searchParams: { tab?: string }
}

export default async function Settings({ searchParams }: SettingsPageProps) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SettingsPage defaultTab={searchParams.tab} />
    </div>
  )
}
