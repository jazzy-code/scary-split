"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Share2, Check, ArrowLeft, Pencil, X, ChevronDown } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog"
import type { Expense, Trip } from "@/lib/expenses/types"
import { calculateBalances } from "@/lib/expenses/calculate-balances"
import { simplifyDebts } from "@/lib/expenses/simplify-debts"
import { BalanceSummary } from "@/components/settlements/balance-summary"
import { SettlementList } from "@/components/settlements/settlement-list"
import { ExpenseSummary } from "@/components/settlements/expense-summary"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { createTripShareAction, deleteExpenseAction, saveTripAction } from "@/features/trips/actions"
import { formatNumber } from "@/lib/utils"

type TripPageClientProps = {
  trip: Trip | null
  shareToken?: string
}

export default function TripPageClient({ trip, shareToken }: TripPageClientProps) {
  const router = useRouter()

  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [personToDelete, setPersonToDelete] = useState<Trip["people"][number] | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [personName, setPersonName] = useState("")
  const [editingPersonId, setEditingPersonId] = useState<string | null>(null)
  const [editingPersonName, setEditingPersonName] = useState("")
  const [personError, setPersonError] = useState("")
  const [deletePersonError, setDeletePersonError] = useState("")
  const [deletePersonErrorId, setDeletePersonErrorId] = useState<string | null>(null)
  const [isSavingPerson, setIsSavingPerson] = useState(false)

  async function handleShareTrip() {
    if (!trip) {
      return
    }

    const token = await createTripShareAction(trip.id)
    const url = `${window.location.origin}/trip/${trip.id}?share=${encodeURIComponent(token)}`

    await navigator.clipboard.writeText(url)

    setShareCopied(true)

    setTimeout(() => {
      setShareCopied(false)
    }, 2000)
  }

  async function handleAddPerson() {
    if (!trip) {
      return
    }

    const name = personName.trim()

    if (!name) {
      setPersonError("El nombre del participante es requerido")
      return
    }

    if (trip.people.some((person) => person.name.trim().toLowerCase() === name.toLowerCase())) {
      setPersonError("Ya existe un participante con ese nombre")
      return
    }

    try {
      setIsSavingPerson(true)
      setPersonError("")

      const updatedTrip: Trip = {
        ...trip,
        people: [
          ...trip.people,
          {
            id: crypto.randomUUID(),
            name
          }
        ]
      }

      await saveTripAction(updatedTrip, shareToken)

      setPersonName("")
      router.refresh()
    } catch (error) {
      setPersonError(error instanceof Error ? error.message : "No se pudo agregar el participante")
    } finally {
      setIsSavingPerson(false)
    }
  }

  function handleStartEditPerson(person: Trip["people"][number]) {
    setEditingPersonId(person.id)
    setEditingPersonName(person.name)
    setPersonError("")
    setDeletePersonError("")
    setDeletePersonErrorId(null)
  }

  function handleCancelEditPerson() {
    setEditingPersonId(null)
    setEditingPersonName("")
    setPersonError("")
  }

  async function handleUpdatePerson() {
    if (!trip || !editingPersonId) {
      return
    }

    const name = editingPersonName.trim()

    if (!name) {
      setPersonError("El nombre del participante es requerido")
      return
    }

    if (
      trip.people.some(
        (person) => person.id !== editingPersonId && person.name.trim().toLowerCase() === name.toLowerCase()
      )
    ) {
      setPersonError("Ya existe un participante con ese nombre")
      return
    }

    try {
      setIsSavingPerson(true)
      setPersonError("")

      const updatedTrip: Trip = {
        ...trip,
        people: trip.people.map((person) => (person.id === editingPersonId ? { ...person, name } : person))
      }

      await saveTripAction(updatedTrip, shareToken)

      handleCancelEditPerson()
      router.refresh()
    } catch (error) {
      setPersonError(error instanceof Error ? error.message : "No se pudo actualizar el participante")
    } finally {
      setIsSavingPerson(false)
    }
  }

  async function handleDeletePerson() {
    if (!trip || !personToDelete) {
      return
    }

    const personId = personToDelete.id

    try {
      setIsSavingPerson(true)
      setDeletePersonError("")
      setDeletePersonErrorId(null)

      const updatedTrip: Trip = {
        ...trip,
        people: trip.people.filter((person) => person.id !== personId)
      }

      await saveTripAction(updatedTrip, shareToken)

      setPersonToDelete(null)
      router.refresh()
    } catch (error) {
      setPersonToDelete(null)
      setDeletePersonErrorId(personId)
      setDeletePersonError(error instanceof Error ? error.message : "No se pudo eliminar el participante")
    } finally {
      setIsSavingPerson(false)
    }
  }

  async function handleAddExpense(expense: Expense) {
    if (!trip) {
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      expenses: [...trip.expenses, expense]
    }

    await saveTripAction(updatedTrip, shareToken)
    router.refresh()
  }

  async function handleUpdateExpense(expense: Expense) {
    if (!trip) {
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      expenses: trip.expenses.map((item) => (item.id === expense.id ? expense : item))
    }

    await saveTripAction(updatedTrip, shareToken)
    router.refresh()
  }

  async function handleDeleteExpense() {
    if (!trip || !expenseToDelete) {
      return
    }

    await deleteExpenseAction(trip.id, expenseToDelete.id, shareToken)

    setExpenseToDelete(null)
    router.refresh()
  }

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Sustito no encontrado.</p>
      </main>
    )
  }

  const totalSpent = trip.expenses.reduce((total, expense) => total + expense.amount, 0)
  const balances = calculateBalances(trip.people, trip.expenses)
  const settlements = simplifyDebts(balances)

  return (
    <main className="min-h-screen px-4 py-4 md:px-8 md:py-8">
      <div className="w-full">
        <div className="mb-4">
          <Button nativeButton={false} variant="ghost" render={<Link href="/" />}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="ml-1 text-md text-muted-foreground">Sustito</p>

            <div className="flex items-center">
              <Image src="/scary-split-logo.png" alt="Logo" width={40} height={40} />

              <h1 className="ml-1 text-3xl font-bold tracking-tight">{trip.name}</h1>
            </div>
          </div>

          <Button variant="outline" onClick={handleShareTrip}>
            {shareCopied ? (
              <>
                <Check className="mr-2 size-4" />
                Enlace copiado
              </>
            ) : (
              <>
                <Share2 className="mr-2 size-4" />
                Compartir sustito
              </>
            )}
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total gastado</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-bold">${formatNumber(totalSpent)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Participantes</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Nombre"
                  value={personName}
                  aria-invalid={!!personError}
                  disabled={isSavingPerson}
                  onChange={(event) => {
                    setPersonName(event.target.value)
                    setPersonError("")
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault()
                      handleAddPerson()
                    }
                  }}
                />

                <Button type="button" variant="secondary" onClick={handleAddPerson} disabled={isSavingPerson}>
                  Agregar
                </Button>
              </div>

              {personError && <p className="text-sm text-destructive">{personError}</p>}

              <div className="space-y-2">
                {trip.people.map((person) => {
                  const isEditing = editingPersonId === person.id
                  const hasDeleteError = deletePersonErrorId === person.id

                  return (
                    <div key={person.id} className="space-y-1">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Input
                              value={editingPersonName}
                              aria-invalid={!!personError}
                              disabled={isSavingPerson}
                              onChange={(event) => {
                                setEditingPersonName(event.target.value)
                                setPersonError("")
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault()
                                  handleUpdatePerson()
                                }

                                if (event.key === "Escape") {
                                  handleCancelEditPerson()
                                }
                              }}
                            />

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={handleUpdatePerson}
                              disabled={isSavingPerson}
                              aria-label="Guardar participante"
                            >
                              <Check className="size-4" />
                            </Button>

                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={handleCancelEditPerson}
                              disabled={isSavingPerson}
                              aria-label="Cancelar edición"
                            >
                              <X className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge
                            variant="secondary"
                            aria-invalid={hasDeleteError}
                            className="flex-1 justify-between px-3 h-[32px]"
                          >
                            <span className="text-sm">{person.name}</span>

                            <span className="ml-2 flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEditPerson(person)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={`Editar a ${person.name}`}
                              >
                                <Pencil className="size-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setPersonToDelete(person)
                                  setDeletePersonError("")
                                  setDeletePersonErrorId(null)
                                }}
                                className="rounded p-1 text-muted-foreground transition-colors hover:text-destructive"
                                aria-label={`Eliminar a ${person.name}`}
                              >
                                <Trash2 className="size-4" />
                              </button>
                            </span>
                          </Badge>
                        )}
                      </div>

                      {hasDeleteError && deletePersonError && (
                        <p className="text-sm text-destructive">{deletePersonError}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative mt-4 min-h-screen md:min-h-[400px]">
            <Card className="absolute inset-0 flex flex-col">
              <CardHeader className="flex shrink-0 flex-row items-center justify-between">
                <CardTitle>Gastos</CardTitle>

                <AddExpenseDialog people={trip.people} onAdd={handleAddExpense} />
              </CardHeader>

              <CardContent className="flex-1 overflow-y-auto">
                {trip.expenses.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Aún no hay gastos.</p>

                    <p className="mt-1 text-sm text-muted-foreground">Agrega el primer gasto del sustito.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trip.expenses.map((expense) => {
                      const payer = trip.people.find((person) => person.id === expense.paidBy)

                      return (
                        <Collapsible key={expense.id} className="rounded-lg border">
                          <CollapsibleTrigger className="group flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                            <div className="min-w-0">
                              <p className="font-medium">{expense.description}</p>

                              <p className="text-sm text-muted-foreground">
                                Pagó {payer?.name ?? "Desconocido"} {" · "}
                                {expense.participants.length}{" "}
                                {expense.participants.length === 1 ? "persona" : "personas"}
                              </p>
                            </div>

                            <div className="ml-4 flex shrink-0 items-center gap-2">
                              <p className="font-semibold">${formatNumber(expense.amount)}</p>

                              <ChevronDown className="size-4 transition-transform group-data-panel-open:rotate-180" />
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t px-4 py-4">
                              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Total</p>

                                  <p className="font-semibold">${formatNumber(expense.amount)}</p>
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground">Pagó</p>

                                  <p className="font-semibold">{payer?.name ?? "Desconocido"}</p>
                                </div>
                              </div>

                              <div>
                                <p className="mb-3 text-sm font-medium">Dividido entre</p>

                                <div className="space-y-2">
                                  {expense.participants.map((participant) => {
                                    const person = trip.people.find((person) => person.id === participant.personId)

                                    return (
                                      <div
                                        key={participant.personId}
                                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                                      >
                                        <span className="text-sm">{person?.name ?? "Desconocido"}</span>

                                        <span className="text-sm font-medium">
                                          ${formatNumber(participant.amount)}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              <div className="mt-4 flex justify-end gap-2">
                                <AddExpenseDialog
                                  people={trip.people}
                                  expense={expense}
                                  onAdd={() => { }}
                                  onUpdate={handleUpdateExpense}
                                />

                                <button
                                  type="button"
                                  onClick={() => setExpenseToDelete(expense)}
                                  className="inline-flex h-8 items-center gap-2 rounded-md border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                                >
                                  <Trash2 className="size-4" />
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 min-h-[400px]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Resumen de gastos</CardTitle>
              </CardHeader>

              <CardContent>
                <ExpenseSummary people={trip.people} expenses={trip.expenses} />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Balance</CardTitle>
            </CardHeader>

            <CardContent>
              <BalanceSummary people={trip.people} balances={balances} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>¿Quién le debe a quién?</CardTitle>
            </CardHeader>

            <CardContent>
              <SettlementList people={trip.people} settlements={settlements} />
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog
        open={!!expenseToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setExpenseToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este gasto?</AlertDialogTitle>

            <AlertDialogDescription>
              {expenseToDelete
                ? `Se eliminará "${expenseToDelete.description}" por $${formatNumber(expenseToDelete.amount)}. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!personToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setPersonToDelete(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este participante?</AlertDialogTitle>

            <AlertDialogDescription>
              {personToDelete
                ? `Se eliminará a "${personToDelete.name}" del sustito. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeletePerson}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}
