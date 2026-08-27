"use client"

import type { Expense, Person } from "@/lib/expenses/types"
import { formatNumber } from "@/lib/utils"

type ExpenseSummaryProps = {
  people: Person[]
  expenses: Expense[]
}

export function ExpenseSummary({
  people,
  expenses,
}: ExpenseSummaryProps) {
  return (
    <div className="space-y-3">
      {people.map((person) => {
        const spent = expenses.reduce(
          (total, expense) => {
            if (expense.paidBy !== person.id) {
              return total
            }

            return total + expense.amount
          },
          0,
        )

        const owed = expenses.reduce(
          (total, expense) => {
            const participant = expense.participants.find(
              (participant) =>
                participant.personId === person.id,
            )

            if (!participant) {
              return total
            }

            return total + participant.amount
          },
          0,
        )

        const balance = spent - owed

        return (
          <div
            key={person.id}
            className="rounded-lg border p-4"
          >
            <div className="mb-3">
              <p className="font-medium">
                {person.name}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Gastó
                </p>

                <p className="font-semibold">
                  ${formatNumber(spent)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Le toca
                </p>

                <p className="font-semibold">
                  ${formatNumber(owed)}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  Balance
                </p>

                <p
                  className={
                    balance > 0
                      ? "font-semibold"
                      : balance < 0
                        ? "font-semibold"
                        : "font-semibold"
                  }
                >
                  {balance > 0 && "+"}
                  ${formatNumber(balance)}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
