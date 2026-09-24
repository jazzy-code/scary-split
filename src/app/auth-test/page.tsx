"use client"

import { useState } from "react"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"

export default function AuthTestPage() {
  const [open, setOpen] = useState(false)

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="space-y-4 text-center">
        <h1 className="text-2xl font-bold">Auth Test</h1>

        <Button onClick={() => setOpen(true)}>Abrir autenticación</Button>

        <AuthDialog open={open} onOpenChange={setOpen} />
      </div>
    </main>
  )
}
