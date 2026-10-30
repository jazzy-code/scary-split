import type { Trip } from "@/lib/expenses/types"

import { roundMoney } from "@/lib/money/round"
import { prisma } from "@/lib/prisma/client"

import type { CreateTripInput, RegisterPaymentInput, SaveTripInput, TripAccess } from "./types"
import { TripAccessError } from "./errors"
import { hasValidTripShare } from "./sharing"

function toTrip(trip: {
  id: string
  name: string
  people: {
    id: string
    name: string
    userId: string | null
    email: string | null
  }[]
  members: {
    userId: string
    role: "OWNER" | "MEMBER"
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
  payments: {
    id: string
    fromPersonId: string
    toPersonId: string
    amount: unknown
    createdBy: { name: string } | null
    createdAt: Date
  }[]
  createdAt: Date
  updatedAt: Date
}, viewerUserId?: string): Trip {
  const memberRoles = new Map(trip.members.map((member) => [member.userId, member.role]))
  const viewerRole = viewerUserId ? (memberRoles.get(viewerUserId) ?? null) : null
  const viewerPerson = viewerUserId ? trip.people.find((person) => person.userId === viewerUserId) : undefined

  return {
    id: trip.id,
    name: trip.name,
    people: trip.people.map((person) => ({
      id: person.id,
      name: person.name,
      linked: !!person.userId,
      memberRole: person.userId ? (memberRoles.get(person.userId) ?? null) : null,
      // El correo de un invitado solo lo ve el dueño
      email: viewerRole === "OWNER" ? person.email : null
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
    })),
    payments: trip.payments.map((payment) => ({
      id: payment.id,
      from: payment.fromPersonId,
      to: payment.toPersonId,
      amount: Number(payment.amount),
      createdByName: payment.createdBy?.name ?? null,
      createdAt: payment.createdAt
    })),
    viewer: {
      role: viewerRole,
      personId: viewerPerson?.id ?? null
    },
    updatedAt: trip.updatedAt,
    createdAt: trip.createdAt
  }
}

function isExpenseUnchanged(
  existing: {
    description: string
    amount: unknown
    splitType: "EQUAL" | "CUSTOM"
    paidById: string
    participants: { personId: string; amount: unknown }[]
  },
  incoming: SaveTripInput["expenses"][number]
) {
  if (
    existing.description !== incoming.description.trim() ||
    Number(existing.amount) !== incoming.amount ||
    existing.splitType !== (incoming.splitType === "equal" ? "EQUAL" : "CUSTOM") ||
    existing.paidById !== incoming.paidBy ||
    existing.participants.length !== incoming.participants.length
  ) {
    return false
  }

  const existingAmounts = new Map(existing.participants.map((participant) => [participant.personId, Number(participant.amount)]))

  return incoming.participants.every((participant) => existingAmounts.get(participant.personId) === participant.amount)
}

const tripInclude = {
  people: true,
  members: true,
  payments: {
    include: {
      createdBy: {
        select: {
          name: true
        }
      }
    },
    orderBy: {
      createdAt: "asc" as const
    }
  },
  expenses: {
    include: {
      participants: true
    },
    orderBy: {
      createdAt: "asc" as const
    }
  }
}

async function assertTripOwner(tripId: string, userId: string) {
  const member = await prisma.tripMember.findUnique({
    where: {
      tripId_userId: {
        tripId,
        userId
      }
    },
    select: {
      role: true
    }
  })

  if (!member) {
    throw new TripAccessError()
  }

  if (member.role !== "OWNER") {
    throw new Error("Solo el dueño del sustito puede eliminarlo")
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

  throw new TripAccessError()
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

  return trips.map((trip) => toTrip(trip, userId))
}

export async function getTrip(tripId: string, access: TripAccess): Promise<Trip | null> {
  await assertTripAccess(tripId, access)

  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId
    },
    include: tripInclude
  })

  return trip ? toTrip(trip, access.userId) : null
}

