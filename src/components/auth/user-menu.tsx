"use client"

import { useRouter } from "next/navigation"
import { LogOut, UserRound } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { UserAvatar } from "@/components/profile/user-avatar"

import { authClient } from "@/lib/auth-client"

export function UserMenu() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  if (!session) {
    return null
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="max-w-48 gap-2">
            <UserAvatar name={session.user.name} image={session.user.image} size="sm" />
            <span className="truncate">{session.user.name}</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/profile")} className="cursor-pointer">
          <UserRound className="size-4" />
          Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
