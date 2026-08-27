import { roundMoney } from "../money/round"
import type { Balance, Expense, Person } from "./types"

export function calculateBalances(
  people: Person[],
  expenses: Expense[],
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

  return people.map((person) => ({
    personId: person.id,
    amount: roundMoney(balances.get(person.id) ?? 0),
  }))
}
