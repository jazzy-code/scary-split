import { BadgeCheck, Crown } from "lucide-react"

import { Tip } from "@/components/ui/tip"
import type { Person } from "@/lib/expenses/types"

export function PersonStatus({ person, isViewer }: { person: Person; isViewer: boolean }) {
  return (
    <>
      {isViewer && (
        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Tú</span>
      )}

      {person.memberRole === "OWNER" && (
        // tabIndex permite abrir el tooltip con el teclado o al tocar en móvil
        <Tip label="Dueño: administra el sustito e invita a otros">
          <span tabIndex={0} role="img" aria-label="Dueño del sustito" className="cursor-help outline-none">
            <Crown className="size-3.5 text-amber-500" />
          </span>
        </Tip>
      )}

      {person.linked && (
        <Tip label="Cuenta vinculada: ya se unió con su cuenta">
          <span tabIndex={0} role="img" aria-label="Cuenta vinculada" className="cursor-help outline-none">
            <BadgeCheck className="size-3.5 text-emerald-500" />
          </span>
        </Tip>
      )}
    </>
  )
}
