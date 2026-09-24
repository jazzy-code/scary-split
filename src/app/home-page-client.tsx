"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, CalendarDays, Clock3, Loader2, Plus, Trash2 } from "lucide-react"
import Image from "next/image"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTripAction, deleteTripAction } from "@/features/trips/actions"
import { createTripSchema } from "@/features/trips/validations"
import { authClient } from "@/lib/auth-client"
import type { Trip } from "@/lib/expenses/types"
import { formatNumber } from "@/lib/utils"

type HomePageClientProps = {
  trips: Trip[]
}

type PendingTrip = {
  name: string
  people: string[]
}

const PENDING_TRIP_STORAGE_KEY = "pending-trip"

function getPendingTrip(): PendingTrip | null {
  const pendingTrip = sessionStorage.getItem(PENDING_TRIP_STORAGE_KEY)

  if (!pendingTrip) {
    return null
  }

  try {
    return JSON.parse(pendingTrip) as PendingTrip
  } catch {
    sessionStorage.removeItem(PENDING_TRIP_STORAGE_KEY)
    return null
  }
}

export default function HomePageClient({ trips }: HomePageClientProps) {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const isProcessingPendingTrip = useRef(false)

  const [tripName, setTripName] = useState("")
  const [personName, setPersonName] = useState("")
  const [people, setPeople] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    name?: string
    people?: string
  }>({})
  const [isCreating, setIsCreating] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  function savePendingTrip() {
    const pendingTrip: PendingTrip = {
      name: tripName,
      people
    }

    sessionStorage.setItem(PENDING_TRIP_STORAGE_KEY, JSON.stringify(pendingTrip))
  }

  function addPerson() {
    const name = personName.trim()

    if (!name) {
      return
    }

    if (people.some((person) => person.toLowerCase() === name.toLowerCase())) {
      setErrors((current) => ({
        ...current,
        people: "Ya existe un participante con ese nombre"
      }))
      return
    }

    setPeople((current) => [...current, name])
    setPersonName("")
    setErrors((current) => ({ ...current, people: undefined }))
  }

  function removePerson(name: string) {
    setPeople((current) => current.filter((person) => person !== name))
  }

  function getCreateTripInput() {
    return {
      name: tripName,
      people: people.map((person) => ({
        id: crypto.randomUUID(),
        name: person
      }))
    }
  }

  async function createTrip() {
    const result = createTripSchema.safeParse(getCreateTripInput())

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors

      setErrors({
        name: fieldErrors.name?.[0],
        people: fieldErrors.people?.[0]
      })

      return
    }

    setErrors({})
    setIsCreating(true)

    try {
      const trip = await createTripAction(result.data)
      router.push(`/trip/${trip.id}`)
    } catch (error) {
      setIsCreating(false)
      console.error(error)
    }
  }

  async function handleCreateTrip() {
    const result = createTripSchema.safeParse(getCreateTripInput())

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors

      setErrors({
        name: fieldErrors.name?.[0],
        people: fieldErrors.people?.[0]
      })

      return
    }

    setErrors({})

    if (!session) {
      savePendingTrip()
      setAuthOpen(true)
      return
    }

    await createTrip()
  }

  async function handleAuthenticated() {
    sessionStorage.removeItem(PENDING_TRIP_STORAGE_KEY)
    setAuthOpen(false)
    await createTrip()
  }

  async function handleDeleteTrip(trip: Trip) {
    const confirmed = window.confirm(`¿Eliminar el sustito "${trip.name}"? Esta acción no se puede deshacer.`)

    if (!confirmed) {
      return
    }

    await deleteTripAction(trip.id)
    router.refresh()
  }

  function getTotalSpent(trip: Trip) {
    return trip.expenses.reduce((total, expense) => total + expense.amount, 0)
  }

  useEffect(() => {
    const pendingTrip = getPendingTrip()

    if (!pendingTrip) {
      return
    }

    startTransition(() => {
      setTripName(pendingTrip.name)
      setPeople(pendingTrip.people)
      setIsCreating(true)
    })
  }, [])

  useEffect(() => {
    if (!session || isProcessingPendingTrip.current) {
      return
    }

    isProcessingPendingTrip.current = true

    async function processPendingTrip() {
      const pendingTrip = sessionStorage.getItem(PENDING_TRIP_STORAGE_KEY)

      if (!pendingTrip) {
        isProcessingPendingTrip.current = false
        return
      }

      try {
        const parsedTrip = JSON.parse(pendingTrip) as PendingTrip

        const result = createTripSchema.safeParse({
          name: parsedTrip.name,
          people: parsedTrip.people.map((person) => ({
            id: crypto.randomUUID(),
            name: person
          }))
        })

        if (!result.success) {
          sessionStorage.removeItem(PENDING_TRIP_STORAGE_KEY)
          isProcessingPendingTrip.current = false
          return
        }

        const trip = await createTripAction(result.data)

        sessionStorage.removeItem(PENDING_TRIP_STORAGE_KEY)
        router.push(`/trip/${trip.id}`)
      } catch (error) {
        console.error(error)
        isProcessingPendingTrip.current = false
        setIsCreating(false)
      }
    }

    processPendingTrip()
  }, [session, router])

  return (
    <>
      <main className="min-h-screen px-4 py-4 md:py-12">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8">
            <div className="flex items-center gap-2">
              <Image src="/scary-split-logo.png" alt="Logo" width={70} height={70} />
              <h1 className="text-4xl font-bold tracking-tight">Scary Split</h1>
            </div>

            <p className="mt-2 text-muted-foreground">Divide los gastos de tu sustito sin complicarte.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Crear sustito</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="trip-name">Nombre del sustito</Label>

                <Input
                  id="trip-name"
                  placeholder="Puerto Vallarta 2026"
                  value={tripName}
                  disabled={isCreating}
                  aria-invalid={!!errors.name}
                  onChange={(event) => {
                    setTripName(event.target.value)

                    if (errors.name) {
                      setErrors((current) => ({
                        ...current,
                        name: undefined
                      }))
                    }
                  }}
                />

                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="person">Participantes</Label>

                <div className="flex gap-2">
                  <Input
                    id="person"
                    placeholder="Nombre"
                    value={personName}
                    disabled={isCreating}
                    aria-invalid={!!errors.people}
                    onChange={(event) => {
                      setPersonName(event.target.value)

                      if (errors.people) {
                        setErrors((current) => ({ ...current, people: undefined }))
                      }
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        addPerson()
                      }
                    }}
                  />

                  <Button type="button" variant="secondary" disabled={isCreating} onClick={addPerson}>
                    <Plus />Agregar
                  </Button>
                </div>

                {errors.people && <p className="text-sm text-destructive">{errors.people}</p>}
              </div>

              {people.length > 0 && (
                <div className="space-y-2">
                  {people.map((person) => (
                    <div key={person} className="flex items-center justify-between rounded-lg border px-3 py-2">
                      <span>{person}</span>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        disabled={isCreating}
                        onClick={() => removePerson(person)}
                      >
                        <Trash2 />
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button className="w-full" disabled={isCreating} onClick={handleCreateTrip}>
                {isCreating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creando sustito
                  </>
                ) : (
                  "Crear sustito"
                )}
              </Button>
            </CardContent>
          </Card>

          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Mis sustitos</h2>

              <p className="text-sm text-muted-foreground">
                Aquí verás los sustitos de viajes o eventos pasados que hayas creado.
              </p>
            </div>

            {trips.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center">
                  <p className="text-muted-foreground">No tienes sustitos guardados.</p>

                  <p className="mt-1 text-sm text-muted-foreground">Crea tu primer sustito arriba.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const totalSpent = getTotalSpent(trip)

                  return (
                    <Card key={trip.id}>
                      <CardContent className="flex items-center justify-between gap-4 px-4">
                        <button
                          type="button"
                          className="min-w-0 flex-1 text-left"
                          onClick={() => router.push(`/trip/${trip.id}`)}
                        >
                          <p className="truncate font-semibold">{trip.name}</p>

                          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
                            <span>
                              {trip.people.length} {trip.people.length === 1 ? "participante" : "participantes"}
                            </span>

                            <span>
                              {trip.expenses.length} {trip.expenses.length === 1 ? "gasto" : "gastos"}
                            </span>

                            <span>${formatNumber(totalSpent)}</span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="size-3.5" />
                              Creado: {new Date(trip.createdAt).toLocaleDateString("es-MX")}
                            </span>

                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="size-3.5" />
                              Actualizado: {new Date(trip.updatedAt).toLocaleDateString("es-MX")}
                            </span>
                          </div>
                        </button>

                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTrip(trip)}
                            aria-label={`Eliminar ${trip.name}`}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/trip/${trip.id}`)}
                            aria-label={`Abrir ${trip.name}`}
                          >
                            <ArrowRight className="size-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={handleAuthenticated} />
    </>
  )
}
