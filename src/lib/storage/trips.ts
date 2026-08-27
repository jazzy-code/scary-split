import type { Trip } from "@/lib/expenses/types"


const STORAGE_KEY = "scary-split-trips"

export const TRIPS_CHANGED_EVENT =
  "scary-split-trips-changed"


export function getTrips(): Trip[] {
  if (typeof window === "undefined") {
    return []
  }

  const stored =
    localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return []
  }

  try {
    return JSON.parse(stored) as Trip[]
  } catch {
    return []
  }
}


export function getTrip(
  id: string,
): Trip | null {
  const trips = getTrips()

  return (
    trips.find(
      (trip) => trip.id === id,
    ) ?? null
  )
}


export function saveTrip(
  trip: Trip,
): void {
  const trips = getTrips()

  const existingIndex =
    trips.findIndex(
      (item) => item.id === trip.id,
    )

  if (existingIndex === -1) {
    trips.push(trip)
  } else {
    trips[existingIndex] = trip
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(trips),
  )

  window.dispatchEvent(
    new Event(TRIPS_CHANGED_EVENT),
  )
}


export function createTrip(
  name: string,
  people: Trip["people"],
): Trip {
  const trip: Trip = {
    id: crypto.randomUUID(),
    name,
    people,
    expenses: [],
  }

  saveTrip(trip)

  return trip
}


export function deleteExpense(
  tripId: string,
  expenseId: string,
): Trip | null {
  const trip = getTrip(tripId)

  if (!trip) {
    return null
  }

  const updatedTrip: Trip = {
    ...trip,
    expenses: trip.expenses.filter(
      (expense) =>
        expense.id !== expenseId,
    ),
  }

  saveTrip(updatedTrip)

  return updatedTrip
}

export function deleteTrip(
  tripId: string,
): void {
  const trips = getTrips()

  const updatedTrips = trips.filter(
    (trip) => trip.id !== tripId,
  )

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(updatedTrips),
  )

  window.dispatchEvent(
    new Event(TRIPS_CHANGED_EVENT),
  )
}
