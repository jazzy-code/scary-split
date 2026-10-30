"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Settlement } from "@/lib/expenses/types"
import { formatNumber } from "@/lib/utils"

type RegisterPaymentDialogProps = {
  settlement: Settlement | null
  fromName: string
  toName: string
  onClose: () => void
  onConfirm: (settlement: Settlement, amount: number) => Promise<void>
}

export function RegisterPaymentDialog({ settlement, fromName, toName, onClose, onConfirm }: RegisterPaymentDialogProps) {
  return (
    <Dialog
      open={!!settlement}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-sm">
        {/* El formulario se remonta por transferencia para iniciar con el monto completo */}
        {settlement && (
          <PaymentForm
            key={`${settlement.from}-${settlement.to}-${settlement.amount}`}
            settlement={settlement}
            fromName={fromName}
            toName={toName}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

type PaymentFormProps = Omit<RegisterPaymentDialogProps, "settlement"> & {
  settlement: Settlement
}

function PaymentForm({ settlement, fromName, toName, onClose, onConfirm }: PaymentFormProps) {
  const [amount, setAmount] = useState(settlement.amount.toString())
  const [error, setError] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const numericAmount = Number(amount)

    if (!numericAmount || numericAmount <= 0) {
      setError("El monto debe ser mayor a cero")
      return
    }

    if (numericAmount > settlement.amount) {
      setError(`El monto no puede ser mayor a $${formatNumber(settlement.amount)}`)
      return
    }

    try {
      setIsSaving(true)
      setError("")

      await onConfirm(settlement, numericAmount)
    } catch (error) {
      console.error(error)
      setError("No se pudo registrar el pago")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Registrar pago</DialogTitle>

        <DialogDescription>
          <b>{fromName}</b> le transfirió a <b>{toName}</b>. Si fue solo una parte, ajusta el monto.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="payment-amount">Monto pagado</Label>

        <Input
          id="payment-amount"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          max={settlement.amount}
          value={amount}
          aria-invalid={!!error}
          disabled={isSaving}
          onChange={(event) => {
            setAmount(event.target.value)
            setError("")
          }}
        />

        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" disabled={isSaving} onClick={onClose}>
          Cancelar
        </Button>

        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Registrar pago"}
        </Button>
      </DialogFooter>
    </form>
  )
}
