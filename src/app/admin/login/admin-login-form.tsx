"use client"

import { useActionState } from "react"
import Image from "next/image"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { loginAdminAction, type AdminLoginState } from "@/features/admin/auth-actions"

const initialState: AdminLoginState = {}

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdminAction, initialState)

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="items-center text-center">
        <Image src="/scary-split-logo.png" alt="Scary Split" width={48} height={48} />

        <CardTitle className="font-heading text-xl">Panel de administración</CardTitle>
        <CardDescription>Acceso solo para administradores.</CardDescription>
      </CardHeader>

      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Correo electrónico</Label>

            <Input
              id="admin-email"
              name="email"
              type="email"
              autoComplete="username"
              defaultValue={state.email}
              required
              disabled={pending}
              aria-invalid={!!state.error}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admin-password">Contraseña</Label>

            <PasswordInput
              id="admin-password"
              name="password"
              autoComplete="current-password"
              required
              disabled={pending}
              aria-invalid={!!state.error}
            />
          </div>

          {state.error && <p className="text-sm text-destructive">{state.error}</p>}

          <Button type="submit" className="w-full" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
