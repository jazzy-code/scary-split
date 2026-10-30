"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Drip } from "@/components/trips/drip"
import { authClient } from "@/lib/auth-client"

const AUTO_CLOSE_MS = 8000
// Una cuenta se considera recién creada durante este margen; así no se muestra a quien solo inicia sesión.
const NEW_ACCOUNT_WINDOW_MS = 2 * 60 * 1000

const sparkles = [
  { className: "top-6 left-6 size-4", delay: "0s" },
  { className: "top-16 left-1/4 size-3", delay: "0.6s" },
  { className: "top-8 right-1/3 size-3.5", delay: "1.1s" },
  { className: "bottom-24 left-8 size-3", delay: "1.6s" },
  { className: "bottom-20 right-10 size-4", delay: "0.3s" }
]

function storageKey(userId: string) {
  return `welcome-shown:${userId}`
}

export function WelcomeDialog() {
  const { data: session } = authClient.useSession()
  const [open, setOpen] = useState(false)

  const userId = session?.user.id
  const createdAt = session?.user.createdAt

  useEffect(() => {
    if (!userId || !createdAt) {
      return
    }

    if (Date.now() - new Date(createdAt).getTime() > NEW_ACCOUNT_WINDOW_MS) {
      return
    }

    try {
      if (localStorage.getItem(storageKey(userId))) {
        return
      }

      localStorage.setItem(storageKey(userId), "1")
    } catch {
      // Sin localStorage se muestra igualmente; en el peor caso aparece una vez más durante el margen de tiempo.
    }

    // Se sincroniza con un sistema externo (localStorage y la sesión), por eso el estado se actualiza aquí
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOpen(true)
  }, [userId, createdAt])

  useEffect(() => {
    if (!open) {
      return
    }

    const timeout = setTimeout(() => setOpen(false), AUTO_CLOSE_MS)

    return () => clearTimeout(timeout)
  }, [open])

  const firstName = session?.user.name.trim().split(" ")[0]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden border-0 bg-gradient-to-br from-[#24124d] via-[#4a2a8f] to-[#8b5cf6] p-0 text-white sm:max-w-md"
      >
        <Drip color="#c4b5fd" className="h-20 w-36" />

        {sparkles.map((sparkle) => (
          <span
            key={sparkle.className}
            aria-hidden
            className={`animate-twinkle pointer-events-none absolute rounded-full bg-amber-300 motion-reduce:animate-none ${sparkle.className}`}
            style={{ animationDelay: sparkle.delay }}
          />
        ))}

        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="absolute top-2 left-2 z-10 bg-none text-white hover:bg-white/20 hover:text-white"
            />
          }
        >
          <X className="size-4" />
          <span className="sr-only">Cerrar</span>
        </DialogClose>

        <div className="relative flex flex-col items-center px-6 pt-12 pb-8 text-center">
          <Image
            src="/scary-split-logo.png"
            alt=""
            width={140}
            height={140}
            priority
            className="animate-float size-36 drop-shadow-xl motion-reduce:animate-none"
          />

          <DialogTitle className="mt-4 text-3xl font-bold tracking-tight">¡Bienvenido a la casa del susto!</DialogTitle>

          <DialogDescription className="mt-2 text-base text-white/85">
            {firstName ? `Hola, ${firstName}. ` : ""}Aquí los sustitos de gastos dan menos miedo. Crea tu primer
            sustito y deja que nosotros hagamos las cuentas. 👻
          </DialogDescription>
        </div>

        <div className="h-1.5 w-full bg-white/15" aria-hidden>
          <div
            className="animate-countdown h-full origin-left bg-amber-300"
            style={{ animationDuration: `${AUTO_CLOSE_MS}ms` }}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
