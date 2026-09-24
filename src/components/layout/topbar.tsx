"use client"

import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { authClient } from "@/lib/auth-client"

export function Topbar() {
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const { data: session, isPending } = authClient.useSession()

  function openLogin() {
    setAuthMode("login")
    setAuthOpen(true)
  }

  function openRegister() {
    setAuthMode("register")
    setAuthOpen(true)
  }

  return (
    <>
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <div className="flex items-center">
            <Image src="/scary-split-logo.png" alt="Scary Split" width={32} height={32} />

            <span className="ml-2 text-lg font-semibold">Scary Split</span>
          </div>

          {!isPending && (
            <div className="flex items-center gap-2">
              {session ? (
                <UserMenu />
              ) : (
                <>
                  <Button variant="ghost" onClick={openLogin}>
                    Iniciar sesión
                  </Button>

                  <Button onClick={openRegister}>Registrarme</Button>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <AuthDialog
        key={authMode}
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
      />
    </>
  )
}
