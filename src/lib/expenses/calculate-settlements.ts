import { roundMoney } from "../money/round"
import { calculateBalances } from "./calculate-balances"
import { simplifyDebts } from "./simplify-debts"
import type { Expense, Payment, Person, Settlement } from "./types"

const TOLERANCE = 0.02

/**
 * Transferencias pendientes entre los participantes.
 *
 * El plan se calcula con los gastos, sin pagos, y cada pago solo descuenta la transferencia que le corresponde
 * (Sofia paga a Juan, baja lo que Sofia le debe a Juan). Así registrar un abono no reacomoda al resto.
 * Si los pagos no encajan con el plan (por ejemplo, se editaron los gastos después), se recalcula con los
 * balances netos para que las cuentas siempre cuadren.
 */
export function calculateSettlements(people: Person[], expenses: Expense[], payments: Payment[]): Settlement[] {
  const plan = simplifyDebts(calculateBalances(people, expenses))

  const remaining = plan.map((settlement) => ({ ...settlement }))

  for (const payment of payments) {
    let left = payment.amount

    for (const settlement of remaining) {
      if (left <= 0) {
        break
      }

      if (settlement.from !== payment.from || settlement.to !== payment.to || settlement.amount <= 0) {
        continue
      }

      const applied = Math.min(settlement.amount, left)

      settlement.amount = roundMoney(settlement.amount - applied)
      left = roundMoney(left - applied)
    }
  }

  const pending = remaining.filter((settlement) => settlement.amount > 0.009)

  const balances = calculateBalances(people, expenses, payments)
  const net = new Map(balances.map((balance) => [balance.personId, balance.amount]))

  // Al ejecutar las transferencias pendientes, el balance de cada persona debe quedar en cero
  for (const settlement of pending) {
    net.set(settlement.from, (net.get(settlement.from) ?? 0) + settlement.amount)
    net.set(settlement.to, (net.get(settlement.to) ?? 0) - settlement.amount)
  }

  const matchesPlan = [...net.values()].every((amount) => Math.abs(amount) <= TOLERANCE)

  return matchesPlan ? pending : simplifyDebts(balances)
}
