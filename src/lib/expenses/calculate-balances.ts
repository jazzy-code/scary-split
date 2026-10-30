import { roundMoney } from "../money/round"
import type { Balance, Expense, Payment, Person } from "./types"

export function calculateBalances(
  people: Person[],
  expenses: Expense[],
  payments: Payment[] = [],
): Balance[] {
  const balances = new Map<string, number>()

  for (const person of people) {
    balances.set(person.id, 0)
  }

  for (const expense of expenses) {
    // Quien pagó recibe crédito por todo lo que pagó.
    const payerBalance = balances.get(expense.paidBy) ?? 0

    balances.set(
      expense.paidBy,
      payerBalance + expense.amount,
    )

    // Cada participante asume su parte del gasto.
    for (const participant of expense.participants) {
      const balance = balances.get(participant.personId) ?? 0

      balances.set(
        participant.personId,
        balance - participant.amount,
      )
    }
  }

  // Un pago es una transferencia real: baja lo que debe quien paga y lo que espera quien cobra.
  for (const payment of payments) {
    balances.set(payment.from, (balances.get(payment.from) ?? 0) + payment.amount)
    balances.set(payment.to, (balances.get(payment.to) ?? 0) - payment.amount)
  }

  return people.map((person) => ({
    personId: person.id,
    amount: roundMoney(balances.get(person.id) ?? 0),
  }))
}
