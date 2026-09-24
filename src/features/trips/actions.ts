"use server"

import { revalidatePath } from "next/cache"

import { getCurrentSession, requireSession } from "@/lib/auth-utils"

import {
  createTrip as createTripService,
  deleteExpense as deleteExpenseService,
  deleteTrip as deleteTripService,
  getTrip as getTripService,
  getTrips as getTripsService,
  saveTrip as saveTripService
} from "./service"
import { createTripShare } from "./sharing"

import type { CreateTripInput, SaveTripInput } from "./types"
import { createTripSchema, saveTripSchema, tripIdSchema } from "./validations"

export async function getTripsAction() {
  const session = await requireSession()

  return getTripsService(session.user.id)
}

export async function getTripAction(tripId: string, shareToken?: string) {
  const session = await getCurrentSession()

  const { tripId: validatedTripId } = tripIdSchema.parse({ tripId })

  return getTripService(validatedTripId, {
    userId: session?.user.id,
    shareToken
  })
}

export async function createTripAction(input: CreateTripInput) {
  const session = await requireSession()
  const validatedInput = createTripSchema.parse(input)

  const trip = await createTripService(validatedInput, session.user.id)

  revalidatePath("/")

  return trip
}

export async function createTripShareAction(tripId: string) {
  const session = await requireSession()
  const { tripId: validatedTripId } = tripIdSchema.parse({ tripId })

  const trip = await getTripService(validatedTripId, {
    userId: session.user.id
  })

  if (!trip) {
    throw new Error("Trip not found")
  }

  const token = await createTripShare(validatedTripId)

  return token
}

export async function saveTripAction(input: SaveTripInput, shareToken?: string) {
  const session = await getCurrentSession()
  const validatedInput = saveTripSchema.parse(input)

  const trip = await saveTripService(validatedInput, {
    userId: session?.user.id,
    shareToken
  })

  revalidatePath(`/trip/${trip.id}`)
  revalidatePath("/")

  return trip
}

export async function deleteExpenseAction(tripId: string, expenseId: string, shareToken?: string) {
  const session = await getCurrentSession()
  const { tripId: validatedTripId } = tripIdSchema.parse({ tripId })

  const trip = await deleteExpenseService(validatedTripId, expenseId, {
    userId: session?.user.id,
    shareToken
  })

  revalidatePath(`/trip/${trip.id}`)
  revalidatePath("/")

  return trip
}

export async function deleteTripAction(tripId: string) {
  const session = await requireSession()
  const { tripId: validatedTripId } = tripIdSchema.parse({ tripId })

  await deleteTripService(validatedTripId, session.user.id)

  revalidatePath("/")
}
