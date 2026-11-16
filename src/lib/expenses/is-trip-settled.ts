import { calculateSettlements } from "./calculate-settlements"
import type { Settlement, Trip } from "./types"

/** Transferencias que aún faltan por hacer, ya descontando los pagos registrados. */
export function getPendingSettlements(trip: Trip): Settlement[] {
  return calculateSettlements(trip.people, trip.expenses, trip.payments)
}

/** Un sustito está saldado cuando tiene gastos y ya no quedan transferencias pendientes. */
export function isTripSettled(trip: Trip): boolean {
  return trip.expenses.length > 0 && getPendingSettlements(trip).length === 0
}
