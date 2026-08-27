"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import {
  deleteTrip,
  createTrip,
} from "@/lib/storage/trips"

import type { Trip } from "@/lib/expenses/types"
import { useTrips } from "@/lib/storage/use-trips"
import { formatNumber } from "@/lib/utils"


export default function HomePage() {
  const router = useRouter()

  const trips = useTrips()

  const [tripName, setTripName] =
    useState("")

  const [personName, setPersonName] =
    useState("")

  const [people, setPeople] =
    useState<string[]>([])


  function addPerson() {
    const name = personName.trim()

    if (!name) {
      return
    }

    if (
      people.some(
        (person) =>
          person.toLowerCase() ===
          name.toLowerCase(),
      )
    ) {
      return
    }

    setPeople((current) => [
      ...current,
      name,
    ])

    setPersonName("")
  }


  function removePerson(
    name: string,
  ) {
    setPeople((current) =>
      current.filter(
        (person) =>
          person !== name,
      ),
    )
  }


  function handleCreateTrip() {
    const name = tripName.trim()

    if (
      !name ||
      people.length < 2
    ) {
      return
    }

    const trip = createTrip(
      name,
      people.map((person) => ({
        id: crypto.randomUUID(),
        name: person,
      })),
    )

    router.push(
      `/trip/${trip.id}`,
    )
  }


  function handleDeleteTrip(
    trip: Trip,
  ) {
    const confirmed =
      window.confirm(
        `¿Eliminar el viaje "${trip.name}"? Esta acción no se puede deshacer.`,
      )

    if (!confirmed) {
      return
    }

    deleteTrip(trip.id)
  }


  function getTotalSpent(
    trip: Trip,
  ) {
    return trip.expenses.reduce(
      (total, expense) =>
        total + expense.amount,
      0,
    )
  }


  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-xl">

        {/* Header */}

        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Scary Split
          </h1>

          <p className="mt-2 text-muted-foreground">
            Divide los gastos de tu viaje
            sin complicarte.
          </p>
        </div>


        {/* Create trip */}

        <Card>

          <CardHeader>
            <CardTitle>
              Crear viaje
            </CardTitle>
          </CardHeader>


          <CardContent className="space-y-6">

            <div className="space-y-2">

              <Label htmlFor="trip-name">
                Nombre del viaje
              </Label>

              <Input
                id="trip-name"
                placeholder="Puerto Vallarta 2026"
                value={tripName}
                onChange={(event) =>
                  setTripName(
                    event.target.value,
                  )
                }
              />

            </div>


            <div className="space-y-2">

              <Label htmlFor="person">
                Participantes
              </Label>

              <div className="flex gap-2">

                <Input
                  id="person"
                  placeholder="Nombre"
                  value={personName}
                  onChange={(event) =>
                    setPersonName(
                      event.target.value,
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key ===
                      "Enter"
                    ) {
                      event.preventDefault()
                      addPerson()
                    }
                  }}
                />

                <Button
                  type="button"
                  variant="secondary"
                  onClick={addPerson}
                >
                  Agregar
                </Button>

              </div>

            </div>


            {people.length > 0 && (
              <div className="space-y-2">

                {people.map(
                  (person) => (
                    <div
                      key={person}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >

                      <span>
                        {person}
                      </span>

                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          removePerson(
                            person,
                          )
                        }
                      >
                        Eliminar
                      </Button>

                    </div>
                  ),
                )}

              </div>
            )}


            <Button
              className="w-full"
              disabled={
                !tripName.trim() ||
                people.length < 2
              }
              onClick={
                handleCreateTrip
              }
            >
              Crear viaje
            </Button>

          </CardContent>

        </Card>


        {/* Saved trips */}

        <section className="mt-8">

          <div className="mb-4">

            <h2 className="text-xl font-semibold">
              Mis viajes
            </h2>

            <p className="text-sm text-muted-foreground">
              Viajes guardados en este
              navegador.
            </p>

          </div>


          {trips.length === 0 ? (

            <Card>

              <CardContent className="py-10 text-center">

                <p className="text-muted-foreground">
                  No tienes viajes guardados.
                </p>

                <p className="mt-1 text-sm text-muted-foreground">
                  Crea tu primer viaje
                  arriba.
                </p>

              </CardContent>

            </Card>

          ) : (

            <div className="space-y-3">

              {trips.map((trip) => {

                const totalSpent =
                  getTotalSpent(trip)


                return (

                  <Card
                    key={trip.id}
                  >

                    <CardContent className="flex items-center justify-between gap-4 p-4">

                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() =>
                          router.push(
                            `/trip/${trip.id}`,
                          )
                        }
                      >

                        <p className="truncate font-semibold">
                          {trip.name}
                        </p>


                        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">

                          <span>
                            {trip.people.length}{" "}
                            {trip.people.length ===
                              1
                              ? "participante"
                              : "participantes"}
                          </span>

                          <span>
                            {trip.expenses.length}{" "}
                            {trip.expenses.length ===
                              1
                              ? "gasto"
                              : "gastos"}
                          </span>

                          <span>
                            ${formatNumber(
                              totalSpent
                            )}
                          </span>

                        </div>

                      </button>


                      <div className="flex shrink-0 items-center gap-1">

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleDeleteTrip(
                              trip,
                            )
                          }
                          aria-label={`Eliminar ${trip.name}`}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>


                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(
                              `/trip/${trip.id}`,
                            )
                          }
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
