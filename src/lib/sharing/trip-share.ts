import type { Trip } from "@/lib/expenses/types"
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string"


export function encodeTrip(trip: Trip): string {
  return compressToEncodedURIComponent(
    JSON.stringify(trip),
  )
}


export function decodeTrip(
  encodedTrip: string,
): Trip | null {
  try {
    const decoded =
      decompressFromEncodedURIComponent(
        encodedTrip,
      )

    if (!decoded) {
      return null
    }

    const trip = JSON.parse(decoded) as Trip

    if (!isValidTrip(trip)) {
      return null
    }

    return trip
  } catch {
    return null
  }
}


function isValidTrip(
  value: unknown,
): value is Trip {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false
  }

  const trip = value as Partial<Trip>

  if (
    typeof trip.id !== "string" ||
    typeof trip.name !== "string" ||
    !Array.isArray(trip.people) ||
    !Array.isArray(trip.expenses)
  ) {
    return false
  }

  return true
}


export function createShareUrl(
  trip: Trip,
): string {
  const encodedTrip = encodeTrip(trip)

  return `${window.location.origin}/share#${encodedTrip}`
}
