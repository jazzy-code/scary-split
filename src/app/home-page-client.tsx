"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowRight, Trash2 } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTripAction, deleteTripAction } from "@/features/trips/actions"
import { createTripSchema } from "@/features/trips/validations"
import type { Trip } from "@/lib/expenses/types"
import { formatNumber } from "@/lib/utils"

type HomePageClientProps = {
  trips: Trip[]
}

export default function HomePageClient({ trips }: HomePageClientProps) {
  const router = useRouter()

  const [tripName, setTripName] = useState("")
  const [personName, setPersonName] = useState("")
  const [people, setPeople] = useState<string[]>([])
  const [errors, setErrors] = useState<{
    name?: string
    people?: string
  }>({})
  const [isCreating, setIsCreating] = useState(false)

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

  async function handleCreateTrip() {
    const input = {
      name: tripName,
      people: people.map((person) => ({
        id: crypto.randomUUID(),
        name: person
      }))
    }

    const result = createTripSchema.safeParse(input)

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

  return (
    <main className="min-h-screen px-4 py-4 md:py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <Image src="/scary-split-logo.png" alt="Logo" width={70} height={70} />
            <h1 className="text-4xl font-bold tracking-tight">Scary Split</h1>
          </div>

          <p className="mt-2 text-muted-foreground">Divide los gastos de tu sustito sin complicarte.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
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

                  <Button type="button" variant="secondary" onClick={addPerson}>
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

                      <Button type="button" variant="ghost" size="sm" onClick={() => removePerson(person)}>
                        Eliminar
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <Button
                className="w-full"
                disabled={isCreating}
                onClick={handleCreateTrip}
              >
                {isCreating ? "Creando..." : "Crear sustito"}
              </Button>
            </CardContent>
          </Card>
        </div>

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
                    <CardContent className="flex items-center justify-between gap-4 p-4">
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
  )
}
