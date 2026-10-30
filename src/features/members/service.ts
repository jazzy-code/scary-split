import { createShareToken, hashShareToken } from "@/features/trips/sharing"
import { TripAccessError } from "@/features/trips/errors"
import { prisma } from "@/lib/prisma/client"

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export type InviteInfo =
  | { status: "not-found" }
  | { status: "used" | "expired"; tripName: string; personName: string }
  | { status: "valid"; tripId: string; tripName: string; personName: string }

async function getMemberRole(tripId: string, userId: string) {
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

  return member?.role ?? null
}

async function assertTripOwner(tripId: string, userId: string) {
  const role = await getMemberRole(tripId, userId)

  if (role === null) {
    throw new TripAccessError()
  }

  if (role !== "OWNER") {
    throw new Error("Solo el dueño del sustito puede hacer esto")
  }
}

export async function createPersonInvite(
  input: { tripId: string; personId: string; email?: string },
  userId: string
) {
  await assertTripOwner(input.tripId, userId)

  const person = await prisma.person.findFirst({
    where: {
      id: input.personId,
      tripId: input.tripId
    },
    select: {
      name: true,
      userId: true,
      trip: {
        select: {
          name: true
        }
      }
    }
  })

  if (!person) {
    throw new Error("El participante no pertenece al sustito")
  }

  if (person.userId) {
    throw new Error("Este participante ya tiene una cuenta vinculada")
  }

  const token = createShareToken()

  await prisma.$transaction([
    // Solo vale la última invitación: al generar una nueva se anulan las anteriores sin usar
    prisma.personInvite.deleteMany({
      where: {
        personId: input.personId,
        usedAt: null
      }
    }),
    prisma.personInvite.create({
      data: {
        personId: input.personId,
        tokenHash: hashShareToken(token),
        expiresAt: new Date(Date.now() + INVITE_TTL_MS)
      }
    }),
    ...(input.email
      ? [
          prisma.person.update({
            where: {
              id: input.personId
            },
            data: {
              email: input.email
            }
          })
        ]
      : [])
  ])

  return { token, personName: person.name, tripName: person.trip.name }
}

export async function getInviteInfo(token: string): Promise<InviteInfo> {
  const invite = await prisma.personInvite.findUnique({
    where: {
      tokenHash: hashShareToken(token)
    },
    select: {
      usedAt: true,
      expiresAt: true,
      person: {
        select: {
          name: true,
          userId: true,
          tripId: true,
          trip: {
            select: {
              name: true
            }
          }
        }
      }
    }
  })

  if (!invite) {
    return { status: "not-found" }
  }

  const base = { tripName: invite.person.trip.name, personName: invite.person.name }

  if (invite.usedAt || invite.person.userId) {
    return { status: "used", ...base }
  }

  if (invite.expiresAt < new Date()) {
    return { status: "expired", ...base }
  }

  return { status: "valid", tripId: invite.person.tripId, ...base }
}

export async function claimPersonInvite(token: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const invite = await tx.personInvite.findUnique({
      where: {
        tokenHash: hashShareToken(token)
      },
      select: {
        id: true,
        usedAt: true,
        expiresAt: true,
        person: {
          select: {
            id: true,
            userId: true,
            tripId: true
          }
        }
      }
    })

    if (!invite) {
      throw new Error("La invitación no existe")
    }

    if (invite.usedAt || invite.person.userId) {
      throw new Error("Esta invitación ya fue usada")
    }

    if (invite.expiresAt < new Date()) {
      throw new Error("La invitación venció. Pide una nueva al dueño del sustito")
    }

    const { tripId } = invite.person

    const existingLink = await tx.person.findFirst({
      where: {
        tripId,
        userId
      },
      select: {
        id: true
      }
    })

    if (existingLink) {
      throw new Error("Ya estás vinculado a otro participante de este sustito")
    }

    // Se vincula solo si nadie más lo reclamó mientras tanto
    const claimed = await tx.person.updateMany({
      where: {
        id: invite.person.id,
        userId: null
      },
      data: {
        userId
      }
    })

    if (claimed.count === 0) {
      throw new Error("Esta invitación ya fue usada")
    }

    await tx.tripMember.upsert({
      where: {
        tripId_userId: {
          tripId,
          userId
        }
      },
      create: {
        tripId,
        userId,
        role: "MEMBER"
      },
      update: {}
    })

    await tx.personInvite.update({
      where: {
        id: invite.id
      },
      data: {
        usedAt: new Date()
      }
    })

    return { tripId }
  })
}

