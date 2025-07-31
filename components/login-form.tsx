"use client"

import type React from "react"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FcGoogle } from "react-icons/fc"
import { useToast } from "@/components/ui/use-toast"
import { Eye, EyeOff } from "lucide-react"

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const router = useRouter()
  const { toast } = useToast()

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      toast({
        title: "Missing fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        callbackUrl: "/",
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "Authentication failed",
          description: "Invalid email or password. Please check your credentials and try again.",
          variant: "destructive",
        })
      } else if (result?.url) {
        toast({
          title: "Welcome back!",
          description: "You have been successfully signed in.",
        })
        router.push(result.url)
      }
    } catch (error) {
      console.error("Login error:", error)
      toast({
        title: "Something went wrong",
        description: "There was a problem connecting to the authentication service. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true)
      const result = await signIn("google", {
        callbackUrl: "/",
        redirect: false,
      })

      if (result?.error) {
        toast({
          title: "Authentication failed",
          description: "There was a problem signing in with Google.",
          variant: "destructive",
        })
      } else if (result?.url) {
        router.push(result.url)
      }
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "There was a problem with the authentication service.",
        variant: "destructive",
      })
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Email and Password Form */}
      <form onSubmit={handleCredentialsSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleInputChange}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:border-white/40 pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white/80"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-white text-[#013060] hover:bg-white/90 font-medium"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#013060] border-t-transparent" />
              <span>Signing in...</span>
            </div>
          ) : (
            "Sign in"
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#013060] px-2 text-white/60">Or continue with</span>
        </div>
      </div>

      {/* Google Sign In */}
      <Button
        onClick={handleGoogleSignIn}
        disabled={isGoogleLoading}
        className="flex w-full items-center justify-center gap-2 bg-white text-black hover:bg-gray-100"
      >
        {isGoogleLoading ? (
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-500 border-t-transparent" />
        ) : (
          <FcGoogle className="h-5 w-5" />
        )}
        <span>Sign in with Google</span>
      </Button>
    </div>
  )
}
