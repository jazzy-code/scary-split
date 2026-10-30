"use client"

import { useState } from "react"
import { Link2, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPersonInviteAction } from "@/features/members/actions"
import { copyToClipboard } from "@/lib/clipboard"
import type { Person } from "@/lib/expenses/types"

type InvitePersonDialogProps = {
  tripId: string
  person: Person | null
  onClose: () => void
}

export function InvitePersonDialog({ tripId, person, onClose }: InvitePersonDialogProps) {
  return (
    <Dialog
      open={!!person}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {/* Se remonta por participante para empezar con su correo guardado */}
        {person && <InviteForm key={person.id} tripId={tripId} person={person} onClose={onClose} />}
      </DialogContent>
    </Dialog>
  )
}

function InviteForm({ tripId, person, onClose }: { tripId: string; person: Person; onClose: () => void }) {
  const [email, setEmail] = useState(person.email ?? "")
  const [error, setError] = useState("")
  const [pending, setPending] = useState<"copy" | "email" | null>(null)

  const trimmedEmail = email.trim()

  async function createInvite(shouldSendEmail: boolean) {
    const result = await createPersonInviteAction({
      tripId,
      personId: person.id,
      email: trimmedEmail || undefined,
      sendEmail: shouldSendEmail
    })

    if (!result.ok) {
      throw new Error(result.message)
    }

    return result.token
  }

  async function handleCopy() {
    try {
      setPending("copy")
      setError("")

      const origin = window.location.origin

      await copyToClipboard(createInvite(false).then((token) => `${origin}/invite/${token}`))

      toast.success("¡Enlace copiado! 👻", {
        description: `Envíaselo a ${person.name}. Sirve una sola vez y vence en 7 días.`
      })
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo crear la invitación")
    } finally {
      setPending(null)
    }
  }

  async function handleSendEmail() {
    if (!trimmedEmail) {
      setError("Escribe el correo de la persona para enviarle la invitación")
      return
    }

    try {
      setPending("email")
      setError("")

      await createInvite(true)

      toast.success("Invitación enviada", { description: `Le escribimos a ${trimmedEmail}.` })
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo enviar la invitación")
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="space-y-4">
      <DialogHeader>
        <DialogTitle>Invitar a {person.name}</DialogTitle>

        <DialogDescription>
          Cuando {person.name} abra la invitación y la acepte, este sustito aparecerá en su cuenta y verá cuánto debe o
          le deben.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="invite-email">Correo (opcional)</Label>

        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          placeholder="amigo@correo.com"
          value={email}
          aria-invalid={!!error}
          disabled={pending !== null}
          onChange={(event) => {
            setEmail(event.target.value)
            setError("")
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" variant="outline" className="flex-1" disabled={pending !== null} onClick={handleCopy}>
          {pending === "copy" ? <Loader2 className="animate-spin" /> : <Link2 />}
          Copiar enlace
        </Button>

        <Button type="button" className="flex-1" disabled={pending !== null} onClick={handleSendEmail}>
          {pending === "email" ? <Loader2 className="animate-spin" /> : <Mail />}
          Enviar por correo
        </Button>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        <p>Cada enlace nuevo anula el anterior.</p>
        <p>Si envías la invitación por correo, avísale que revise su carpeta de spam si no la encuentra.</p>
      </div>
    </div>
  )
}
