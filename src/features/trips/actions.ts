"use server"

import { revalidatePath } from "next/cache"

import { getCurrentSession, requireSession } from "@/lib/auth-utils"

import {
  createTrip as createTripService,
  deleteExpense as deleteExpenseService,
  deletePayment as deletePaymentService,
  deleteTrip as deleteTripService,
  getTrip as getTripService,
  getTrips as getTripsService,
  registerPayment as registerPaymentService,
  saveTrip as saveTripService
} from "./service"
import { TripAccessError } from "./errors"
import { createTripShare } from "./sharing"

import type { CreateTripInput, RegisterPaymentInput, SaveTripInput } from "./types"
import { createTripSchema, paymentIdSchema, registerPaymentSchema, saveTripSchema, tripIdSchema } from "./validations"

export async function getTripsAction() {
  const session = await getCurrentSession()

  if (!session) {
    return []
  }

  return getTripsService(session.user.id)
}

export async function getTripAction(tripId: string, shareToken?: string) {
  const session = await getCurrentSession()

  const parsedTripId = tripIdSchema.safeParse({ tripId })

  if (!parsedTripId.success) {
    return null
  }

  try {
    return await getTripService(parsedTripId.data.tripId, {
      userId: session?.user.id,
      shareToken
    })
  } catch (error) {
    if (error instanceof TripAccessError) {
      return null
    }

    throw error
  }
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

export async function registerPaymentAction(input: RegisterPaymentInput, shareToken?: string) {
  const session = await getCurrentSession()
  const validatedInput = registerPaymentSchema.parse(input)

  const trip = await registerPaymentService(validatedInput, {
    userId: session?.user.id,
    shareToken
  })

  revalidatePath(`/trip/${trip.id}`)

  return trip
}

export async function deletePaymentAction(tripId: string, paymentId: string, shareToken?: string) {
  const session = await getCurrentSession()
  const validatedInput = paymentIdSchema.parse({ tripId, paymentId })

  const trip = await deletePaymentService(validatedInput.tripId, validatedInput.paymentId, {
    userId: session?.user.id,
    shareToken
  })

  revalidatePath(`/trip/${trip.id}`)

  return trip
}
