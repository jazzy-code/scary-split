"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Coins, LogOut, EllipsisVertical, UserPlus, Trash2, Share2, Check, ArrowLeft, Pencil, X, ChevronDown, Plus, CalendarDays, Clock3 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"

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
import type { Expense, Payment, Settlement, Trip } from "@/lib/expenses/types"
import { calculateBalances } from "@/lib/expenses/calculate-balances"
import { simplifyDebts } from "@/lib/expenses/simplify-debts"
import { BalanceSummary } from "@/components/settlements/balance-summary"
import { SettlementList } from "@/components/settlements/settlement-list"
import { ExpenseSummary } from "@/components/settlements/expense-summary"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  createTripShareAction,
  deleteExpenseAction,
  deletePaymentAction,
  registerPaymentAction,
  saveTripAction
} from "@/features/trips/actions"
import { cn, formatNumber } from "@/lib/utils"
import { copyToClipboard } from "@/lib/clipboard"
import { InvitePersonDialog } from "@/components/members/invite-person-dialog"
import { PersonActionsMenu } from "@/components/members/person-actions-menu"
import { PersonStatus } from "@/components/members/person-status"
import { Tip } from "@/components/ui/tip"
import { joinTripAsParticipantAction, leaveTripAction } from "@/features/members/actions"
import { Drip } from "@/components/trips/drip"
import { SettledBadge } from "@/components/trips/settled-badge"
import { ViewerBalanceBadge } from "@/components/trips/viewer-balance-badge"
import { isTripSettled } from "@/lib/expenses/is-trip-settled"
import { getAvatarColor, getTripTheme } from "@/components/trips/trip-theme"
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

  const [expenseToEdit, setExpenseToEdit] = useState<Expense | null>(null)
  const [expenseToDelete, setExpenseToDelete] = useState<Expense | null>(null)
  const [personToDelete, setPersonToDelete] = useState<Trip["people"][number] | null>(null)
  const [shareCopied, setShareCopied] = useState(false)
  const [personToInvite, setPersonToInvite] = useState<Trip["people"][number] | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
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

    try {
      const origin = window.location.origin
      const urlPromise = createTripShareAction(trip.id).then(
        (token) => `${origin}/trip/${trip.id}?share=${encodeURIComponent(token)}`
      )

      await copyToClipboard(urlPromise)

      setShareCopied(true)
      toast.success("¡Enlace copiado! 👻", { description: "Compártelo con tus amigos para que se unan al sustito." })

      setTimeout(() => {
        setShareCopied(false)
      }, 2000)
    } catch (error) {
      console.error(error)
      toast.error("No se pudo copiar el enlace", {
        description: "Inténtalo de nuevo en un momento."
      })
    }
  }

  async function handleLeaveTrip() {
    if (!trip) {
      return
    }

    const result = await leaveTripAction(trip.id)

    if (!result.ok) {
      setLeaveOpen(false)
      toast.error("No se pudo salir del sustito", { description: result.message })
      return
    }

    toast.success("Saliste del sustito")
    router.push("/")
    router.refresh()
  }

  async function handleJoinAsParticipant() {
    if (!trip) {
      return
    }

    const result = await joinTripAsParticipantAction(trip.id)

    if (!result.ok) {
      toast.error("No se pudo sumarte", { description: result.message })
      return
    }

    toast.success("¡Listo! Ahora eres participante 👻", { description: "Ya puedes dividir gastos contigo." })
    router.refresh()
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
      toast.success("Participante agregado correctamente 👻")

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
      toast.success("¡Participante esfumado! 👻")

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

    try {
      await saveTripAction(updatedTrip, shareToken)
      toast.success('Gasto agregado correctamente', { description: 'El sustito va creciendo 👻' })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el gasto")
    }
  }

  async function handleUpdateExpense(expense: Expense) {
    if (!trip) {
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      expenses: trip.expenses.map((item) => (item.id === expense.id ? expense : item))
    }

    try {
      await saveTripAction(updatedTrip, shareToken)
      toast.success('Gasto agregado correctamente 👻', { description: 'El sustito va creciendo' })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "No se pudo actualizar el gasto")
    }
  }

  async function handleRegisterPayment(settlement: Settlement, amount: number) {
    if (!trip) {
      return
    }

    await registerPaymentAction(
      { tripId: trip.id, from: settlement.from, to: settlement.to, amount },
      shareToken
    )

    toast.success("¡Pago registrado! 💸", { description: "Las deudas se actualizaron." })
    router.refresh()
  }

  async function handleDeletePayment(payment: Payment) {
    if (!trip) {
      return
    }

    try {
      await deletePaymentAction(trip.id, payment.id, shareToken)

      toast.success("Pago deshecho", { description: "La deuda volvió a quedar pendiente." })
      router.refresh()
    } catch (error) {
      console.error(error)
      toast.error("No se pudo deshacer el pago")
    }
  }

  async function handleDeleteExpense() {
    if (!trip || !expenseToDelete) {
      return
    }

    try {
      await deleteExpenseAction(trip.id, expenseToDelete.id, shareToken)
      toast.info('¡Gasto esfumado! 👻', { description: 'El sustito ha disminuído' })

      setExpenseToDelete(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      setExpenseToDelete(null)
      toast.error("No se pudo eliminar el gasto")
    }
  }

  if (!trip) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <p className="text-muted-foreground">Sustito no encontrado.</p>
      </main>
    )
  }

  const totalSpent = trip.expenses.reduce((total, expense) => total + expense.amount, 0)
  const theme = getTripTheme(totalSpent)
  const balances = calculateBalances(trip.people, trip.expenses, trip.payments)
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
            <div className="flex items-center gap-2">
            {trip.viewer.role === "MEMBER" && (
              <Button variant="ghost" size="sm" onClick={() => setLeaveOpen(true)}>
                <LogOut className="mr-2 size-4" />
                Salir del sustito
              </Button>
            )}

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

          </div>

          <div className="flex items-center">
            <Image src="/scary-split-logo.png" alt="Logo" width={40} height={40} />

            <h1 className="ml-1 text-3xl font-bold tracking-tight">{trip.name}</h1>

            {isTripSettled(trip) && <SettledBadge className="ml-3" />}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className={cn("relative bg-gradient-to-br text-white ring-black/10", theme.background)}>
            <Drip color={theme.drip} />

            <Image
              src="/scary-split-logo.png"
              alt=""
              width={120}
              height={120}
              className="pointer-events-none absolute -right-3 -bottom-4 size-28 rotate-6 opacity-25"
            />

            <CardHeader>
              <CardTitle className="max-w-[70%]">Total gastado</CardTitle>
            </CardHeader>

            <CardContent className="relative">
              <p className="inline-flex items-center gap-2 text-4xl font-extrabold tracking-tight text-amber-300 drop-shadow">
                <Coins className="size-8" />${formatNumber(totalSpent)}
              </p>

              <ViewerBalanceBadge trip={trip} className="mt-3" />
              <div className="gap-3 mt-4 flex flex-col text-white/75">
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

              {trip.viewer.role === "OWNER" && !trip.viewer.personId && (
                <Button type="button" variant="outline" size="sm" className="w-full" onClick={handleJoinAsParticipant}>
                  <UserPlus />
                  Sumarme a este sustito
                </Button>
              )}

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
                            <span className="flex items-center gap-2 text-sm">
                              <span
                                className={cn(
                                  "flex size-6 items-center justify-center rounded-full text-xs font-bold text-white",
                                  getAvatarColor(person.id)
                                )}
                              >
                                {person.name.trim().charAt(0).toUpperCase()}
                              </span>
                              {person.name}
                              <PersonStatus person={person} isViewer={person.id === trip.viewer.personId} />
                            </span>

                            <PersonActionsMenu
                              tripId={trip.id}
                              person={person}
                              viewerRole={trip.viewer.role}
                              viewerPersonId={trip.viewer.personId}
                              onEdit={() => handleStartEditPerson(person)}
                              onInvite={() => setPersonToInvite(person)}
                              onDelete={() => {
                                setPersonToDelete(person)
                                setDeletePersonError("")
                                setDeletePersonErrorId(null)
                              }}
                            />
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
                          <div className="flex items-center">
                          <CollapsibleTrigger className="group flex min-w-0 flex-1 items-center justify-between rounded-l-lg p-4 text-left hover:bg-muted/50">
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

                          <DropdownMenu>
                            <Tip label="Opciones">
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="mr-2 size-10 shrink-0 sm:size-8"
                                    aria-label={`Opciones de ${expense.description}`}
                                  />
                                }
                              >
                                <EllipsisVertical className="size-4" />
                              </DropdownMenuTrigger>
                            </Tip>

                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => setExpenseToEdit(expense)}>
                                <Pencil className="size-4" />
                                Editar
                              </DropdownMenuItem>

                              <DropdownMenuItem variant="destructive" onClick={() => setExpenseToDelete(expense)}>
                                <Trash2 className="size-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          </div>

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

          <Card className="relative order-first bg-gradient-to-br from-violet-50 via-white to-violet-100 ring-2 ring-violet-300/70 lg:order-none">
            <Drip color="#a78bfa" className="h-16 w-28" />

            <CardHeader>
              <CardTitle className="text-xl text-[#4a2a8f]">¿Quién le debe a quién?</CardTitle>
            </CardHeader>

            <CardContent>
              <SettlementList
                people={trip.people}
                settlements={settlements}
                payments={trip.payments}
                viewerPersonId={trip.viewer.personId}
                onRegisterPayment={handleRegisterPayment}
                onDeletePayment={handleDeletePayment}
              />
            </CardContent>
          </Card>
        </div>
      </div>
      {expenseToEdit && (
        <AddExpenseDialog
          key={expenseToEdit.id}
          people={trip.people}
          expense={expenseToEdit}
          open
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              setExpenseToEdit(null)
            }
          }}
          onAdd={() => {}}
          onUpdate={handleUpdateExpense}
        />
      )}

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
          ? (<>Se eliminará <b>{`"${personToDelete.name}"`}</b> del sustito.{personToDelete.linked && " Tiene una cuenta vinculada y perderá el acceso a este sustito."} Ésta acción no se puede deshacer.</>)
          : "Esta acción no se puede deshacer."}
        onClose={() => setPersonToDelete(null)}
        onConfirm={handleDeletePerson}
      />

      <InvitePersonDialog tripId={trip.id} person={personToInvite} onClose={() => setPersonToInvite(null)} />

      <DeleteAlertDialog
        open={leaveOpen}
        title="¿Salir de este sustito?"
        description="Dejarás de ver este sustito en tu cuenta y tu vínculo con el participante se quitará. Podrás volver si el dueño te invita otra vez."
        confirmLabel="Salir"
        onClose={() => setLeaveOpen(false)}
        onConfirm={handleLeaveTrip}
      />
    </main>
  )
}
