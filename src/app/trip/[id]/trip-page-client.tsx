"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2, Share2, Check, ArrowLeft, Pencil, X, ChevronDown, Plus, CalendarDays, Clock3 } from "lucide-react"
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
import { authClient } from "@/lib/auth-client"
import { ScrollShadow } from "@/components/ui/scroll-shadow"
import { DeleteAlertDialog } from "@/components/alert-dialogs/delete-alert-dialog"

type TripPageClientProps = {
  trip: Trip | null
  shareToken?: string
}

export default function TripPageClient({ trip, shareToken }: TripPageClientProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

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
        <div className="mb-1">
          <Button nativeButton={false} variant="ghost" render={<Link href="/" />}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
        </div>

        <div className="mb-8 ">
          <div className="flex items-end justify-between gap-4 mb-2">
            <p className="ml-1 text-md text-muted-foreground">Sustito</p>
            {session && (
              <Button variant="outline" size="sm" onClick={handleShareTrip}>
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
            )}

          </div>

          <div className="flex items-center">
            <Image src="/scary-split-logo.png" alt="Logo" width={40} height={40} />

            <h1 className="ml-1 text-3xl font-bold tracking-tight">{trip.name}</h1>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Total gastado</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-3xl font-bold">${formatNumber(totalSpent)}</p>
              <div className="gap-3 mt-4 flex flex-col">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="size-3.5" />
                  Creado: {new Date(trip.createdAt).toLocaleDateString("es-MX")}
                </span>

                <span className="inline-flex items-center gap-1">
                  <Clock3 className="size-3.5" />
                  Actualizado: {new Date(trip.updatedAt).toLocaleDateString("es-MX")}
                </span>
              </div>
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
                  <Plus /> Agregar
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
                            className="flex-1 justify-between px-3 h-9"
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

        <div className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
          <Card className="flex max-h-[500px] min-w-0 flex-col md:min-h-[400px] pb-0">
            <CardHeader className="flex shrink-0 flex-row items-center justify-between">
              <CardTitle>Gastos</CardTitle>

              <AddExpenseDialog people={trip.people} onAdd={handleAddExpense} />
            </CardHeader>

            <ScrollShadow>
              <CardContent className="pb-4">
                {trip.expenses.length === 0 ? (
                  <div className="pt-8 pb-6 text-center">
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

                                        <span className="text-sm font-medium">${formatNumber(participant.amount)}</span>
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

                                <Button variant="destructive" onClick={() => setExpenseToDelete(expense)}>
                                  <Trash2 />
                                  Eliminar
                                </Button>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </ScrollShadow>
          </Card>

          <Card className="flex max-h-[500px] min-w-0 flex-col md:min-h-[400px] pb-0">
            <CardHeader className="shrink-0">
              <CardTitle>Resumen de gastos</CardTitle>
            </CardHeader>

            <ScrollShadow>
              <CardContent className="!pb-4">
                <ExpenseSummary people={trip.people} expenses={trip.expenses} />
              </CardContent>
            </ScrollShadow>
          </Card>
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
      <DeleteAlertDialog
        open={!!expenseToDelete}
        title="¿Eliminar éste gasto?"
        description={expenseToDelete
          ? (<>Se eliminará <b>{`"${expenseToDelete.description}"`}</b> por <b>${formatNumber(expenseToDelete.amount)}</b>. Ésta acción no se puede deshacer.</>)
          : "Esta acción no se puede deshacer."}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={handleDeleteExpense}
      />

      <DeleteAlertDialog
        open={!!personToDelete}
        title="¿Eliminar este participante?"
        description={personToDelete
          ? (<>Se eliminará <b>{`"${personToDelete.name}"`}</b> del sustito. Ésta acción no se puede deshacer.</>)
          : "Esta acción no se puede deshacer."}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleDeletePerson}
      />
    </main>
  )
}
