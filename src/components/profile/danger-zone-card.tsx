"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"

const CONFIRMATION_WORD = "ELIMINAR"

type DangerZoneCardProps = {
  hasPassword: boolean
}

export function DangerZoneCard({ hasPassword }: DangerZoneCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <Card className="ring-2 ring-destructive/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlert className="size-5" />
          Zona de peligro
        </CardTitle>
        <CardDescription>Acciones permanentes que no se pueden deshacer.</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <div className="min-w-0">
            <p className="font-medium">Eliminar mi cuenta</p>
            <p className="text-sm text-muted-foreground">
              Se borrarán tu cuenta y los sustitos donde eres el único participante.
            </p>
          </div>

          <Button
            type="button"
            variant="destructive"
            className="bg-destructive text-white hover:bg-destructive/90"
            onClick={() => setOpen(true)}
          >
            Eliminar cuenta
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          {/* Se remonta al abrir para empezar siempre con el formulario limpio */}
          {open && <DeleteAccountForm hasPassword={hasPassword} onClose={() => setOpen(false)} />}
        </DialogContent>
      </Dialog>
    </Card>
  )
}

function DeleteAccountForm({ hasPassword, onClose }: DangerZoneCardProps & { onClose: () => void }) {
  const router = useRouter()

  const [confirmation, setConfirmation] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const canSubmit = confirmation === CONFIRMATION_WORD && (!hasPassword || password.length > 0)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    try {
      setIsDeleting(true)
      setError("")

      const result = await authClient.deleteUser(hasPassword ? { password } : {})

      if (result.error) {
        setError(
          result.error.code === "SESSION_EXPIRED"
            ? "Por seguridad, cierra sesión e inicia de nuevo antes de eliminar tu cuenta."
            : result.error.message || "No se pudo eliminar la cuenta"
        )
        return
      }

      toast.success("Tu cuenta fue eliminada", { description: "¡Hasta pronto! 👻" })
      router.push("/")
      router.refresh()
    } catch (error) {
      console.error(error)
      setError("No se pudo eliminar la cuenta")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>¿Eliminar tu cuenta?</DialogTitle>

        <DialogDescription>
          Esta acción es permanente. Se eliminarán tu cuenta y los sustitos donde eres el único participante. Si
          compartiste un sustito con otras personas con un enlace, dejarán de tener acceso.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="delete-confirmation">
          Escribe <b>{CONFIRMATION_WORD}</b> para confirmar
        </Label>

        <Input
          id="delete-confirmation"
          autoComplete="off"
          value={confirmation}
          disabled={isDeleting}
          onChange={(event) => {
            setConfirmation(event.target.value)
            setError("")
          }}
        />
      </div>

      {hasPassword && (
        <div className="space-y-2">
          <Label htmlFor="delete-password">Tu contraseña</Label>

          <PasswordInput
            id="delete-password"
            autoComplete="current-password"
            value={password}
            aria-invalid={!!error}
            disabled={isDeleting}
            onChange={(event) => {
              setPassword(event.target.value)
              setError("")
            }}
          />
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isDeleting} onClick={onClose}>
          Cancelar
        </Button>

        <Button
          type="submit"
          className="bg-none bg-destructive text-white hover:bg-destructive/90"
          disabled={!canSubmit || isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Eliminando
            </>
          ) : (
            "Eliminar definitivamente"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}
