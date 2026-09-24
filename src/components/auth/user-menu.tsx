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

import { authClient } from "@/lib/auth-client"

export function UserMenu() {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  if (!session) {
    return null
  }

  async function handleSignOut() {
    await authClient.signOut()
    router.refresh()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="max-w-48">
            <UserRound className="size-4" />
            <span className="truncate">{session.user.name}</span>
          </Button>
        }
      />

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <UserRound className="size-4" />
          Perfil
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="size-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
