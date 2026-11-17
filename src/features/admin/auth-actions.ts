"use server"

import { redirect } from "next/navigation"
import { z } from "zod"

import { getDummyHash, verifyPassword } from "@/lib/admin/password"
import { createAdminSession, destroyAdminSession } from "@/lib/admin/session"
import { prisma } from "@/lib/prisma/client"

const MAX_FAILED_LOGINS = 5
const LOCK_MINUTES = 15
const GENERIC_ERROR = "Correo o contraseña incorrectos"

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1).max(200)
})

export type AdminLoginState = { error?: string; email?: string }

export async function loginAdminAction(_previous: AdminLoginState, formData: FormData): Promise<AdminLoginState> {
  const rawEmail = String(formData.get("email") ?? "")
  const parsed = loginSchema.safeParse({ email: rawEmail, password: formData.get("password") })

  // React vacía el formulario tras enviarlo, por eso se devuelve el correo para no obligar a reescribirlo
  if (!parsed.success) {
    return { error: GENERIC_ERROR, email: rawEmail }
  }

  const { email, password } = parsed.data
  const admin = await prisma.adminUser.findUnique({ where: { email } })

  if (admin?.lockedUntil && admin.lockedUntil > new Date()) {
    return { error: "Demasiados intentos fallidos. Inténtalo de nuevo en unos minutos.", email }
  }

  // Se verifica siempre, aunque el correo no exista, para no revelar qué cuentas existen por el tiempo de respuesta
  const valid = await verifyPassword(password, admin?.passwordHash ?? (await getDummyHash()))

  if (!admin || !admin.active || !valid) {
    if (admin) {
      const failedLogins = admin.failedLogins + 1
      const shouldLock = failedLogins >= MAX_FAILED_LOGINS

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: {
          failedLogins: shouldLock ? 0 : failedLogins,
          lockedUntil: shouldLock ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000) : null
        }
      })
    }

    return { error: GENERIC_ERROR, email }
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { failedLogins: 0, lockedUntil: null, lastLoginAt: new Date() }
  })

  await createAdminSession(admin.id)

  redirect("/admin")
}

export async function logoutAdminAction() {
  await destroyAdminSession()

  redirect("/admin/login")
}
