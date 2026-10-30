"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { getCurrentSession } from "@/lib/auth-utils"
import { sendEmail } from "@/lib/email/send-email"
import { invitationEmail } from "@/lib/email/templates"

import { TripAccessError } from "@/features/trips/errors"

import {
  claimPersonInvite,
  createPersonInvite,
  getInviteInfo,
  joinTripAsParticipant,
  leaveTrip,
  linkSelfToPerson,
  promoteToOwner,
  unlinkPerson
} from "./service"

type ActionResult<T = object> = ({ ok: true } & T) | { ok: false; message: string }

const idSchema = z.string().min(1)

const createInviteSchema = z.object({
  tripId: idSchema,
  personId: idSchema,
  email: z.email("El correo no es válido").optional(),
  sendEmail: z.boolean().optional()
})

async function run<T extends object>(action: (userId: string, userName: string) => Promise<T>): Promise<ActionResult<T>> {
  const session = await getCurrentSession()

  if (!session) {
    return { ok: false, message: "Inicia sesión para continuar" }
  }

  try {
    return { ok: true, ...(await action(session.user.id, session.user.name)) }
  } catch (error) {
    if (error instanceof TripAccessError) {
      return { ok: false, message: "No tienes acceso a este sustito" }
    }

    if (error instanceof z.ZodError) {
      return { ok: false, message: error.issues[0].message }
    }

    if (error instanceof Error) {
      return { ok: false, message: error.message }
    }

    console.error(error)

    return { ok: false, message: "Ocurrió un error inesperado" }
  }
}

export async function createPersonInviteAction(input: z.input<typeof createInviteSchema>) {
  return run(async (userId, userName) => {
    const { tripId, personId, email, sendEmail: shouldSendEmail } = createInviteSchema.parse(input)

    const invite = await createPersonInvite({ tripId, personId, email }, userId)

    if (shouldSendEmail && email) {
      const url = `${process.env.BETTER_AUTH_URL}/invite/${invite.token}`

      await sendEmail({
        to: email,
        ...invitationEmail({
          inviterName: userName,
          tripName: invite.tripName,
          personName: invite.personName,
          url
        })
      })
    }

    revalidatePath(`/trip/${tripId}`)

    return { token: invite.token }
  })
}

export async function getInviteInfoAction(token: string) {
  return getInviteInfo(idSchema.parse(token))
}

export async function claimPersonInviteAction(token: string) {
  return run(async (userId) => {
    const { tripId } = await claimPersonInvite(idSchema.parse(token), userId)

    revalidatePath("/")
    revalidatePath(`/trip/${tripId}`)

    return { tripId }
  })
}

export async function linkSelfAction(tripId: string, personId: string) {
  return run(async (userId) => {
    await linkSelfToPerson(idSchema.parse(tripId), idSchema.parse(personId), userId)

    revalidatePath("/")
    revalidatePath(`/trip/${tripId}`)

    return {}
  })
}

export async function joinTripAsParticipantAction(tripId: string) {
  return run(async (userId, userName) => {
    await joinTripAsParticipant(idSchema.parse(tripId), userId, userName)

    revalidatePath("/")
    revalidatePath(`/trip/${tripId}`)

    return {}
  })
}

export async function unlinkPersonAction(tripId: string, personId: string) {
  return run(async (userId) => {
    await unlinkPerson(idSchema.parse(tripId), idSchema.parse(personId), userId)

    revalidatePath("/")
    revalidatePath(`/trip/${tripId}`)

    return {}
  })
}

export async function promoteToOwnerAction(tripId: string, personId: string) {
  return run(async (userId) => {
    await promoteToOwner(idSchema.parse(tripId), idSchema.parse(personId), userId)

    revalidatePath(`/trip/${tripId}`)

    return {}
  })
}

export async function leaveTripAction(tripId: string) {
  return run(async (userId) => {
    await leaveTrip(idSchema.parse(tripId), userId)

    revalidatePath("/")

    return {}
  })
}