export async function createTrip(input: CreateTripInput, userId: string, userName: string): Promise<Trip> {
  if (!input.name.trim()) {
    throw new Error("Trip name is required")
  }

  const creatorName = userName.trim()
  const includeCreator = !!input.includeCreator && !!creatorName
  const names = [...input.people.map((person) => person.name), ...(includeCreator ? [creatorName] : [])]

  if (names.length < 2) {
    throw new Error("A trip requires at least two people")
  }

  const uniqueNames = new Set(names.map((name) => name.trim().toLowerCase()))

  if (uniqueNames.size !== names.length) {
    throw new Error("Participant names must be unique")
  }

  const trip = await prisma.trip.create({
    data: {
      name: input.name.trim(),
      members: {
        create: {
          userId,
          role: "OWNER"
        }
      },
      people: {
        create: [
          ...input.people.map((person) => ({
            id: person.id,
            name: person.name.trim()
          })),
          ...(includeCreator ? [{ name: creatorName, userId }] : [])
        ]
      }
    },
    include: tripInclude
  })

  return toTrip(trip, userId)
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
      throw new Error("Este participante ha pagado al menos un gasto")
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
        id: true,
        name: true,
        userId: true
      }
    })

    const transactionPeopleById = new Map(transactionPeople.map((person) => [person.id, person]))
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

    if (removedPeople.length > 0) {
      const removedPersonIds = removedPeople.map((person) => person.id)

      const peopleWithPayments = await tx.settlementPayment.findFirst({
        where: {
          tripId: input.id,
          OR: [{ fromPersonId: { in: removedPersonIds } }, { toPersonId: { in: removedPersonIds } }]
        },
        select: {
          id: true
        }
      })

      if (peopleWithPayments) {
        throw new Error("No se puede eliminar un participante con pagos registrados")
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
      const removedLinkedUserIds = removedPeople.flatMap((person) => (person.userId ? [person.userId] : []))

      if (removedLinkedUserIds.length > 0) {
        const requester = access.userId
          ? await tx.tripMember.findUnique({
              where: {
                tripId_userId: {
                  tripId: input.id,
                  userId: access.userId
                }
              },
              select: {
                role: true
              }
            })
          : null

        if (requester?.role !== "OWNER") {
          throw new Error("Solo el dueño puede eliminar a un participante con cuenta vinculada")
        }
      }

      await tx.person.deleteMany({
        where: {
          id: {
            in: removedPeople.map((person) => person.id)
          }
        }
      })

      // Quien ya no es un participante tampoco conserva el acceso, salvo que sea dueño
      if (removedLinkedUserIds.length > 0) {
        await tx.tripMember.deleteMany({
          where: {
            tripId: input.id,
            userId: {
              in: removedLinkedUserIds
            },
            role: "MEMBER"
          }
        })
      }
    }

    for (const person of input.people) {
      const existingPerson = transactionPeopleById.get(person.id)

      if (existingPerson) {
        if (existingPerson.name !== person.name.trim()) {
          await tx.person.update({
            where: {
              id: person.id
            },
            data: {
              name: person.name.trim()
            }
          })
        }

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
      include: {
        participants: true
      }
    })

    const transactionExpensesById = new Map(transactionExpenses.map((expense) => [expense.id, expense]))
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
      const existingExpense = transactionExpensesById.get(expense.id)

      if (existingExpense) {
        if (isExpenseUnchanged(existingExpense, expense)) {
          continue
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
  }, {
    // Cada query a Neon cuesta una ida y vuelta; el default de 5s se queda corto con varios gastos
    maxWait: 10000,
    timeout: 30000
  })

  return toTrip(trip, access.userId)
}

export async function registerPayment(input: RegisterPaymentInput, access: TripAccess): Promise<Trip> {
  await assertTripAccess(input.tripId, access)

  const people = await prisma.person.findMany({
    where: {
      tripId: input.tripId,
      id: {
        in: [input.from, input.to]
      }
    },
    select: {
      id: true
    }
  })

  if (people.length !== 2) {
    throw new Error("Los participantes del pago no pertenecen al sustito")
  }

  const amount = roundMoney(input.amount)

  if (amount <= 0) {
    throw new Error("El monto del pago debe ser mayor a cero")
  }

  await prisma.settlementPayment.create({
    data: {
      tripId: input.tripId,
      fromPersonId: input.from,
      toPersonId: input.to,
      amount,
      createdById: access.userId ?? null
    }
  })

  const trip = await prisma.trip.findUniqueOrThrow({
    where: {
      id: input.tripId
    },
    include: tripInclude
  })

  return toTrip(trip, access.userId)
}

export async function deletePayment(tripId: string, paymentId: string, access: TripAccess): Promise<Trip> {
  await assertTripAccess(tripId, access)

  const deletedPayment = await prisma.settlementPayment.deleteMany({
    where: {
      id: paymentId,
      tripId
    }
  })

  if (deletedPayment.count === 0) {
    throw new Error("Payment not found")
  }

  const trip = await prisma.trip.findUniqueOrThrow({
    where: {
      id: tripId
    },
    include: tripInclude
  })

  return toTrip(trip, access.userId)
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

  return toTrip(trip, access.userId)
}

export async function deleteTrip(tripId: string, userId: string): Promise<void> {
  await assertTripOwner(tripId, userId)

  await prisma.trip.delete({
    where: {
      id: tripId
    }
  })
}
