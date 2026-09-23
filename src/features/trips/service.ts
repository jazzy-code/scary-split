import type { Trip } from "@/lib/expenses/types"

import { prisma } from "@/lib/prisma/client"

import type { CreateTripInput, SaveTripInput } from "./types"

function toTrip(trip: {
  id: string
  name: string
  people: {
    id: string
    name: string
  }[]
  expenses: {
    id: string
    description: string
    amount: unknown
    paidById: string
    splitType: "EQUAL" | "CUSTOM"
    participants: {
      personId: string
      amount: unknown
    }[]
  }[]
}): Trip {
  return {
    id: trip.id,
    name: trip.name,
    people: trip.people.map((person) => ({
      id: person.id,
      name: person.name
    })),
    expenses: trip.expenses.map((expense) => ({
      id: expense.id,
      description: expense.description,
      amount: Number(expense.amount),
      paidBy: expense.paidById,
      splitType: expense.splitType === "EQUAL" ? "equal" : "custom",
      participants: expense.participants.map((participant) => ({
        personId: participant.personId,
        amount: Number(participant.amount)
      }))
    }))
  }
}

const tripInclude = {
  people: true,
  expenses: {
    include: {
      participants: true
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
}

async function assertTripMember(tripId: string, userId: string) {
  const member = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: {
        tripId,
        userId
      }
    }
  })

  if (!member) {
    throw new Error("Unauthorized")
  }
}

export async function getTrips(userId: string): Promise<Trip[]> {
  const trips = await prisma.trip.findMany({
    where: {
      members: {
        some: {
          userId
        }
      }
    },
    include: tripInclude,
    orderBy: {
      updatedAt: "desc"
    }
  })

  return trips.map(toTrip)
}

export async function getTrip(tripId: string, userId: string): Promise<Trip | null> {
  const trip = await prisma.trip.findFirst({
    where: {
      id: tripId,
      members: {
        some: {
          userId
        }
      }
    },
    include: tripInclude
  })

  return trip ? toTrip(trip) : null
}

export async function createTrip(input: CreateTripInput, userId: string): Promise<Trip> {
  if (!input.name.trim()) {
    throw new Error("Trip name is required")
  }

  if (input.people.length < 2) {
    throw new Error("A trip requires at least two people")
  }

  const uniqueNames = new Set(input.people.map((person) => person.name.trim().toLowerCase()))

  if (uniqueNames.size !== input.people.length) {
    throw new Error("Participant names must be unique")
  }

  const trip = await prisma.trip.create({
    data: {
      name: input.name.trim(),
      members: {
        create: {
          userId
        }
      },
      people: {
        create: input.people.map((person) => ({
          id: person.id,
          name: person.name.trim()
        }))
      }
    },
    include: tripInclude
  })

  return toTrip(trip)
}

