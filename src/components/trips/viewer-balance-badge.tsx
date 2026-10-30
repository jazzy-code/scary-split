import { calculateBalances } from "@/lib/expenses/calculate-balances"
import { isTripSettled } from "@/lib/expenses/is-trip-settled"
import type { Trip } from "@/lib/expenses/types"
import { cn, formatNumber } from "@/lib/utils"

type ViewerBalanceBadgeProps = {
  trip: Trip
  className?: string
}

/** Cuánto debe o le deben a quien consulta el sustito. No aparece si no está vinculado a un participante. */
export function ViewerBalanceBadge({ trip, className }: ViewerBalanceBadgeProps) {
  if (!trip.viewer.personId || isTripSettled(trip)) {
    return null
  }

  const balance = calculateBalances(trip.people, trip.expenses, trip.payments).find(
    (item) => item.personId === trip.viewer.personId
  )?.amount

  if (balance === undefined) {
    return null
  }

  const isOwed = balance > 0.009
  const isDebtor = balance < -0.009

  return (
    <p
      className={cn(
        "relative block w-fit rounded-full px-2.5 py-0.5 text-xs font-bold",
        isOwed && "bg-emerald-300 text-emerald-950",
        isDebtor && "bg-rose-200 text-rose-950",
        !isOwed && !isDebtor && "bg-white/20 text-white",
        className
      )}
    >
      {isOwed && `Te deben $${formatNumber(balance)}`}
      {isDebtor && `Debes $${formatNumber(Math.abs(balance))}`}
      {!isOwed && !isDebtor && "Estás al día"}
    </p>
  )
}
