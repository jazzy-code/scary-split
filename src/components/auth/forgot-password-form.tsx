"use client"

import { useState } from "react"
import { Loader2, MailCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

type ForgotPasswordFormProps = {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const result = await authClient.requestPasswordReset({
        email: email.trim(),
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (result.error) {
        setError(result.error.message || "No se pudo enviar el correo")
        return
      }

      setIsSent(true)
    } catch (error) {
      console.error(error)
      setError("No se pudo enviar el correo")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSent) {
    return (
      <div className="space-y-4 text-center">
        <MailCheck className="mx-auto size-12 text-[#4a2a8f]" />

        <div className="space-y-1">
          <p className="font-medium">Revisa tu correo</p>
          <p className="text-sm text-muted-foreground">
            Si existe una cuenta con <b>{email.trim()}</b>, te enviamos un enlace para elegir una nueva contraseña. Es
            válido por 1 hora.
          </p>
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={onBack}>
          Volver a iniciar sesión
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="forgot-email">Correo electrónico</Label>

        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          value={email}
          aria-invalid={!!error}
          disabled={isLoading}
          onChange={(event) => {
            setEmail(event.target.value)
            setError("")
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Enviando
          </>
        ) : (
          "Enviar enlace"
        )}
      </Button>

      <button
        type="button"
        className="w-full text-center text-sm text-muted-foreground underline underline-offset-4"
        onClick={onBack}
        disabled={isLoading}
      >
        Volver a iniciar sesión
      </button>
    </form>
  )
}
