"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { authClient } from "@/lib/auth-client"

type RegisterFormProps = {
  onAuthenticated: () => void
  onLogin: () => void
}

export function RegisterForm({ onAuthenticated, onLogin }: RegisterFormProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!name.trim()) {
      setError("El nombre es requerido")
      return
    }

    if (!email.trim()) {
      setError("El correo electrónico es requerido")
      return
    }

    if (!password) {
      setError("La contraseña es requerida")
      return
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres")
      return
    }

    try {
      setIsLoading(true)
      setError("")

      const result = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password
      })

      if (result.error) {
        setError(result.error.message || "No se pudo crear la cuenta")
        return
      }

      onAuthenticated()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo crear la cuenta")
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
        setError(result.error.message || "No se pudo continuar con Google")
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo continuar con Google")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="register-name">Nombre</Label>

          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            value={name}
            aria-invalid={!!error}
            disabled={isLoading}
            onChange={(event) => {
              setName(event.target.value)
              setError("")
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-email">Correo electrónico</Label>

          <Input
            id="register-email"
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
          <Label htmlFor="register-password">Contraseña</Label>

          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
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
          {isLoading ? "Creando cuenta..." : "Registrarme"}
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
        ¿Ya tienes una cuenta?{" "}
        <button
          type="button"
          className="font-medium text-foreground underline underline-offset-4"
          onClick={onLogin}
          disabled={isLoading}
        >
          Inicia sesión
        </button>
      </p>
    </div>
  )
}
