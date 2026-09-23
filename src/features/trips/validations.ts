import { z } from "zod"

export const createTripSchema = z.object({
  name: z.string().trim().min(1, "Trip name is required").max(100, "Trip name is too long")
})

export const updateTripSchema = z.object({
  tripId: z.string().min(1),
  name: z.string().trim().min(1, "Trip name is required").max(100, "Trip name is too long")
})

export const tripIdSchema = z.object({
  tripId: z.string().min(1)
})
