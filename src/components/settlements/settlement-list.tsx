"use client"

import type {
  Person,
  Settlement,
} from "@/lib/expenses/types"

type SettlementListProps = {
  people: Person[]
  settlements: Settlement[]
}

export function SettlementList({
  people,
  settlements,
}: SettlementListProps) {
  function getPersonName(id: string) {
    return (
      people.find((person) => person.id === id)
        ?.name ?? "Desconocido"
    )
  }

  if (settlements.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="font-medium">
          Todo está saldado
        </p>

        <p className="mt-1 text-sm text-muted-foreground">
          No hay transferencias pendientes.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {settlements.map((settlement, index) => (
        <div
          key={`${settlement.from}-${settlement.to}-${index}`}
          className="flex items-center justify-between rounded-lg border p-4"
        >
          <div>
            <p className="font-medium">
              {getPersonName(settlement.from)}
              {" → "}
              {getPersonName(settlement.to)}
            </p>

            <p className="text-sm text-muted-foreground">
              debe transferir
            </p>
          </div>

          <p className="font-semibold">
            ${settlement.amount.toFixed(2)}
          </p>
        </div>
      ))}
    </div>
  )
}