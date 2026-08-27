"use client"

import { useMemo, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"

import type {
  Expense,
  Person,
} from "@/lib/expenses/types"

import { splitEqually } from "@/lib/expenses/split-equally"
import { splitCustom } from "@/lib/expenses/split-custom"
import { formatNumber } from "@/lib/utils"
import { Pencil } from "lucide-react"

type AddExpenseDialogProps = {
  people: Person[]
  onAdd: (expense: Expense) => void
  expense?: Expense
  onUpdate?: (expense: Expense) => void
}

export function AddExpenseDialog({
  people,
  onAdd,
  expense,
  onUpdate,
}: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)

  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [paidBy, setPaidBy] = useState("")

  const [selectedPeople, setSelectedPeople] = useState<string[]>([])

  const [splitMode, setSplitMode] = useState<
    "equal" | "custom"
  >("equal")

  const [customAmounts, setCustomAmounts] = useState<
    Record<string, string>
  >({})

  const numericAmount = Number(amount)

  const equalSplit = useMemo(() => {
    if (
      !numericAmount ||
      selectedPeople.length === 0
    ) {
      return []
    }

    return splitEqually(
      numericAmount,
      selectedPeople,
    )
  }, [numericAmount, selectedPeople])

  function togglePerson(personId: string) {
    setSelectedPeople((current) => {
      if (current.includes(personId)) {
        return current.filter(
          (id) => id !== personId,
        )
      }

      return [...current, personId]
    })
  }

  function loadExpense(expense: Expense) {
    setDescription(expense.description)
    setAmount(expense.amount.toString())
    setPaidBy(expense.paidBy)

    setSelectedPeople(
      expense.participants.map(
        (participant) => participant.personId,
      ),
    )

    const customValues: Record<string, string> = {}

    expense.participants.forEach(
      (participant) => {
        customValues[participant.personId] =
          participant.amount.toString()
      },
    )

    setCustomAmounts(customValues)
    setSplitMode("custom")
  }

  function resetForm() {
    setDescription("")
    setAmount("")
    setPaidBy("")
    setSelectedPeople([])
    setCustomAmounts({})
    setSplitMode("equal")
  }

  function handleSubmit() {
    if (
      !description.trim() ||
      numericAmount <= 0 ||
      !paidBy ||
      selectedPeople.length === 0
    ) {
      return
    }

    let participants

    if (splitMode === "equal") {
      participants = equalSplit
    } else {
      participants = selectedPeople.map(
        (personId) => ({
          personId,
          amount: Number(
            customAmounts[personId] ?? 0,
          ),
        }),
      )

      try {
        participants = splitCustom(
          numericAmount,
          participants,
        )
      } catch {
        return
      }
    }

    const updatedExpense: Expense = {
      id: expense?.id ?? crypto.randomUUID(),
      description: description.trim(),
      amount: numericAmount,
      paidBy,
      participants,
    }

    if (expense) {
      onUpdate?.(updatedExpense)
    } else {
      onAdd(updatedExpense)
    }

    resetForm()
    setOpen(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)

        if (!nextOpen) {
          resetForm()
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant={
              expense ? "outline" : "default"
            }
            onClick={() => {
              if (expense) {
                loadExpense(expense)
              }
            }}
          />
        }
      >
        {expense ? (<div className="flex items-center gap-2"><Pencil />Editar</div>) : "+ Agregar gasto"}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {expense
              ? "Editar gasto"
              : "Agregar gasto"}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto no-scrollbar">
          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Concepto</Label>

              <Input
                placeholder="Cena"
                value={description}
                onChange={(event) =>
                  setDescription(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Cantidad</Label>

              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(event) =>
                  setAmount(event.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>¿Quién pagó?</Label>

              <select
                className="h-10 w-full rounded-md border bg-background px-3"
                value={paidBy}
                onChange={(event) =>
                  setPaidBy(event.target.value)
                }
              >
                <option value="">
                  Selecciona una persona
                </option>

                {people.map((person) => (
                  <option
                    key={person.id}
                    value={person.id}
                  >
                    {person.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <Label>
                ¿Quiénes participan?
              </Label>

              <div className="space-y-2">
                {people.map((person) => (
                  <label
                    key={person.id}
                    className="flex cursor-pointer items-center gap-3"
                  >
                    <Checkbox
                      checked={selectedPeople.includes(
                        person.id,
                      )}
                      onCheckedChange={() =>
                        togglePerson(person.id)
                      }
                    />

                    <span>{person.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {selectedPeople.length > 0 && (
              <div className="space-y-3">
                <Label>División</Label>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={
                      splitMode === "equal"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setSplitMode("equal")
                    }
                  >
                    Equitativa
                  </Button>

                  <Button
                    type="button"
                    variant={
                      splitMode === "custom"
                        ? "default"
                        : "outline"
                    }
                    onClick={() =>
                      setSplitMode("custom")
                    }
                  >
                    Personalizada
                  </Button>
                </div>
              </div>
            )}

            {splitMode === "equal" &&
              equalSplit.length > 0 && (
                <div className="rounded-lg border p-3">
                  <p className="mb-2 text-sm font-medium">
                    Cada persona paga:
                  </p>

                  {equalSplit.map((item) => {
                    const person = people.find(
                      (person) =>
                        person.id === item.personId,
                    )

                    return (
                      <div
                        key={item.personId}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {person?.name}
                        </span>

                        <span>
                          ${formatNumber(item.amount)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

            {splitMode === "custom" && (
              <div className="space-y-3 rounded-lg border p-3">
                {selectedPeople.map((personId) => {
                  const person = people.find(
                    (person) =>
                      person.id === personId,
                  )

                  return (
                    <div
                      key={personId}
                      className="flex items-center gap-3"
                    >
                      <span className="flex-1">
                        {person?.name}
                      </span>

                      <Input
                        className="w-32"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={
                          customAmounts[personId] ??
                          ""
                        }
                        onChange={(event) =>
                          setCustomAmounts(
                            (current) => ({
                              ...current,
                              [personId]:
                                event.target.value,
                            }),
                          )
                        }
                      />
                    </div>
                  )
                })}
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmit}
            >
              {expense
                ? "Guardar cambios"
                : "Agregar gasto"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
