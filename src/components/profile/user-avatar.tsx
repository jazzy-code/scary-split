"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

type UserAvatarProps = {
  name: string
  image?: string | null
  size?: "default" | "sm" | "lg"
  className?: string
}

export function UserAvatar({ name, image, size = "default", className }: UserAvatarProps) {
  return (
    <Avatar size={size} className={className}>
      {/* Google bloquea la imagen si se envía el referrer de nuestro sitio */}
      {image && <AvatarImage src={image} alt={name} referrerPolicy="no-referrer" />}

      <AvatarFallback
        className={cn("bg-gradient-to-br from-[#8b5cf6] to-[#4a2a8f] font-heading font-bold text-white", className)}
      >
        {name.trim().charAt(0).toUpperCase() || "?"}
      </AvatarFallback>
    </Avatar>
  )
}
