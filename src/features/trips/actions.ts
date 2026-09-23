"use server"

import { revalidatePath } from "next/cache"

import { requireSession } from "@/lib/auth-utils"

import {
  createTrip as createTripService,
  deleteExpense as deleteExpenseService,
  deleteTrip as deleteTripService,
  getTrip as getTripService,
  getTrips as getTripsService,
  saveTrip as saveTripService
} from "./service"

import type { CreateTripInput, SaveTripInput } from "./types"

export async function getTripsAction() {
  const session = await requireSession()
  return getTripsService(session.user.id)
}

export async function getTripAction(tripId: string) {
  const session = await requireSession()
  return getTripService(tripId, session.user.id)
}

export async function createTripAction(input: CreateTripInput) {
  const session = await requireSession()
  const trip = await createTripService(input, session.user.id)

  revalidatePath("/")
  revalidatePath(`/trip/${trip.id}`)

  return trip
}

export async function saveTripAction(input: SaveTripInput) {
  const session = await requireSession()
  const trip = await saveTripService(input, session.user.id)

  revalidatePath(`/trip/${trip.id}`)
  revalidatePath("/")

  return trip
}

export async function deleteExpenseAction(tripId: string, expenseId: string) {
  const session = await requireSession()
  const trip = await deleteExpenseService(tripId, expenseId, session.user.id)

  revalidatePath(`/trip/${tripId}`)
  revalidatePath("/")

  return trip
}

export async function deleteTripAction(tripId: string) {
  const session = await requireSession()
  await deleteTripService(tripId, session.user.id)

  revalidatePath("/")
  revalidatePath(`/trip/${tripId}`)
}
