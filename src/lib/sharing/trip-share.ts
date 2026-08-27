import type { Trip } from "@/lib/expenses/types"

function encodeBase64(value: string): string {
  return btoa(
    encodeURIComponent(value).replace(
      /%([0-9A-F]{2})/g,
      (_, p1) =>
        String.fromCharCode(
          Number.parseInt(p1, 16),
        ),
    ),
  )
}

function decodeBase64(value: string): string {
  return decodeURIComponent(
    Array.from(
      atob(value),
      (character) =>
        `%${character.charCodeAt(0)
          .toString(16)
          .padStart(2, "0")}`,
    ).join(""),
  )
}


export function encodeTrip(trip: Trip): string {
  return encodeBase64(
    JSON.stringify(trip),
  )
}


export function decodeTrip(
  encodedTrip: string,
): Trip | null {
  try {
    const decoded = decodeBase64(encodedTrip)

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