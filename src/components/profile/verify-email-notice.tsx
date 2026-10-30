"use client"

import { useEffect, useState } from "react"
import { Loader2, MailWarning } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

const RESEND_COOLDOWN_SECONDS = 60

export function VerifyEmailNotice({ email }: { email: string }) {
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) {
      return
    }

    const timeout = setTimeout(() => setCooldown((current) => current - 1), 1000)

    return () => clearTimeout(timeout)
  }, [cooldown])

  async function handleResend() {
    try {
      setIsSending(true)

      const result = await authClient.sendVerificationEmail({
        email,
        callbackURL: `${window.location.origin}/profile`
      })

      if (result.error) {
        toast.error("No se pudo enviar el correo", { description: result.error.message })
        return
      }

      toast.success("Correo enviado", { description: `Revisa la bandeja de ${email}.` })
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo enviar el correo")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <MailWarning className="mt-0.5 size-5 shrink-0 text-amber-600" />

        <div className="min-w-0">
          <p className="font-medium text-amber-950">Verifica tu correo</p>
          <p className="text-sm text-amber-900/80">
            Confirma <b className="break-all">{email}</b> para poder recuperar tu contraseña y vincular Google.
          </p>
        </div>
      </div>

      <Button type="button" variant="outline" size="sm" disabled={isSending || cooldown > 0} onClick={handleResend}>
        {isSending && <Loader2 className="animate-spin" />}
        {cooldown > 0 ? `Reenviar en ${cooldown}s` : "Reenviar correo"}
      </Button>
    </div>
  )
}
