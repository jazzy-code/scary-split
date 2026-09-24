"use client"

import Image from "next/image"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import { AuthDialog } from "@/components/auth/auth-dialog"
import { UserMenu } from "@/components/auth/user-menu"
import { authClient } from "@/lib/auth-client"
import Link from "next/link"

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
    <header className="sticky top-0 z-50 border-b bg-[#341F66]/95 text-white shadow-[0_2px_8px_rgba(0,0,0,0.14)] backdrop-blur supports-[backdrop-filter]:bg-[#341F66]/80">
        <div className="mx-auto flex h-14 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center">
            <Image src="/scary-split-logo.png" alt="Scary Split" width={32} height={32} />

            <span className="ml-2 text-lg font-semibold">Scary Split</span>
          </Link>

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
