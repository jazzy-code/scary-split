"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import { ForgotPasswordForm } from "./forgot-password-form"
import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

type AuthMode = "login" | "register" | "forgot-password"

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
  onAuthenticated?: () => void
}

const titles: Record<AuthMode, string> = {
  login: "Inicia sesión",
  register: "Crea tu cuenta",
  "forgot-password": "Recupera tu contraseña"
}

const descriptions: Record<AuthMode, string> = {
  login: "Inicia sesión para crear, guardar y compartir tus sustitos.",
  register: "Regístrate para crear, guardar y compartir tus sustitos con tus amigos.",
  "forgot-password": "Te enviaremos un enlace por correo para elegir una nueva contraseña."
}

export function AuthDialog({ open, onOpenChange, initialMode = "login", onAuthenticated }: AuthDialogProps) {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>(initialMode)

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setMode(initialMode)
    }
  }

  function handleAuthenticated() {
    onOpenChange(false)
    // Los server components (lista de sustitos, acceso al trip) se renderizaron sin sesión
    router.refresh()
    onAuthenticated?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{titles[mode]}</DialogTitle>

          <DialogDescription>{descriptions[mode]}</DialogDescription>
        </DialogHeader>

        {mode === "login" && (
          <LoginForm
            onAuthenticated={handleAuthenticated}
            onRegister={() => setMode("register")}
            onForgotPassword={() => setMode("forgot-password")}
          />
        )}

        {mode === "register" && <RegisterForm onAuthenticated={handleAuthenticated} onLogin={() => setMode("login")} />}

        {mode === "forgot-password" && <ForgotPasswordForm onBack={() => setMode("login")} />}
      </DialogContent>
    </Dialog>
  )
}
