import Image from "next/image"
import Link from "next/link"
import { CalendarDays, Coins, LogOut, Receipt, Trash2, UserRoundCheck, Users } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import type { Trip } from "@/lib/expenses/types"
import { cn, formatNumber } from "@/lib/utils"

import { isTripSettled } from "@/lib/expenses/is-trip-settled"

import { Drip } from "./drip"
import { SettledBadge } from "./settled-badge"
import { ViewerBalanceBadge } from "./viewer-balance-badge"
import { getTripTheme } from "./trip-theme"

type TripCardProps = {
  trip: Trip
  totalSpent: number
  onDelete: (trip: Trip) => void
  onLeave: (trip: Trip) => void
}

export function TripCard({ trip, totalSpent, onDelete, onLeave }: TripCardProps) {
  const theme = getTripTheme(totalSpent)
  const isSettled = isTripSettled(trip)
  const isOwner = trip.viewer.role === "OWNER"

  return (
    <div
      className={cn(
        "group relative flex min-h-56 flex-col overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-md ring-1 ring-black/10",
        "transition duration-200 hover:-translate-y-1 hover:rotate-[0.6deg] hover:shadow-xl",
        isSettled && "opacity-70 hover:opacity-100",
        theme.background
      )}>
      <Link
        href={`/trip/${trip.id}`}
        aria-label={`Abrir ${trip.name}`}
        className="absolute inset-0 z-10 rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-white"
      />

      <Drip color={theme.drip} />

      <Image
        src="/scary-split-logo.png"
        alt=""
        width={120}
        height={120}
        className="pointer-events-none absolute -right-3 -bottom-4 size-28 rotate-6 opacity-25 transition duration-200 group-hover:-rotate-3 group-hover:opacity-40"
      />

      {isSettled && <SettledBadge className="relative mb-2 self-start" />}

      <h3 className="line-clamp-2 max-w-[75%] pt-1 text-xl leading-tight font-bold tracking-tight">{trip.name}</h3>

      <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
          <Users className="size-3.5" />
          {trip.people.length}
        </span>

        <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
          <Receipt className="size-3.5" />
          {trip.expenses.length} {trip.expenses.length === 1 ? "gasto" : "gastos"}
        </span>

        {trip.viewer.role === "MEMBER" && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
            <UserRoundCheck className="size-3.5" />
            Invitado
          </span>
        )}
      </div>

      <div className="mt-auto pt-5">
        <p className="inline-flex items-center gap-1.5 text-3xl font-extrabold tracking-tight text-amber-300 drop-shadow">
          <Coins className="size-6" />${formatNumber(totalSpent)}
        </p>

        <ViewerBalanceBadge trip={trip} className="mt-2" />

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-white/70">
            <CalendarDays className="size-3.5" />
            {new Date(trip.updatedAt).toLocaleDateString("es-MX")}
          </span>

          <Tip label={isOwner ? "Eliminar sustito" : "Salir del sustito"}>
            <Button
              variant="ghost"
              size="icon-lg"
              className="relative z-20 text-white/80 hover:bg-white/20 hover:text-white"
              aria-label={isOwner ? `Eliminar ${trip.name}` : `Salir de ${trip.name}`}
              onClick={() => (isOwner ? onDelete(trip) : onLeave(trip))}>
              {isOwner ? <Trash2 className="size-6" /> : <LogOut className="size-6" />}
            </Button>
          </Tip>
        </div>
      </div>
    </div>
  )
}
