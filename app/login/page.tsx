import type { Metadata } from "next"
import Image from "next/image"
import LoginForm from "@/components/login-form"

export const metadata: Metadata = {
  title: "Login - Blabbr",
  description: "Login to access Blabbr",
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#013060] p-4 text-white">
      <div className="w-full max-w-lg space-y-8">
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-32 w-80 sm:h-40 sm:w-96 md:h-48 md:w-[450px]">
            <Image src="/blabbr-logo.png" alt="Blabbr Logo" fill priority className="object-contain" />
          </div>
        </div>
        <div className="mt-8 rounded-lg bg-white/10 p-6 backdrop-blur-sm">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
