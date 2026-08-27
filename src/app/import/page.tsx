"use client"

import { useState, type SetStateAction } from "react"
import { useRouter } from "next/navigation"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import {
  decodeTrip,
} from "@/lib/sharing/trip-share"

import {
  saveTrip,
} from "@/lib/storage/trips"


export default function ImportPage() {
  const router = useRouter()

  const [value, setValue] = useState("")
  const [error, setError] = useState("")


  function handleImport() {
    setError("")

    const input = value.trim()

    if (!input) {
      setError(
        "Pega el enlace o JSON del viaje.",
      )

      return
    }


    let trip = null


    /*
     * Importar mediante URL
     */

    try {
      if (
        input.startsWith("http://") ||
        input.startsWith("https://")
      ) {
        const url = new URL(input)

        const hash =
          url.hash.slice(1)

        if (hash) {
          trip = decodeTrip(hash)
        }
      }
    } catch {
      // Continuamos intentando JSON
    }


    /*
     * Importar mediante JSON
     */

    if (!trip) {
      try {
        const parsed =
          JSON.parse(input)

        if (
          parsed &&
          typeof parsed === "object" &&
          typeof parsed.id === "string" &&
          typeof parsed.name === "string" &&
          Array.isArray(parsed.people) &&
          Array.isArray(parsed.expenses)
        ) {
          trip = parsed
        }
      } catch {
        // JSON inválido
      }
    }


    if (!trip) {
      setError(
        "El viaje no es válido. Verifica que hayas copiado correctamente el enlace o JSON.",
      )

      return
    }


    saveTrip(trip)

    router.push(`/trip/${trip.id}`)
  }


  return (
    <main className="min-h-screen px-4 py-12">
      <div className="mx-auto max-w-2xl">

        <div className="mb-8">

          <p className="text-sm text-muted-foreground">
            Scary Split
          </p>

          <h1 className="text-3xl font-bold tracking-tight">
            Importar viaje
          </h1>

          <p className="mt-2 text-muted-foreground">
            Pega el enlace o JSON que te
            compartieron.
          </p>

        </div>


        <Card>

          <CardHeader>
            <CardTitle>
              Datos del viaje
            </CardTitle>
          </CardHeader>


          <CardContent className="space-y-4">

            <div className="space-y-2">

              <Label htmlFor="trip-data">
                Enlace o JSON
              </Label>

              <Textarea
                id="trip-data"
                placeholder="https://.../share#eyJpZCI6..."
                value={value}
                onChange={(event: { target: { value: SetStateAction<string> } }) =>
                  setValue(
                    event.target.value,
                  )
                }
                className="min-h-40 font-mono text-xs"
              />

            </div>


            {error && (
              <p className="text-sm text-destructive">
                {error}
              </p>
            )}


            <Button
              className="w-full"
              onClick={handleImport}
            >
              Importar viaje
            </Button>


            <Button
              variant="ghost"
              className="w-full"
              onClick={() =>
                router.push("/")
              }
            >
              Cancelar
            </Button>

          </CardContent>

        </Card>

      </div>
    </main>
  )
}