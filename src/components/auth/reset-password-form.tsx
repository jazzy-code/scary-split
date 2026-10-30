"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { authClient } from "@/lib/auth-client"

type ResetPasswordFormProps = {
  token: string
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
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

      const result = await authClient.resetPassword({ newPassword: password, token })

      if (result.error) {
        setError(result.error.message || "El enlace no es válido o ya expiró")
        return
      }

      toast.success("Contraseña actualizada", { description: "Ya puedes iniciar sesión con tu nueva contraseña." })
      router.push("/")
    } catch (error) {
      console.error(error)
      setError("No se pudo actualizar la contraseña")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="reset-password">Nueva contraseña</Label>

        <PasswordInput
          id="reset-password"
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
        <Label htmlFor="reset-password-confirm">Confirmar contraseña</Label>

        <PasswordInput
          id="reset-password-confirm"
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

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Guardando
          </>
        ) : (
          "Restablecer contraseña"
        )}
      </Button>
    </form>
  )
}
