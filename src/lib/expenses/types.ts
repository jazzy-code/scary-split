export type Person = {
  id: string
  name: string
}

export type ExpenseParticipant = {
  personId: string
  amount: number
}

export type Expense = {
  id: string
  description: string
  amount: number
  paidBy: string
  participants: ExpenseParticipant[]
}

export type Trip = {
  id: string
  name: string
  people: Person[]
  expenses: Expense[]
}

export type Balance = {
  personId: string
  amount: number
}

export type Settlement = {
  from: string
  to: string
  amount: number
}