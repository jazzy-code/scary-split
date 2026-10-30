import { BadgeCheck, Hourglass } from "lucide-react"

import { TripCard } from "@/components/trips/trip-card"
import { isTripSettled } from "@/lib/expenses/is-trip-settled"
import type { Trip } from "@/lib/expenses/types"
import { formatNumber } from "@/lib/utils"

type TripsSectionProps = {
  trips: Trip[]
  onDelete: (trip: Trip) => void
  onLeave: (trip: Trip) => void
}

function getTotalSpent(trip: Trip) {
  return trip.expenses.reduce((total, expense) => total + expense.amount, 0)
}

export function TripsSection({ trips, onDelete, onLeave }: TripsSectionProps) {
  const pendingTrips = trips.filter((trip) => !isTripSettled(trip))
  const settledTrips = trips.filter(isTripSettled)

  const totalSpent = trips.reduce((total, trip) => total + getTotalSpent(trip), 0)

  const stats = [
    { label: "Pendientes", value: pendingTrips.length },
    { label: "Saldados", value: settledTrips.length },
    { label: "Total gastado", value: `$${formatNumber(totalSpent)}` }
  ]

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/10">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className="truncate font-heading text-xl font-bold text-[#4a2a8f]">{stat.value}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Hourglass className="size-5 text-amber-500" />
          Pendientes
        </h3>

        {pendingTrips.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-violet-300 bg-white/60 p-6 text-center text-sm text-muted-foreground">
            No tienes sustitos pendientes. 👻
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {pendingTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} totalSpent={getTotalSpent(trip)} onDelete={onDelete} onLeave={onLeave} />
            ))}
          </div>
        )}
      </section>

      {settledTrips.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <BadgeCheck className="size-5 text-emerald-500" />
            Saldados
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {settledTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} totalSpent={getTotalSpent(trip)} onDelete={onDelete} onLeave={onLeave} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
