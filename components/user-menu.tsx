"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

interface UserMenuProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

export default function UserMenu({ user }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [imageError, setImageError] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut({ redirect: false })
      router.push("/login")
    } catch (error) {
      console.error("Sign out error:", error)
      toast({
        title: "Sign out failed",
        description: "There was a problem signing out. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSigningOut(false)
    }
  }

  const handleSettings = () => {
    router.push("/settings")
  }

  const userInitial = user?.name?.charAt(0) || user?.email?.charAt(0) || "U"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            {user?.image && !imageError ? (
              <AvatarImage
                src={user.image || "/placeholder.svg"}
                alt={user.name || "User profile"}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback className="bg-purple-700 text-white">{userInitial}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="flex items-center justify-start gap-2 p-2">
          <Avatar className="h-8 w-8">
            {user?.image && !imageError ? (
              <AvatarImage
                src={user.image || "/placeholder.svg"}
                alt={user.name || "User profile"}
                onError={() => setImageError(true)}
                referrerPolicy="no-referrer"
              />
            ) : null}
            <AvatarFallback className="bg-purple-700 text-white">{userInitial}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col space-y-1 leading-none">
            {user?.name && <p className="font-medium">{user.name}</p>}
            {user?.email && <p className="w-[200px] truncate text-sm text-muted-foreground">{user.email}</p>}
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem className="cursor-pointer" onClick={handleSettings}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="cursor-pointer text-red-600 focus:text-red-600"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <span className="flex items-center">
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent"></div>
              Signing out...
            </span>
          ) : (
            <span className="flex items-center">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
