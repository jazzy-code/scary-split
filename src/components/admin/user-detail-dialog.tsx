"use client"

import { useEffect, useState } from "react"
import { ArrowRight, ChevronDown, Crown, Loader2 } from "lucide-react"

import { formatDate, formatDateTime } from "@/components/admin/format"
import { UserAvatar } from "@/components/profile/user-avatar"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { getAdminUserDetailAction } from "@/features/admin/user-detail"
import type { AdminTripDetail, AdminUserDetail } from "@/features/admin/user-detail-types"
import type { AdminUserRow } from "@/features/admin/users-query"

const money = (value: number) => `$${value.toLocaleString("es-MX", { maximumFractionDigits: 2 })}`

type UserDetailDialogProps = {
  user: AdminUserRow | null
  onClose: () => void
}

export function UserDetailDialog({ user, onClose }: UserDetailDialogProps) {
  return (
    <Dialog
      open={!!user}
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-3xl">
        {/* Se remonta por usuario para no mostrar datos del anterior mientras carga */}
        {user && <UserDetailBody key={user.id} user={user} />}
      </DialogContent>
    </Dialog>
  )
}

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; detail: AdminUserDetail }

function UserDetailBody({ user }: { user: AdminUserRow }) {
  const [state, setState] = useState<LoadState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false

    getAdminUserDetailAction(user.id)
      .then((result) => {
        if (!cancelled) {
          setState(result.ok ? { status: "ready", detail: result.detail } : { status: "error", message: result.message })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: "error", message: "No se pudo cargar la información de este usuario" })
        }
      })

    return () => {
      cancelled = true
    }
  }, [user.id])

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3 pr-8">
          <UserAvatar name={user.name} image={user.image} size="lg" />

          <div className="min-w-0">
            <DialogTitle className="truncate">{user.name}</DialogTitle>
            <DialogDescription className="truncate">{user.email}</DialogDescription>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Registrado el {formatDate(user.createdAt)} · Última sesión: {formatDateTime(user.lastLoginAt)}
        </p>
      </DialogHeader>

      <div className="-mx-4 min-h-0 flex-1 space-y-6 overflow-y-auto px-4 pb-1">
        {state.status === "loading" && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Cargando sustitos…
          </div>
        )}

        {state.status === "error" && <p className="py-10 text-center text-destructive">{state.message}</p>}

        {state.status === "ready" && (
          <>
            <TripSection title="Sustitos creados" trips={state.detail.created} />
            <TripSection title="Sustitos como invitado" trips={state.detail.invited} showOwner />
          </>
        )}
      </div>
    </>
  )
}

function TripSection({ title, trips, showOwner }: { title: string; trips: AdminTripDetail[]; showOwner?: boolean }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">
        {title} <span className="font-normal text-muted-foreground">({trips.length})</span>
      </h3>

      {trips.length === 0 ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-muted-foreground">Ninguno todavía.</p>
      ) : (
        trips.map((trip) => <TripCard key={trip.id} trip={trip} showOwner={showOwner} />)
      )}
    </section>
  )
}

function TripCard({ trip, showOwner }: { trip: AdminTripDetail; showOwner?: boolean }) {
  return (
    <Collapsible className="rounded-xl border bg-background">
      <CollapsibleTrigger className="group flex w-full items-center gap-3 p-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{trip.name}</span>

            {trip.settled ? (
              <Badge className="bg-emerald-100 text-emerald-700">Saldado</Badge>
            ) : (
              <Badge variant="secondary">{trip.expenses.length === 0 ? "Sin gastos" : "Pendiente"}</Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {trip.people.length} {trip.people.length === 1 ? "persona" : "personas"} · {trip.expenses.length}{" "}
            {trip.expenses.length === 1 ? "gasto" : "gastos"} · {money(trip.expensesTotal)} · creado el{" "}
            {formatDate(trip.createdAt)}
            {showOwner && trip.ownerName && <> · dueño: {trip.ownerName}</>}
          </p>
        </div>

        <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-aria-expanded:rotate-180" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="space-y-4 border-t p-3">
          <Block title="Participantes">
            <div className="flex flex-wrap gap-1.5">
              {trip.people.map((person) => (
                <Badge key={person.id} variant="outline" className="h-6 gap-1.5">
                  {person.role === "OWNER" && <Crown className="text-amber-500" />}
                  {person.name}
                  {person.isThisUser && <span className="text-violet-600">(este usuario)</span>}
                  {person.linked && !person.isThisUser && <span className="text-emerald-600">con cuenta</span>}
                </Badge>
              ))}
            </div>
          </Block>

          <Block title={`Gastos (${trip.expenses.length})`}>
            {trip.expenses.length === 0 ? (
              <Empty>Sin gastos registrados.</Empty>
            ) : (
              <ul className="divide-y rounded-lg border">
                {trip.expenses.map((expense) => (
                  <li key={expense.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate font-medium">{expense.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Pagó {expense.paidByName} · {expense.participantCount} participan ·{" "}
                        {expense.splitType === "equal" ? "partes iguales" : "montos personalizados"} ·{" "}
                        {formatDate(expense.createdAt)}
                      </p>
                    </div>

                    <span className="shrink-0 font-medium">{money(expense.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          <Block title={`Pagos registrados (${trip.payments.length})`}>
            {trip.payments.length === 0 ? (
              <Empty>Aún no se registran pagos.</Empty>
            ) : (
              <ul className="divide-y rounded-lg border">
                {trip.payments.map((payment) => (
                  <li key={payment.id} className="flex items-center justify-between gap-3 px-3 py-2">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-medium">
                        {payment.fromName}
                        <ArrowRight className="size-3.5 text-muted-foreground" />
                        {payment.toName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(payment.createdAt)}
                        {payment.createdByName && <> · registrado por {payment.createdByName}</>}
                      </p>
                    </div>

                    <span className="shrink-0 font-medium">{money(payment.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Block>

          {trip.pending.length > 0 && (
            <Block title="Falta por pagar">
              <ul className="space-y-1">
                {trip.pending.map((transfer, index) => (
                  <li key={index} className="flex items-center justify-between gap-3">
                    <span className="flex flex-wrap items-center gap-1.5">
                      {transfer.fromName}
                      <ArrowRight className="size-3.5 text-muted-foreground" />
                      {transfer.toName}
                    </span>

                    <span className="font-medium">{money(transfer.amount)}</span>
                  </li>
                ))}
              </ul>
            </Block>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h4>
      {children}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground">{children}</p>
}
