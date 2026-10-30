"use client"

import { useState } from "react"
import Image from "next/image"
import { ArrowRight, BadgeCheck, Check, Undo2 } from "lucide-react"

import type {
  Payment,
  Person,
  Settlement,
} from "@/lib/expenses/types"
import { Button } from "@/components/ui/button"
import { Tip } from "@/components/ui/tip"
import { getAvatarColor } from "@/components/trips/trip-theme"
import { cn, formatNumber } from "@/lib/utils"

import { RegisterPaymentDialog } from "./register-payment-dialog"

type SettlementListProps = {
  people: Person[]
  settlements: Settlement[]
  payments: Payment[]
  viewerPersonId: string | null
  onRegisterPayment: (settlement: Settlement, amount: number) => Promise<void>
  onDeletePayment: (payment: Payment) => Promise<void>
}

function PersonChip({ person, isViewer }: { person?: Person; isViewer: boolean }) {
  const name = person?.name ?? "Desconocido"

  return (
    <span className="flex min-w-0 items-center gap-2">
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
          person ? getAvatarColor(person.id) : "bg-muted-foreground"
        )}
      >
        {name.trim().charAt(0).toUpperCase()}
      </span>

      <span className="truncate font-medium">{name}</span>

      {isViewer && (
        <span className="shrink-0 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">
          Tú
        </span>
      )}
    </span>
  )
}

export function SettlementList({
  people,
  settlements,
  payments,
  viewerPersonId,
  onRegisterPayment,
  onDeletePayment,
}: SettlementListProps) {
  const [settlementToPay, setSettlementToPay] = useState<Settlement | null>(null)
  const [paymentBeingUndone, setPaymentBeingUndone] = useState<string | null>(null)

  function getPerson(id: string) {
    return people.find((person) => person.id === id)
  }

  function getPersonName(id: string) {
    return getPerson(id)?.name ?? "Desconocido"
  }

  async function handleUndo(payment: Payment) {
    try {
      setPaymentBeingUndone(payment.id)
      await onDeletePayment(payment)
    } finally {
      setPaymentBeingUndone(null)
    }
  }

  return (
    <div className="space-y-5">
      {settlements.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-violet-300 bg-white/60 p-6 text-center">
          <Image src="/scary-split-logo.png" alt="" width={72} height={72} />

          <p className="mt-2 font-heading text-lg font-semibold">
            ¡Todo saldado! 👻
          </p>

          <p className="mt-1 text-sm text-muted-foreground">
            No hay transferencias pendientes.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {settlements.map((settlement, index) => (
            <div
              key={`${settlement.from}-${settlement.to}-${index}`}
              className="space-y-3 rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-violet-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <div className="flex min-w-0 items-center gap-2">
                  <PersonChip person={getPerson(settlement.from)} isViewer={settlement.from === viewerPersonId} />

                  <ArrowRight className="size-4 shrink-0 text-violet-500" />

                  <PersonChip person={getPerson(settlement.to)} isViewer={settlement.to === viewerPersonId} />
                </div>

                <p className="rounded-full bg-amber-300 px-3 py-1 text-sm font-extrabold text-[#24124d] shadow-sm">
                  ${formatNumber(settlement.amount)}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setSettlementToPay(settlement)}
              >
                <Check />
                Marcar como pagado
              </Button>
            </div>
          ))}
        </div>
      )}

      {payments.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#4a2a8f]">
            <BadgeCheck className="size-4" />
            Pagos realizados
          </p>

          <ul className="space-y-2">
            {payments.map((payment) => (
              <li
                key={payment.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-white/60 px-3 py-2 text-sm ring-1 ring-violet-100"
              >
                <div className="min-w-0">
                  <p className="truncate">
                    <b>{getPersonName(payment.from)}</b> pagó <b>${formatNumber(payment.amount)}</b> a{" "}
                    <b>{getPersonName(payment.to)}</b>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString("es-MX")}
                    {payment.createdByName ? ` · registrado por ${payment.createdByName}` : ""}
                  </p>
                </div>

                <Tip label="Deshacer pago">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-10 shrink-0 sm:size-8"
                    aria-label="Deshacer pago"
                    disabled={paymentBeingUndone === payment.id}
                    onClick={() => handleUndo(payment)}
                  >
                    <Undo2 className="size-4" />
                  </Button>
                </Tip>
              </li>
            ))}
          </ul>
        </div>
      )}

      <RegisterPaymentDialog
        settlement={settlementToPay}
        fromName={settlementToPay ? getPersonName(settlementToPay.from) : ""}
        toName={settlementToPay ? getPersonName(settlementToPay.to) : ""}
        onClose={() => setSettlementToPay(null)}
        onConfirm={async (settlement, amount) => {
          await onRegisterPayment(settlement, amount)
          setSettlementToPay(null)
        }}
      />
    </div>
  )
}
