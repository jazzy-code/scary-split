"use client"

import Image from "next/image"
import { ArrowRight } from "lucide-react"

import type {
  Person,
  Settlement,
} from "@/lib/expenses/types"
import { getAvatarColor } from "@/components/trips/trip-theme"
import { cn, formatNumber } from "@/lib/utils"

type SettlementListProps = {
  people: Person[]
  settlements: Settlement[]
}

function PersonChip({ person }: { person?: Person }) {
  const name = person?.name ?? "Desconocido"

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          person ? getAvatarColor(person.id) : "bg-muted-foreground"
        )}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>

      <span className="truncate font-medium">{name}</span>
    </span>
  )
}

export function SettlementList({
  people,
  settlements,
}: SettlementListProps) {
  function getPerson(id: string) {
    return people.find((person) => person.id === id)
  }

  if (settlements.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-violet-300 bg-white/60 p-6 text-center">
        <Image src="/scary-split-logo.png" alt="" width={72} height={72} />

        <p className="mt-2 font-heading text-lg font-semibold">
          ¡Todo saldado! 👻
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          No hay transferencias pendientes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement, index) => (
        <div
          key={`${settlement.from}-${settlement.to}-${index}`}
          className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-violet-200"
        >
          <div className="flex min-w-0 items-center gap-2">
            <PersonChip person={getPerson(settlement.from)} />

            <ArrowRight className="size-4 shrink-0 text-violet-500" />

            <PersonChip person={getPerson(settlement.to)} />
          </div>

          <p className="rounded-full bg-amber-300 px-3 py-1 text-sm font-extrabold text-[#24124d] shadow-sm">
            ${formatNumber(settlement.amount)}
          </p>
        </div>
      ))}
    </div>
  )
}
