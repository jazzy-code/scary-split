import { z } from "zod"

const personSchema = z.object({
  id: z.string().min(1, "El identificador del participante es requerido"),
  name: z
    .string()
    .trim()
    .min(1, "El nombre del participante es requerido")
    .max(100, "El nombre del participante es demasiado largo")
})

const expenseParticipantSchema = z.object({
  personId: z.string().min(1, "El participante es requerido"),
  amount: z.number().finite().nonnegative("El monto del participante no puede ser negativo")
})

const expenseSchema = z.object({
  id: z.string().min(1, "El identificador del gasto es requerido"),
  description: z
    .string()
    .trim()
    .min(1, "La descripción del gasto es requerida")
    .max(200, "La descripción del gasto es demasiado larga"),
  amount: z.number().finite().positive("El monto del gasto debe ser mayor a cero"),
  paidBy: z.string().min(1, "El pagador del gasto es requerido"),
  splitType: z.enum(["equal", "custom"]),
  participants: z.array(expenseParticipantSchema).min(1, "El gasto debe tener al menos un participante")
})

export const createTripSchema = z.object({
  name: z.string().trim().min(1, "El nombre del sustito es requerido").max(100, "El nombre del sustito es demasiado largo"),
  people: z.array(personSchema).min(2, "El sustito debe tener al menos dos participantes")
})

export const saveTripSchema = z.object({
  id: z.string().min(1, "El identificador del sustito es requerido"),
  name: z.string().trim().min(1, "El nombre del sustito es requerido").max(100, "El nombre del sustito es demasiado largo"),
  people: z.array(personSchema).min(2, "El sustito debe tener al menos dos participantes"),
  expenses: z.array(expenseSchema)
})

export const updateTripSchema = z.object({
  tripId: z.string().min(1, "El identificador del sustito es requerido"),
  name: z.string().trim().min(1, "El nombre del sustito es requerido").max(100, "El nombre del sustito es demasiado largo")
})

export const tripIdSchema = z.object({
  tripId: z.string().min(1, "El identificador del sustito es requerido")
})
