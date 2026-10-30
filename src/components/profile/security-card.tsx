"use client"

import { useState } from "react"
import { Loader2, LogOut } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { AddPasswordForm } from "./add-password-form"
import { authClient } from "@/lib/auth-client"

type SecurityCardProps = {
  hasPassword: boolean
}

export function SecurityCard({ hasPassword }: SecurityCardProps) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)
  const [isRevoking, setIsRevoking] = useState(false)

  async function handleChangePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentPassword) {
      setError("Ingresa tu contraseña actual")
      return
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const result = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      })

      if (result.error) {
        setError(result.error.message || "No se pudo cambiar la contraseña")
        return
      }

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      toast.success("Contraseña actualizada", { description: "Cerramos tu sesión en los demás dispositivos." })
    } catch (error) {
      console.error(error)
      setError("No se pudo cambiar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleRevokeOtherSessions() {
    try {
      setIsRevoking(true)

      const result = await authClient.revokeOtherSessions()

      if (result.error) {
        toast.error("No se pudieron cerrar las otras sesiones")
        return
      }

      toast.success("Listo", { description: "Cerramos tu sesión en los demás dispositivos." })
    } catch (error) {
      console.error(error)
      toast.error("No se pudieron cerrar las otras sesiones")
    } finally {
      setIsRevoking(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seguridad</CardTitle>
        <CardDescription>Protege el acceso a tu cuenta.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {hasPassword ? (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>

              <PasswordInput
                id="current-password"
                autoComplete="current-password"
                value={currentPassword}
                aria-invalid={!!error}
                disabled={isSaving}
                onChange={(event) => {
                  setCurrentPassword(event.target.value)
                  setError("")
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva contraseña</Label>

                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={newPassword}
                  aria-invalid={!!error}
                  disabled={isSaving}
                  onChange={(event) => {
                    setNewPassword(event.target.value)
                    setError("")
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar contraseña</Label>

                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  aria-invalid={!!error}
                  disabled={isSaving}
                  onChange={(event) => {
                    setConfirmPassword(event.target.value)
                    setError("")
                  }}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Guardando
                </>
              ) : (
                "Cambiar contraseña"
              )}
            </Button>
          </form>
        ) : (
          <AddPasswordForm />
        )}

        <Separator />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-medium">Sesiones activas</p>
            <p className="text-sm text-muted-foreground">Cierra tu sesión en todos los demás dispositivos.</p>
          </div>

          <Button type="button" variant="outline" disabled={isRevoking} onClick={handleRevokeOtherSessions}>
            {isRevoking ? <Loader2 className="animate-spin" /> : <LogOut />}
            Cerrar otras sesiones
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
