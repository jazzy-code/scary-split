"use client"

import { useState } from "react"
import Image from "next/image"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authClient } from "@/lib/auth-client"

type LinkedAccountsCardProps = {
  hasGoogle: boolean
  hasPassword: boolean
}

export function LinkedAccountsCard({ hasGoogle, hasPassword }: LinkedAccountsCardProps) {
  const [isLinking, setIsLinking] = useState(false)

  async function handleLinkGoogle() {
    try {
      setIsLinking(true)

      const result = await authClient.linkSocial({
        provider: "google",
        callbackURL: `${window.location.origin}/profile`
      })

      if (result.error) {
        toast.error("No se pudo vincular Google", { description: result.error.message })
        setIsLinking(false)
      }
    } catch (error) {
      console.error(error)
      toast.error("No se pudo vincular Google")
      setIsLinking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cuentas vinculadas</CardTitle>
        <CardDescription>Los métodos con los que puedes iniciar sesión.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <Image src="/google-icon.png" alt="" width={20} height={20} />
            </span>

            <div className="min-w-0">
              <p className="font-medium">Google</p>
              <p className="text-xs text-muted-foreground">
                {hasGoogle ? "Inicias sesión con tu cuenta de Google." : "Inicia sesión con un solo clic."}
              </p>
            </div>
          </div>

          {hasGoogle ? (
            <Badge className="bg-emerald-100 text-emerald-700">Vinculada</Badge>
          ) : (
            <Button type="button" variant="outline" size="sm" disabled={isLinking} onClick={handleLinkGoogle}>
              {isLinking && <Loader2 className="animate-spin" />}
              Vincular
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 rounded-xl border p-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
              <KeyRound className="size-4" />
            </span>

            <div className="min-w-0">
              <p className="font-medium">Correo y contraseña</p>
              <p className="text-xs text-muted-foreground">
                {hasPassword ? "Puedes entrar con tu correo y contraseña." : "No tienes una contraseña configurada."}
              </p>
            </div>
          </div>

          <Badge variant={hasPassword ? "default" : "secondary"} className={hasPassword ? "bg-emerald-100 text-emerald-700" : ""}>
            {hasPassword ? "Activa" : "No configurada"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  )
}
