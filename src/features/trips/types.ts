import type { Expense, Person } from "@/lib/expenses/types"

export type CreateTripInput = {
  name: string
  people: Person[]
}

export type SaveTripInput = {
  id: string
  name: string
  people: Person[]
  expenses: Expense[]
}

export type TripAccess = {
  userId?: string
  shareToken?: string
}

export type RegisterPaymentInput = {
  tripId: string
  from: string
  to: string
  amount: number
}
