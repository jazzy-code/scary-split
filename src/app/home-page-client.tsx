"use client"

import { startTransition, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

import { AuthDialog } from "@/components/auth/auth-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTripAction, deleteTripAction } from "@/features/trips/actions"
import { createTripSchema } from "@/features/trips/validations"
import { authClient } from "@/lib/auth-client"
import { formatNumber } from "@/lib/utils"
import type { Trip } from "@/lib/expenses/types"
import { HomeHero } from "@/components/home/home-hero"
import { TripCard } from "@/components/trips/trip-card"
import { DeleteAlertDialog } from "@/components/alert-dialogs/delete-alert-dialog"

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
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null)
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

  async function handleDeleteTrip() {
    if (!tripToDelete) {
      return
    }

    try {
      await deleteTripAction(tripToDelete.id)
      toast.success("¡Se esfumó! 👻", { description: "El sustito fue eliminado." })
      setTripToDelete(null)
      router.refresh()
    } catch (error) {
      console.error(error)
      setTripToDelete(null)
      toast.error("No se pudo eliminar el sustito")
    }
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
        <div className="mx-auto max-w-6xl">
          <HomeHero />

          <div className="mt-8 grid gap-8 lg:grid-cols-[22rem_1fr] lg:items-start">
            <Card className="lg:sticky lg:top-20">
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
                      <Plus />
                      Agregar
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
                          onClick={() => removePerson(person)}>
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

            <section>
              <div className="mb-4">
                <h2 className="text-2xl font-semibold">Mis sustitos</h2>

                <p className="text-sm text-muted-foreground">
                  Aquí verás los sustitos de viajes o eventos pasados que hayas creado.
                </p>
              </div>

              {trips.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center py-10 text-center">
                    <Image src="/scary-split-logo.png" alt="" width={96} height={96} className="opacity-80" />

                    <p className="mt-2 text-muted-foreground">Aún no hay sustitos por aquí... qué espeluznante.</p>

                    <p className="mt-1 text-sm text-muted-foreground">Crea tu primer sustito arriba.</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    {[
                      { label: "Sustitos", value: trips.length },
                      { label: "Gastos", value: trips.reduce((total, trip) => total + trip.expenses.length, 0) },
                      {
                        label: "Total gastado",
                        value: `$${formatNumber(trips.reduce((total, trip) => total + getTotalSpent(trip), 0))}`
                      }
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="rounded-2xl bg-card px-4 py-3 shadow-sm ring-1 ring-foreground/10">
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                        <p className="truncate font-heading text-xl font-bold text-[#4a2a8f]">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {trips.map((trip) => (
                      <TripCard key={trip.id} trip={trip} totalSpent={getTotalSpent(trip)} onDelete={setTripToDelete} />
                    ))}
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>

      <DeleteAlertDialog
        open={!!tripToDelete}
        title="¿Eliminar este Sustito?"
        description={
          tripToDelete ? (
            <>
              Se eliminará el sustito <b>{`"${tripToDelete.name}"`}</b>. Ésta acción no se puede deshacer.
            </>
          ) : (
            "Esta acción no se puede deshacer."
          )
        }
        onClose={() => setTripToDelete(null)}
        onConfirm={handleDeleteTrip}
      />

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} onAuthenticated={handleAuthenticated} />
    </>
  )
}
