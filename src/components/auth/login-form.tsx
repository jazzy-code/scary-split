"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { authClient } from "@/lib/auth-client"

type LoginFormProps = {
  onAuthenticated: () => void
  onRegister: () => void
}

export function LoginForm({ onAuthenticated, onRegister }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }

    if (!password) {
      setError("La contraseña es requerida")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const result = await authClient.signIn.email({
        email: email.trim(),
        password
      })

      if (result.error) {
        setError(result.error.message || "No se pudo iniciar sesión")
        return
      }

      onAuthenticated()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    try {
      setIsLoading(true)
      setError("")

      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.href
      })

      if (result.error) {
        setError(result.error.message || "No se pudo iniciar sesión con Google")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo iniciar sesión con Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Correo electrónico</Label>

          <Input
            id="login-email"
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="login-password">Contraseña</Label>

          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            aria-invalid={!!error}
            disabled={isLoading}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar sesión"}
        </Button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>

        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">o</span>
        </div>
      </div>

      <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
        Continuar con Google
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={onRegister}
          disabled={isLoading}
        >
          Regístrate
        </button>
      </p>
    </div>
  )
}
