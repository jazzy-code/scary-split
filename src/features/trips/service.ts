import type { Trip } from "@/lib/expenses/types"

import { prisma } from "@/lib/prisma/client"

import type { CreateTripInput, SaveTripInput, TripAccess } from "./types"
import { hasValidTripShare } from "./sharing"

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

async function assertTripAccess(tripId: string, access: TripAccess) {
  if (access.userId) {
    const member = await prisma.tripMember.findUnique({
      where: {
        tripId_userId: {
          tripId,
          userId: access.userId
        }
      }
    })

    if (member) {
      return
    }
  }

  if (access.shareToken && (await hasValidTripShare(tripId, access.shareToken))) {
    return
  }

  throw new Error("Unauthorized")
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

export async function getTrip(tripId: string, access: TripAccess): Promise<Trip | null> {
  await assertTripAccess(tripId, access)

  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId
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

export async function saveTrip(input: SaveTripInput, access: TripAccess): Promise<Trip> {
  await assertTripAccess(input.id, access)

  if (!input.name.trim()) {
    throw new Error("El nombre del sustito es requerido")
  }

  if (input.people.length < 2) {
    throw new Error("El sustito debe tener al menos dos participantes")
  }

  const uniqueNames = new Set(input.people.map((person) => person.name.trim().toLowerCase()))

  if (uniqueNames.size !== input.people.length) {
    throw new Error("Los nombres de los participantes deben ser únicos")
  }

  const incomingPersonIds = new Set(input.people.map((person) => person.id))

  for (const expense of input.expenses) {
    if (expense.amount <= 0) {
      throw new Error("El monto del gasto debe ser mayor a cero")
    }

    if (!expense.description.trim()) {
      throw new Error("La descripción del gasto es requerida")
    }

    if (!incomingPersonIds.has(expense.paidBy)) {
      throw new Error("El pagador del gasto debe pertenecer al sustito")
    }

    if (expense.participants.length === 0) {
      throw new Error("El gasto debe tener al menos un participante")
    }

    const participantTotal = expense.participants.reduce((total, participant) => total + participant.amount, 0)

    if (Math.abs(participantTotal - expense.amount) > 0.001) {
      throw new Error("Los montos de los participantes deben ser iguales al monto total del gasto")
    }

    const participantIds = new Set(expense.participants.map((participant) => participant.personId))

    if (participantIds.size !== expense.participants.length) {
      throw new Error("Los participantes de un gasto deben ser únicos")
    }

    for (const participant of expense.participants) {
      if (participant.amount < 0) {
        throw new Error("El monto del participante no puede ser negativo")
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
      throw new Error("El gasto no es válido")
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

    const conflictingPeople = await tx.person.findMany({
      where: {
        id: {
          in: [...incomingPeople]
        },
        tripId: {
          not: input.id
        }
      },
      select: {
        id: true
      }
    })

    if (conflictingPeople.length > 0) {
      throw new Error("El participante no pertenece al sustito")
    }

    const removedPeople = transactionPeople.filter((person) => !incomingPeople.has(person.id))

    if (removedPeople.length > 0) {
      const removedPersonIds = removedPeople.map((person) => person.id)

      const peopleWithExpenses = await tx.expense.findFirst({
        where: {
          tripId: input.id,
          paidById: {
            in: removedPersonIds
          }
        },
        select: {
          id: true
        }
      })

      if (peopleWithExpenses) {
        throw new Error("No se puede eliminar un participante que pagó un gasto")
      }

      const peopleWithParticipation = await tx.expenseParticipant.findFirst({
        where: {
          expense: {
            tripId: input.id
          },
          personId: {
            in: removedPersonIds
          }
        },
        select: {
          id: true
        }
      })

      if (peopleWithParticipation) {
        throw new Error("No se puede eliminar un participante que participa en un gasto")
      }
    }

    for (const expense of input.expenses) {
      if (!incomingPersonIds.has(expense.paidBy)) {
        throw new Error("El pagador del gasto debe pertenecer al sustito")
      }

      for (const participant of expense.participants) {
        if (!incomingPersonIds.has(participant.personId)) {
          throw new Error("El participante del gasto debe pertenecer al sustito")
        }
      }
    }

    if (removedPeople.length > 0) {
      await tx.person.deleteMany({
        where: {
          id: {
            in: removedPeople.map((person) => person.id)
          }
        }
      })
    }

    for (const person of input.people) {
      if (transactionPersonIds.has(person.id)) {
        await tx.person.update({
          where: {
            id: person.id
          },
          data: {
            name: person.name.trim()
          }
        })

        continue
      }

      await tx.person.create({
        data: {
          id: person.id,
          name: person.name.trim(),
          tripId: input.id
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
          throw new Error("El gasto no es válido")
        }

        await tx.expense.update({
          where: {
            id: expense.id
          },
          data: {
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

        continue
      }

      await tx.expense.create({
        data: {
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

export async function deleteExpense(tripId: string, expenseId: string, access: TripAccess): Promise<Trip> {
  await assertTripAccess(tripId, access)

  const deletedExpense = await prisma.expense.deleteMany({
    where: {
      id: expenseId,
      tripId
    }
  })

  if (deletedExpense.count === 0) {
    throw new Error("Expense not found")
  }

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
