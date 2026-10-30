export type MemberRole = "OWNER" | "MEMBER"

export type Person = {
  id: string
  name: string
  /** Tiene una cuenta vinculada */
  linked?: boolean
  /** Rol de la cuenta vinculada en este sustito */
  memberRole?: MemberRole | null
  /** Solo se envía al dueño del sustito */
  email?: string | null
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
  splitType: "equal" | "custom"
  participants: ExpenseParticipant[]
}

export type Payment = {
  id: string
  from: string
  to: string
  amount: number
  createdByName?: string | null
  createdAt: Date
}

export type Trip = {
  id: string
  name: string
  people: Person[]
  expenses: Expense[]
  payments: Payment[]
  /** Relación de quien consulta con el sustito */
  viewer: {
    role: MemberRole | null
    personId: string | null
  }
  createdAt: Date
  updatedAt: Date
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
