import { calculateBalances } from "./calculate-balances"
import { simplifyDebts } from "./simplify-debts"
import type { Settlement, Trip } from "./types"

/** Transferencias que aún faltan por hacer, ya descontando los pagos registrados. */
export function getPendingSettlements(trip: Trip): Settlement[] {
  const balances = calculateBalances(trip.people, trip.expenses, trip.payments)

  return simplifyDebts(balances)
}

/** Un sustito está saldado cuando tiene gastos y ya no quedan transferencias pendientes. */
export function isTripSettled(trip: Trip): boolean {
  return trip.expenses.length > 0 && getPendingSettlements(trip).length === 0
}
