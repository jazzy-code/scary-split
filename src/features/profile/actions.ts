"use server"

import { APIError } from "better-auth/api"
import { headers } from "next/headers"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { getCurrentSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma/client"

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128, "La contraseña es demasiado larga")

export async function getProfileAction() {
  const session = await getCurrentSession()

  if (!session) {
    return null
  }

  const [accounts, tripCount] = await Promise.all([
    prisma.account.findMany({
      where: {
        userId: session.user.id
      },
      select: {
        providerId: true
      }
    }),
    prisma.tripMember.count({
      where: {
        userId: session.user.id
      }
    })
  ])

  return {
    user: {
      name: session.user.name,
      email: session.user.email,
      image: session.user.image ?? null,
      emailVerified: session.user.emailVerified,
      createdAt: session.user.createdAt
    },
    providers: accounts.map((account) => account.providerId),
    tripCount
  }
}

type SetPasswordResult = { ok: true } | { ok: false; message: string }

export async function setPasswordAction(newPassword: string): Promise<SetPasswordResult> {
  const session = await getCurrentSession()

  if (!session) {
    return { ok: false, message: "Tu sesión expiró. Inicia sesión de nuevo." }
  }

  const parsedPassword = passwordSchema.safeParse(newPassword)

  if (!parsedPassword.success) {
    return { ok: false, message: parsedPassword.error.issues[0].message }
  }

  try {
    await auth.api.setPassword({
      body: { newPassword: parsedPassword.data },
      headers: await headers()
    })
  } catch (error) {
    if (error instanceof APIError) {
      // Better Auth exige una sesión reciente para esta operación
      if (error.body?.code === "SESSION_EXPIRED") {
        return {
          ok: false,
          message: "Por seguridad, cierra sesión e inicia de nuevo con Google antes de agregar una contraseña."
        }
      }

      if (error.body?.code === "PASSWORD_ALREADY_SET") {
        return { ok: false, message: "Tu cuenta ya tiene una contraseña." }
      }
    }

    console.error(error)

    return { ok: false, message: "No se pudo agregar la contraseña" }
  }

  return { ok: true }
}