export async function saveTrip(input: SaveTripInput, userId: string): Promise<Trip> {
  await assertTripMember(input.id, userId)

  if (!input.name.trim()) {
    throw new Error("Trip name is required")
  }

  if (input.people.length < 2) {
    throw new Error("A trip requires at least two people")
  }

  const uniqueNames = new Set(input.people.map((person) => person.name.trim().toLowerCase()))

  if (uniqueNames.size !== input.people.length) {
    throw new Error("Participant names must be unique")
  }

  const existingPeople = await prisma.person.findMany({
    where: {
      tripId: input.id
    },
    select: {
      id: true
    }
  })

  const existingPersonIds = new Set(existingPeople.map((person) => person.id))
  const incomingPersonIds = new Set(input.people.map((person) => person.id))

  const invalidExistingPeople = input.people.some(
    (person) => existingPersonIds.has(person.id) && !incomingPersonIds.has(person.id)
  )

  if (invalidExistingPeople) {
    throw new Error("Invalid trip participants")
  }

  for (const expense of input.expenses) {
    if (expense.amount <= 0) {
      throw new Error("Expense amount must be greater than zero")
    }

    if (!expense.description.trim()) {
      throw new Error("Expense description is required")
    }

    if (!incomingPersonIds.has(expense.paidBy)) {
      throw new Error("Expense payer must belong to the trip")
    }

    if (expense.participants.length === 0) {
      throw new Error("Expense requires participants")
    }

    const participantTotal = expense.participants.reduce((total, participant) => total + participant.amount, 0)

    if (Math.abs(participantTotal - expense.amount) > 0.001) {
      throw new Error("Expense participants must equal the expense amount")
    }

    const participantIds = new Set(expense.participants.map((participant) => participant.personId))

    if (participantIds.size !== expense.participants.length) {
      throw new Error("Expense participants must be unique")
    }

    for (const participant of expense.participants) {
      if (!incomingPersonIds.has(participant.personId)) {
        throw new Error("Expense participant must belong to the trip")
      }

      if (participant.amount < 0) {
        throw new Error("Expense participant amount cannot be negative")
      }
    }
  }

  const existingExpenses = await prisma.expense.findMany({
    where: {
      tripId: input.id
    },
    select: {
      id: true
    }
  })

  const existingExpenseIds = new Set(existingExpenses.map((expense) => expense.id))

  for (const expense of input.expenses) {
    if (existingExpenseIds.has(expense.id)) {
      continue
    }

    const conflictingExpense = await prisma.expense.findUnique({
      where: {
        id: expense.id
      },
      select: {
        tripId: true
      }
    })

    if (conflictingExpense) {
      throw new Error("Invalid expense")
    }
  }

  const trip = await prisma.$transaction(async (tx) => {
    const transactionPeople = await tx.person.findMany({
      where: {
        tripId: input.id
      },
      select: {
        id: true
      }
    })

    const transactionPersonIds = new Set(transactionPeople.map((person) => person.id))
    const incomingPeople = new Set(input.people.map((person) => person.id))

    const removedPeople = transactionPeople.filter((person) => !incomingPeople.has(person.id))

    if (removedPeople.length > 0) {
      const removedPersonIds = removedPeople.map((person) => person.id)

      const peopleWithExpenses = await tx.expense.findFirst({
        where: {
          tripId: input.id,
          paidById: {
            in: removedPersonIds
          }
        }
      })

      if (peopleWithExpenses) {
        throw new Error("Cannot remove a person who paid an expense")
      }

      const peopleWithParticipation = await tx.expenseParticipant.findFirst({
        where: {
          personId: {
            in: removedPersonIds
          }
        }
      })

      if (peopleWithParticipation) {
        throw new Error("Cannot remove a person who participates in an expense")
      }

      await tx.person.deleteMany({
        where: {
          id: {
            in: removedPersonIds
          }
        }
      })
    }

    for (const person of input.people) {
      if (existingPersonIds.has(person.id) && !transactionPersonIds.has(person.id)) {
        throw new Error("Invalid trip participant")
      }

      await tx.person.upsert({
        where: {
          id: person.id
        },
        create: {
          id: person.id,
          name: person.name.trim(),
          tripId: input.id
        },
        update: {
          name: person.name.trim()
        }
      })
    }

    const transactionExpenses = await tx.expense.findMany({
      where: {
        tripId: input.id
      },
      select: {
        id: true
      }
    })

    const transactionExpenseIds = new Set(transactionExpenses.map((expense) => expense.id))
    const incomingExpenses = new Set(input.expenses.map((expense) => expense.id))

    const removedExpenses = transactionExpenses.filter((expense) => !incomingExpenses.has(expense.id))

    if (removedExpenses.length > 0) {
      await tx.expense.deleteMany({
        where: {
          id: {
            in: removedExpenses.map((expense) => expense.id)
          }
        }
      })
    }

    for (const expense of input.expenses) {
      if (transactionExpenseIds.has(expense.id)) {
        const existingExpense = await tx.expense.findFirst({
          where: {
            id: expense.id,
            tripId: input.id
          },
          select: {
            id: true
          }
        })

        if (!existingExpense) {
          throw new Error("Invalid expense")
        }
      }

      await tx.expense.upsert({
        where: {
          id: expense.id
        },
        create: {
          id: expense.id,
          description: expense.description.trim(),
          amount: expense.amount,
          splitType: expense.splitType === "equal" ? "EQUAL" : "CUSTOM",
          tripId: input.id,
          paidById: expense.paidBy,
          participants: {
            create: expense.participants.map((participant) => ({
              personId: participant.personId,
              amount: participant.amount
            }))
          }
        },
        update: {
          description: expense.description.trim(),
          amount: expense.amount,
          splitType: expense.splitType === "equal" ? "EQUAL" : "CUSTOM",
          paidById: expense.paidBy,
          participants: {
            deleteMany: {},
            create: expense.participants.map((participant) => ({
              personId: participant.personId,
              amount: participant.amount
            }))
          }
        }
      })
    }

    return tx.trip.update({
      where: {
        id: input.id
      },
      data: {
        name: input.name.trim()
      },
      include: tripInclude
    })
  })

  return toTrip(trip)
}

export async function deleteExpense(tripId: string, expenseId: string, userId: string): Promise<Trip> {
  await assertTripMember(tripId, userId)

  await prisma.expense.deleteMany({
    where: {
      id: expenseId,
      tripId
    }
  })

  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId
    },
    include: tripInclude
  })

  if (!trip) {
    throw new Error("Trip not found")
  }

  return toTrip(trip)
}

export async function deleteTrip(tripId: string, userId: string): Promise<void> {
  await assertTripMember(tripId, userId)

  await prisma.trip.delete({
    where: {
      id: tripId
    }
  })
}
