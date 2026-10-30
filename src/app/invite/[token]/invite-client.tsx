"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { claimPersonInviteAction } from "@/features/members/actions"
import type { InviteInfo } from "@/features/members/service"

type InviteClientProps = {
  token: string
  info: InviteInfo
  isSignedIn: boolean
}

export default function InviteClient({ token, info, isSignedIn }: InviteClientProps) {
  const router = useRouter()

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState("")

  async function handleJoin() {
    try {
      setIsJoining(true)
      setError("")

      const result = await claimPersonInviteAction(token)

      if (!result.ok) {
        setError(result.message)
        return
      }

      toast.success("¡Bienvenido al sustito! 👻", { description: "Ya puedes ver tus gastos y tu balance." })
      router.push(`/trip/${result.tripId}`)
      router.refresh()
    } catch (error) {
      console.error(error)
      setError("No se pudo aceptar la invitación")
    } finally {
      setIsJoining(false)
    }
  }

  function openAuth(mode: "login" | "register") {
    setAuthMode(mode)
    setAuthOpen(true)
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <Image src="/scary-split-logo.png" alt="" width={96} height={96} />

      {info.status === "valid" ? (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">¡Te invitaron a un sustito!</h1>
            <p className="max-w-md text-muted-foreground">
              Te agregaron como <b>{info.personName}</b> en <b>&ldquo;{info.tripName}&rdquo;</b>. Únete para ver los
              gastos y cuánto debes o te deben.
            </p>
          </div>

          {isSignedIn ? (
            <Button disabled={isJoining} onClick={handleJoin}>
              {isJoining && <Loader2 className="animate-spin" />}
              Unirme como {info.personName}
            </Button>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Inicia sesión o crea una cuenta para aceptar.</p>

              <div className="flex justify-center gap-2">
                <Button variant="outline" onClick={() => openAuth("login")}>
                  Iniciar sesión
                </Button>

                <Button onClick={() => openAuth("register")}>Crear cuenta</Button>
              </div>
            </div>
          )}

          {error && <p className="max-w-md text-sm text-destructive">{error}</p>}
        </>
      ) : (
        <>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              {info.status === "used" && "Esta invitación ya fue usada"}
              {info.status === "expired" && "La invitación venció"}
              {info.status === "not-found" && "No encontramos la invitación"}
            </h1>

            <p className="max-w-md text-muted-foreground">
              {info.status === "not-found"
                ? "Revisa que el enlace esté completo o pide uno nuevo."
                : "Pide al dueño del sustito que te envíe una invitación nueva."}
            </p>
          </div>

          <Button nativeButton={false} render={<Link href="/" />}>
            Ir al inicio
          </Button>
        </>
      )}

      <AuthDialog key={authMode} open={authOpen} onOpenChange={setAuthOpen} initialMode={authMode} />
    </main>
  )
}
