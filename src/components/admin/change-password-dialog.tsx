"use client"

import { useState } from "react"
import { KeyRound, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { PasswordInput } from "@/components/ui/password-input"
import { changeOwnPasswordAction } from "@/features/admin/admins-actions"
import { ADMIN_PASSWORD_MIN_LENGTH } from "@/features/admin/admins-types"

export function ChangePasswordDialog() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-white hover:bg-white/15 hover:text-white"
        onClick={() => setOpen(true)}
      >
        <KeyRound />
        <span className="hidden sm:inline">Contraseña</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {open && <ChangePasswordForm onDone={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </>
  )
}

function ChangePasswordForm({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("")
  const [next, setNext] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (next !== confirm) {
      setError("Las contraseñas nuevas no coinciden")
      return
    }

    setPending(true)
    setError("")

    try {
      const result = await changeOwnPasswordAction({ currentPassword: current, newPassword: next })

      if (!result.ok) {
        setError(result.message)
        return
      }

      toast.success("Contraseña actualizada", { description: "Se cerraron tus otras sesiones abiertas." })
      onDone()
    } catch {
      setError("No se pudo cambiar la contraseña")
    } finally {
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Cambiar contraseña</DialogTitle>
        <DialogDescription>Mínimo {ADMIN_PASSWORD_MIN_LENGTH} caracteres.</DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="current-password">Contraseña actual</Label>
        <PasswordInput
          id="current-password"
          autoComplete="current-password"
          value={current}
          disabled={pending}
          onChange={(event) => setCurrent(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="next-password">Contraseña nueva</Label>
        <PasswordInput
          id="next-password"
          autoComplete="new-password"
          value={next}
          disabled={pending}
          onChange={(event) => setNext(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Repite la contraseña nueva</Label>
        <PasswordInput
          id="confirm-password"
          autoComplete="new-password"
          value={confirm}
          disabled={pending}
          onChange={(event) => setConfirm(event.target.value)}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending && <Loader2 className="animate-spin" />}
        Guardar contraseña
      </Button>
    </form>
  )
}
