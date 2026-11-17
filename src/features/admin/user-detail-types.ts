// Sin imports de servidor: lo usa también el diálogo del navegador

export type AdminTripPerson = {
  id: string
  name: string
  /** Tiene cuenta vinculada */
  linked: boolean
  role: "OWNER" | "MEMBER" | null
  isThisUser: boolean
}

export type AdminTripExpense = {
  id: string
  description: string
  amount: number
  paidByName: string
  splitType: "equal" | "custom"
  participantCount: number
  createdAt: string
}

export type AdminTripPayment = {
  id: string
  fromName: string
  toName: string
  amount: number
  createdByName: string | null
  createdAt: string
}

export type AdminTripTransfer = { fromName: string; toName: string; amount: number }

export type AdminTripDetail = {
  id: string
  name: string
  role: "OWNER" | "MEMBER"
  ownerName: string | null
  createdAt: string
  joinedAt: string
  settled: boolean
  expensesTotal: number
  paymentsTotal: number
  people: AdminTripPerson[]
  expenses: AdminTripExpense[]
  payments: AdminTripPayment[]
  pending: AdminTripTransfer[]
}

export type AdminUserDetail = {
  created: AdminTripDetail[]
  invited: AdminTripDetail[]
}

export type AdminUserDetailResult = { ok: true; detail: AdminUserDetail } | { ok: false; message: string }
