"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ProfileUser } from "@/features/profile/types"
import { authClient } from "@/lib/auth-client"

type PersonalInfoCardProps = {
  user: ProfileUser
  hasGoogle: boolean
}

export function PersonalInfoCard({ user, hasGoogle }: PersonalInfoCardProps) {
  const router = useRouter()

  const [name, setName] = useState(user.name)
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const trimmedName = name.trim()
  const isUnchanged = trimmedName === user.name

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!trimmedName) {
      setError("El nombre es requerido")
      return
    }

    if (trimmedName.length > 100) {
      setError("El nombre es demasiado largo")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const result = await authClient.updateUser({ name: trimmedName })

      if (result.error) {
        setError(result.error.message || "No se pudo actualizar el nombre")
        return
      }

      toast.success("Perfil actualizado", { description: "Tu nombre se guardó correctamente." })
      router.refresh()
    } catch (error) {
      console.error(error)
      setError("No se pudo actualizar el nombre")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Información personal</CardTitle>
        <CardDescription>Así te ven tus amigos en Scary Split.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="profile-name">Nombre</Label>

            <Input
              id="profile-name"
              autoComplete="name"
              value={name}
              aria-invalid={!!error}
              disabled={isSaving}
              onChange={(event) => {
                setName(event.target.value)
                setError("")
              }}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="profile-email" className="flex items-center gap-1.5">
              Correo electrónico
              <Lock className="size-3 text-muted-foreground" />
            </Label>

            <Input id="profile-email" value={user.email} readOnly disabled />

            <p className="text-xs text-muted-foreground">
              {hasGoogle
                ? "Tu correo viene de tu cuenta de Google y no se puede cambiar aquí."
                : "Por seguridad, el correo no se puede modificar."}
            </p>
          </div>

          <Button type="submit" disabled={isSaving || isUnchanged}>
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Guardando
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
