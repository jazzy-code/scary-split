"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createTrip } from "@/lib/storage/trips"
import { Upload } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  const [tripName, setTripName] = useState("")
  const [personName, setPersonName] = useState("")
  const [people, setPeople] = useState<string[]>([])

  function addPerson() {
    const name = personName.trim()

    if (!name) {
      return
    }

    if (
      people.some(
        (person) => person.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return
    }

    setPeople((current) => [...current, name])
    setPersonName("")
  }

  function removePerson(name: string) {
    setPeople((current) =>
      current.filter((person) => person !== name),
    )
  }

  function handleCreateTrip() {
    const name = tripName.trim()

    if (!name || people.length < 2) {
      return
    }

    const trip = createTrip(
      name,
      people.map((person) => ({
        id: crypto.randomUUID(),
        name: person,
      })),
    )

    router.push(`/trip/${trip.id}`)
  }

  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">
            Scary Split
          </h1>

          <p className="mt-2 text-muted-foreground">
            Divide los gastos de tu viaje sin complicarte.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Crear viaje</CardTitle>
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
                  setTripName(event.target.value)
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
                    setPersonName(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
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
                {people.map((person) => (
                  <div
                    key={person}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <span>{person}</span>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removePerson(person)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button
              className="w-full"
              disabled={
                !tripName.trim() || people.length < 2
              }
              onClick={handleCreateTrip}
            >
              Crear viaje
            </Button>
          </CardContent>
        </Card>

        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              ¿Ya tienes un viaje?
            </CardTitle>
          </CardHeader>

          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Importa un viaje que alguien haya
              compartido contigo.
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                router.push("/import")
              }
            >
              <Upload className="mr-2 size-4" />
              Importar viaje
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
