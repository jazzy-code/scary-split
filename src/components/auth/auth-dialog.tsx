"use client"

import { useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

import { LoginForm } from "./login-form"
import { RegisterForm } from "./register-form"

type AuthMode = "login" | "register"

type AuthDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialMode?: AuthMode
  onAuthenticated?: () => void
}

export function AuthDialog({ open, onOpenChange, initialMode = "login", onAuthenticated }: AuthDialogProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  function handleOpenChange(nextOpen: boolean) {
    onOpenChange(nextOpen)

    if (!nextOpen) {
      setMode(initialMode)
    }
  }

  function handleAuthenticated() {
    onOpenChange(false)
    onAuthenticated?.()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "Inicia sesión" : "Crea tu cuenta"}</DialogTitle>

          <DialogDescription>
            {mode === "login"
              ? "Inicia sesión para crear, guardar y compartir tus sustitos."
              : "Regístrate para crear, guardar y compartir tus sustitos con tus amigos."}
          </DialogDescription>
        </DialogHeader>

        {mode === "login" ? (
          <LoginForm onAuthenticated={handleAuthenticated} onRegister={() => setMode("register")} />
        ) : (
          <RegisterForm onAuthenticated={handleAuthenticated} onLogin={() => setMode("login")} />
        )}
      </DialogContent>
    </Dialog>
  )
}
