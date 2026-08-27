"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Trash2, Share2, Check, Ghost, ArrowLeft } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import {
  AddExpenseDialog,
} from "@/components/expenses/add-expense-dialog"

import {
  deleteExpense,
  saveTrip,
} from "@/lib/storage/trips"

import { useTrip } from "@/lib/storage/use-trip"

import type {
  Expense,
  Trip,
} from "@/lib/expenses/types"

import {
  calculateBalances,
} from "@/lib/expenses/calculate-balances"

import {
  simplifyDebts,
} from "@/lib/expenses/simplify-debts"

import {
  BalanceSummary,
} from "@/components/settlements/balance-summary"

import {
  SettlementList,
} from "@/components/settlements/settlement-list"

import {
  ExpenseSummary,
} from "@/components/settlements/expense-summary"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import {
  createShareUrl,
} from "@/lib/sharing/trip-share"
import { formatNumber } from "@/lib/utils"
import Link from "next/link"


export default function TripPage() {
  const params = useParams()

  const tripId =
    typeof params.id === "string"
      ? params.id
      : null

  const trip = useTrip(tripId)

  const [expenseToDelete, setExpenseToDelete] =
    useState<Expense | null>(null)

  const [shareCopied, setShareCopied] =
    useState(false)


  async function handleShareTrip() {
    if (!trip) {
      return
    }

    const url = createShareUrl(trip)

    await navigator.clipboard.writeText(url)

    setShareCopied(true)

    setTimeout(() => {
      setShareCopied(false)
    }, 2000)
  }


  function handleAddExpense(
    expense: Expense,
  ) {
    if (!trip) {
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      expenses: [
        ...trip.expenses,
        expense,
      ],
    }

    saveTrip(updatedTrip)
  }


  function handleUpdateExpense(
    expense: Expense,
  ) {
    if (!trip) {
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      expenses: trip.expenses.map(
        (item) =>
          item.id === expense.id
            ? expense
            : item,
      ),
    }

    saveTrip(updatedTrip)
  }


  function handleDeleteExpense() {
    if (!trip || !expenseToDelete) {
      return
    }

    deleteExpense(
      trip.id,
      expenseToDelete.id,
    )

    setExpenseToDelete(null)
  }


  /*
   * Mientras useSyncExternalStore obtiene
   * el snapshot del cliente, trip puede ser null.
   */
  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">
          Sustito no encontrado.
        </p>
      </main>
    )
  }


  const totalSpent =
    trip.expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0,
    )


  const balances =
    calculateBalances(
      trip.people,
      trip.expenses,
    )


  const settlements =
    simplifyDebts(balances)


  return (
    <main className="min-h-screen px-4 py-4 md:py-8 md:px-8">
      <div className="w-full">

        {/* Header */}

        <div className="mb-4">
          <Button nativeButton={false} variant="ghost" render={<Link href="/" />}>
            <ArrowLeft className="mr-2 size-4" />
            Volver
          </Button>
        </div>

        <div className="mb-8 flex items-start justify-between gap-4">

          <div>
            <div className="flex">
              <p className="text-md text-muted-foreground">
                Sustito
              </p>
              <Ghost className="ml-1 size-4" />
            </div>

            <h1 className="text-3xl font-bold tracking-tight">
              {trip.name}
            </h1>
          </div>


          <Button
            variant="outline"
            onClick={handleShareTrip}
          >
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


        {/* Summary */}

        <div className="grid gap-4 sm:grid-cols-2">

          <Card>

            <CardHeader>
              <CardTitle>
                Total gastado
              </CardTitle>
            </CardHeader>

            <CardContent>

              <p className="text-3xl font-bold">
                ${formatNumber(totalSpent)}
              </p>

            </CardContent>

          </Card>


          <Card>

            <CardHeader>
              <CardTitle>
                Participantes
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-wrap gap-2">

              {trip.people.map((person) => (
                <Badge
                  key={person.id}
                  variant="secondary"
                >
                  {person.name}
                </Badge>
              ))}

            </CardContent>

          </Card>

        </div>


        <div className="grid gap-4 md:grid-cols-2">
          {/* Expenses Column */}
          <div className="relative mt-4 min-h-screen md:min-h-[400px]">
            {/* El Card se pega a los bordes de la columna creada por Expense Summary */}
            <Card className="absolute inset-0 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between shrink-0">
                <CardTitle>Gastos</CardTitle>
                <AddExpenseDialog
                  people={trip.people}
                  onAdd={handleAddExpense}
                />
              </CardHeader>

              {/* Al tener altura fija dictada por inset-0, el overflow-y-auto SÍ funciona */}
              <CardContent className="flex-1 overflow-y-auto">
                {trip.expenses.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-muted-foreground">Aún no hay gastos.</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Agrega el primer gasto del sustito.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {trip.expenses.map((expense) => {
                      const payer = trip.people.find(
                        (person) => person.id === expense.paidBy
                      )

                      return (
                        <Collapsible
                          key={expense.id}
                          className="rounded-lg border"
                        >
                          <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50">
                            <div className="min-w-0">
                              <p className="font-medium">{expense.description}</p>
                              <p className="text-sm text-muted-foreground">
                                Pagó {payer?.name ?? "Desconocido"} {" · "}
                                {expense.participants.length}{" "}
                                {expense.participants.length === 1
                                  ? "persona"
                                  : "personas"}
                              </p>
                            </div>

                            <p className="ml-4 shrink-0 font-semibold">
                              ${formatNumber(expense.amount)}
                            </p>
                          </CollapsibleTrigger>

                          <CollapsibleContent>
                            <div className="border-t px-4 py-4">
                              {/* Basic information */}
                              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-xs text-muted-foreground">Total</p>
                                  <p className="font-semibold">
                                    ${formatNumber(expense.amount)}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-xs text-muted-foreground">Pagó</p>
                                  <p className="font-semibold">
                                    {payer?.name ?? "Desconocido"}
                                  </p>
                                </div>
                              </div>

                              {/* Participants */}
                              <div>
                                <p className="mb-3 text-sm font-medium">
                                  Dividido entre
                                </p>

                                <div className="space-y-2">
                                  {expense.participants.map((participant) => {
                                    const person = trip.people.find(
                                      (person) => person.id === participant.personId
                                    )

                                    return (
                                      <div
                                        key={participant.personId}
                                        className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                                      >
                                        <span className="text-sm">
                                          {person?.name ?? "Desconocido"}
                                        </span>
                                        <span className="text-sm font-medium">
                                          ${formatNumber(participant.amount)}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>

                              {/* Actions */}
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

          {/* Expense Summary Column */}
          <div className="mt-4 min-h-[400px]">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Resumen de gastos</CardTitle>
              </CardHeader>
              <CardContent>
                <ExpenseSummary
                  people={trip.people}
                  expenses={trip.expenses}
                />
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Balances & Settlements */}

        <div className="mt-4 grid gap-4 lg:grid-cols-2">

          <Card>

            <CardHeader>
              <CardTitle>
                Balance
              </CardTitle>
            </CardHeader>

            <CardContent>

              <BalanceSummary
                people={trip.people}
                balances={balances}
              />

            </CardContent>

          </Card>


          <Card>

            <CardHeader>
              <CardTitle>
                ¿Quién le debe a quién?
              </CardTitle>
            </CardHeader>

            <CardContent>

              <SettlementList
                people={trip.people}
                settlements={settlements}
              />

            </CardContent>

          </Card>

        </div>

      </div>


      {/* Delete confirmation */}

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

            <AlertDialogTitle>
              ¿Eliminar este gasto?
            </AlertDialogTitle>

            <AlertDialogDescription>

              {expenseToDelete
                ? `Se eliminará "${expenseToDelete.description}" por $${formatNumber(expenseToDelete.amount)}. Esta acción no se puede deshacer.`
                : "Esta acción no se puede deshacer."}

            </AlertDialogDescription>

          </AlertDialogHeader>


          <AlertDialogFooter>

            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>

            <AlertDialogAction
              onClick={handleDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>

          </AlertDialogFooter>

        </AlertDialogContent>

      </AlertDialog>

    </main>
  )
}
