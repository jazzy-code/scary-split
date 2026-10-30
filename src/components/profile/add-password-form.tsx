"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { setPasswordAction } from "@/features/profile/actions"

export function AddPasswordForm() {
  const router = useRouter()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }

    try {
      setIsSaving(true)
      setError("")

      const result = await setPasswordAction(password)

      if (!result.ok) {
        setError(result.message)
        return
      }

      toast.success("Contraseña agregada", {
        description: "Ya puedes iniciar sesión con tu correo y contraseña en cualquier dispositivo."
      })

      // Vuelve a pedir los datos del servidor para que la tarjeta pase al formulario de cambio de contraseña
      router.refresh()
    } catch (error) {
      console.error(error)
      setError("No se pudo agregar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Inicias sesión con Google. Agrega una contraseña para entrar también con tu correo, por ejemplo desde un
        dispositivo donde no tengas tu cuenta de Google.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="add-password">Contraseña</Label>

          <PasswordInput
            id="add-password"
            autoComplete="new-password"
            value={password}
            aria-invalid={!!error}
            disabled={isSaving}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="add-password-confirm">Confirmar contraseña</Label>

          <PasswordInput
            id="add-password-confirm"
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
          "Agregar contraseña"
        )}
      </Button>
    </form>
  )
}
