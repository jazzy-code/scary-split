import type { Trip } from "@/lib/expenses/types"

const STORAGE_KEY = "scary-split-trips"

export function getTrips(): Trip[] {
  if (typeof window === "undefined") {
    return []
  }

  const stored = localStorage.getItem(STORAGE_KEY)

  console.log("stored", stored)

  if (!stored) {
    return []
  }

  try {
    return JSON.parse(stored) as Trip[]
  } catch {
    return []
  }
}

export function getTrip(id: string): Trip | null {
  const trips = getTrips()

  return trips.find((trip) => trip.id === id) ?? null
}

export function saveTrip(trip: Trip): void {
  const trips = getTrips()

  const existingIndex = trips.findIndex(
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
}

export function updateExpense(
  tripId: string,
  expense: Trip["expenses"][number],
): Trip | null {
  const trip = getTrip(tripId)

  if (!trip) {
    return null
  }

  const expenseIndex = trip.expenses.findIndex(
    (item) => item.id === expense.id,
  )

  if (expenseIndex === -1) {
    return null
  }

  const updatedTrip: Trip = {
    ...trip,
    expenses: trip.expenses.map((item) =>
      item.id === expense.id
        ? expense
        : item,
    ),
  }

  saveTrip(updatedTrip)

  return updatedTrip
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
      (expense) => expense.id !== expenseId,
    ),
  }

  saveTrip(updatedTrip)

  return updatedTrip
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