export async function linkSelfToPerson(tripId: string, personId: string, userId: string) {
  await assertTripOwner(tripId, userId)

  const alreadyLinked = await prisma.person.findFirst({
    where: {
      tripId,
      userId
    },
    select: {
      id: true
    }
  })

  if (alreadyLinked) {
    throw new Error("Ya estás vinculado a un participante de este sustito")
  }

  const linked = await prisma.person.updateMany({
    where: {
      id: personId,
      tripId,
      userId: null
    },
    data: {
      userId
    }
  })

  if (linked.count === 0) {
    throw new Error("Este participante ya tiene una cuenta vinculada")
  }
}

export async function joinTripAsParticipant(tripId: string, userId: string, userName: string) {
  await assertTripOwner(tripId, userId)

  const name = userName.trim()

  const people = await prisma.person.findMany({
    where: {
      tripId
    },
    select: {
      name: true,
      userId: true
    }
  })

  if (people.some((person) => person.userId === userId)) {
    throw new Error("Ya eres participante de este sustito")
  }

  if (people.some((person) => person.name.trim().toLowerCase() === name.toLowerCase())) {
    throw new Error(`Ya existe un participante llamado "${name}". Usa "Soy yo" en su menú para vincularte a él`)
  }

  await prisma.person.create({
    data: {
      tripId,
      name,
      userId
    }
  })
}

export async function unlinkPerson(tripId: string, personId: string, ownerId: string) {
  await assertTripOwner(tripId, ownerId)

  await prisma.$transaction(async (tx) => {
    const person = await tx.person.findFirst({
      where: {
        id: personId,
        tripId
      },
      select: {
        userId: true
      }
    })

    if (!person?.userId) {
      throw new Error("Este participante no tiene una cuenta vinculada")
    }

    await tx.person.update({
      where: {
        id: personId
      },
      data: {
        userId: null
      }
    })

    // Un dueño conserva el control del sustito aunque deje de ser un participante
    await tx.tripMember.deleteMany({
      where: {
        tripId,
        userId: person.userId,
        role: "MEMBER"
      }
    })
  })
}

export async function promoteToOwner(tripId: string, personId: string, ownerId: string) {
  await assertTripOwner(tripId, ownerId)

  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      tripId
    },
    select: {
      userId: true
    }
  })

  if (!person?.userId) {
    throw new Error("Solo se puede hacer dueño a un participante con cuenta vinculada")
  }

  await prisma.tripMember.update({
    where: {
      tripId_userId: {
        tripId,
        userId: person.userId
      }
    },
    data: {
      role: "OWNER"
    }
  })
}

async function promoteOldestMemberIfNoOwner(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], tripId: string, leavingUserId: string) {
  const otherOwner = await tx.tripMember.findFirst({
    where: {
      tripId,
      role: "OWNER",
      userId: {
        not: leavingUserId
      }
    },
    select: {
      id: true
    }
  })

  if (otherOwner) {
    return true
  }

  const oldestMember = await tx.tripMember.findFirst({
    where: {
      tripId,
      userId: {
        not: leavingUserId
      }
    },
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true
    }
  })

  if (!oldestMember) {
    return false
  }

  await tx.tripMember.update({
    where: {
      id: oldestMember.id
    },
    data: {
      role: "OWNER"
    }
  })

  return true
}

export async function leaveTrip(tripId: string, userId: string) {
  await prisma.$transaction(async (tx) => {
    const member = await tx.tripMember.findUnique({
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

    if (member.role === "OWNER") {
      const hasSuccessor = await promoteOldestMemberIfNoOwner(tx, tripId, userId)

      if (!hasSuccessor) {
        throw new Error("Eres la única persona en este sustito. Si ya no lo necesitas, elimínalo")
      }
    }

    await tx.person.updateMany({
      where: {
        tripId,
        userId
      },
      data: {
        userId: null
      }
    })

    await tx.tripMember.delete({
      where: {
        tripId_userId: {
          tripId,
          userId
        }
      }
    })
  })
}

/** Se ejecuta antes de eliminar una cuenta: traspasa los sustitos compartidos y borra los que quedarían huérfanos. */
export async function prepareAccountDeletion(userId: string) {
  const ownedTrips = await prisma.tripMember.findMany({
    where: {
      userId,
      role: "OWNER"
    },
    select: {
      tripId: true
    }
  })

  for (const { tripId } of ownedTrips) {
    await prisma.$transaction((tx) => promoteOldestMemberIfNoOwner(tx, tripId, userId))
  }

  // Los sustitos donde la persona es la única miembro quedarían huérfanos, así que se eliminan con la cuenta
  await prisma.trip.deleteMany({
    where: {
      members: {
        some: { userId },
        every: { userId }
      }
    }
  })
}
