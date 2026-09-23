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
