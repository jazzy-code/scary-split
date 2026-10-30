import { BadgeCheck, Crown } from "lucide-react"

import type { Person } from "@/lib/expenses/types"

export function PersonStatus({ person, isViewer }: { person: Person; isViewer: boolean }) {
  return (
    <>
      {isViewer && (
        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">Tú</span>
      )}

      {person.memberRole === "OWNER" && (
        <span title="Dueño del sustito" aria-label="Dueño del sustito">
          <Crown className="size-3.5 text-amber-500" />
        </span>
      )}

      {person.linked && (
        <span title="Cuenta vinculada" aria-label="Cuenta vinculada">
          <BadgeCheck className="size-3.5 text-emerald-500" />
        </span>
      )}
    </>
  )
}
