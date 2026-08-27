"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { decodeTrip } from "@/lib/sharing/trip-share"
import { saveTrip } from "@/lib/storage/trips"


export default function SharePage() {
  const router = useRouter()

  useEffect(() => {
    const hash = window.location.hash

    if (!hash) {
      router.replace("/")
      return
    }

    const encodedTrip = hash.slice(1)

    const trip = decodeTrip(encodedTrip)

    if (!trip) {
      router.replace("/")
      return
    }

    saveTrip(trip)

    router.replace(`/trip/${trip.id}`)
  }, [router])


  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="text-center">

        <h1 className="text-xl font-semibold">
          Importando viaje...
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Un momento...
        </p>

      </div>
    </main>
  )
}