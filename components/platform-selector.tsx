"use client"

import type React from "react"
import { Check, Linkedin, Twitter, Facebook, Globe, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Platform } from "@/lib/types"

interface PlatformSelectorProps {
  selectedPlatforms: Platform[]
  onChange: (platforms: Platform[]) => void
}

export function PlatformSelector({ selectedPlatforms, onChange }: PlatformSelectorProps) {
  const togglePlatform = (platform: Platform) => {
    if (selectedPlatforms.includes(platform)) {
      onChange(selectedPlatforms.filter((p) => p !== platform))
    } else {
      onChange([...selectedPlatforms, platform])
    }
  }

  const platforms: { id: Platform; name: string; icon: React.ReactNode }[] = [
    {
      id: "website",
      name: "Website",
      icon: <Globe className="h-4 w-4" />,
    },
    {
      id: "linkedin",
      name: "LinkedIn",
      icon: <Linkedin className="h-4 w-4" />,
    },
    {
      id: "twitter",
      name: "Twitter",
      icon: <Twitter className="h-4 w-4" />,
    },
    {
      id: "facebook",
      name: "Facebook",
      icon: <Facebook className="h-4 w-4" />,
    },
    {
      id: "instagram",
      name: "Instagram",
      icon: <Instagram className="h-4 w-4" />,
    },
  ]

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium mb-2">Select platforms to publish to:</p>
      <div className="flex flex-wrap gap-2">
        {platforms.map((platform) => {
          const isSelected = selectedPlatforms.includes(platform.id)
          return (
            <Button
              key={platform.id}
              type="button"
              variant={isSelected ? "default" : "outline"}
              size="sm"
              onClick={() => togglePlatform(platform.id)}
              className={cn("flex items-center gap-1", isSelected ? "bg-blue-600 hover:bg-blue-700" : "")}
            >
              {platform.icon}
              <span>{platform.name}</span>
              {isSelected && <Check className="h-3 w-3 ml-1" />}
            </Button>
          )
        })}
      </div>
    </div>
  )
}
