"use client"

import type { Balance, Person } from "@/lib/expenses/types"

type BalanceSummaryProps = {
  people: Person[]
  balances: Balance[]
}

export function BalanceSummary({
  people,
  balances,
}: BalanceSummaryProps) {
  return (
    <div className="space-y-3">
      {balances.map((balance) => {
        const person = people.find(
          (person) => person.id === balance.personId,
        )

        if (!person) {
          return null
        }

        const isPositive = balance.amount > 0
        const isNegative = balance.amount < 0

        return (
          <div
            key={balance.personId}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div>
              <p className="font-medium">
                {person.name}
              </p>

              <p className="text-sm text-muted-foreground">
                {isPositive
                  ? "Debe recibir"
                  : isNegative
                    ? "Debe pagar"
                    : "Está saldado"}
              </p>
            </div>

            <p className="font-semibold">
              {isPositive && "+"}
              ${Math.abs(balance.amount).toFixed(2)}
            </p>
          </div>
        )
      })}
    </div>
  )
}