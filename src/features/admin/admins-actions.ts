"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"

import { hashPassword, verifyPassword } from "@/lib/admin/password"
import { requireAdmin, requireSuperAdmin } from "@/lib/admin/session"
import { prisma } from "@/lib/prisma/client"
import { ADMIN_PASSWORD_MIN_LENGTH, type AdminActionResult } from "./admins-types"

// Los errores se devuelven como valor porque en producción Next oculta el mensaje de los que se lanzan.

const passwordSchema = z
  .string()
  .min(ADMIN_PASSWORD_MIN_LENGTH, `La contraseña debe tener al menos ${ADMIN_PASSWORD_MIN_LENGTH} caracteres`)
  .max(128, "La contraseña es demasiado larga")

const createSchema = z.object({
  name: z.string().trim().min(2, "Escribe el nombre").max(80, "El nombre es demasiado largo"),
  email: z.string().trim().toLowerCase().pipe(z.email("El correo no es válido")),
  password: passwordSchema
})

function firstIssue(error: z.ZodError) {
  return error.issues[0]?.message ?? "Datos no válidos"
}

export async function createAdminAction(input: unknown): Promise<AdminActionResult> {
  await requireSuperAdmin()

  const parsed = createSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) }
  }

  const { name, email, password } = parsed.data

  try {
    if (await prisma.adminUser.findUnique({ where: { email } })) {
      return { ok: false, message: "Ya existe un administrador con ese correo" }
    }

    // Los nuevos administradores nunca son super admin
    await prisma.adminUser.create({ data: { name, email, passwordHash: await hashPassword(password), role: "ADMIN" } })
  } catch {
    return { ok: false, message: "No se pudo crear el administrador" }
  }

  revalidatePath("/admin/admins")

  return { ok: true }
}

const activeSchema = z.object({ id: z.string().min(1), active: z.boolean() })

export async function setAdminActiveAction(input: unknown): Promise<AdminActionResult> {
  const session = await requireSuperAdmin()
  const parsed = activeSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: "Datos no válidos" }
  }

  const { id, active } = parsed.data

  if (id === session.admin.id) {
    return { ok: false, message: "No puedes cambiar el estado de tu propia cuenta" }
  }

  try {
    const target = await prisma.adminUser.findUnique({ where: { id } })

    if (!target) {
      return { ok: false, message: "No encontramos al administrador" }
    }

    if (target.role === "SUPER_ADMIN") {
      return { ok: false, message: "No se puede desactivar a un super admin" }
    }

    await prisma.$transaction([
      prisma.adminUser.update({ where: { id }, data: { active, failedLogins: 0, lockedUntil: null } }),
      // Al desactivar, se cierran sus sesiones abiertas
      ...(active ? [] : [prisma.adminSession.deleteMany({ where: { adminId: id } })])
    ])
  } catch {
    return { ok: false, message: "No se pudo actualizar al administrador" }
  }

  revalidatePath("/admin/admins")

  return { ok: true }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Escribe tu contraseña actual").max(200),
  newPassword: passwordSchema
})

export async function changeOwnPasswordAction(input: unknown): Promise<AdminActionResult> {
  const session = await requireAdmin()
  const parsed = changePasswordSchema.safeParse(input)

  if (!parsed.success) {
    return { ok: false, message: firstIssue(parsed.error) }
  }

  const { currentPassword, newPassword } = parsed.data

  try {
    const admin = await prisma.adminUser.findUnique({ where: { id: session.admin.id } })

    if (!admin || !(await verifyPassword(currentPassword, admin.passwordHash))) {
      return { ok: false, message: "La contraseña actual no es correcta" }
    }

    if (currentPassword === newPassword) {
      return { ok: false, message: "La nueva contraseña debe ser distinta a la actual" }
    }

    await prisma.$transaction([
      prisma.adminUser.update({ where: { id: admin.id }, data: { passwordHash: await hashPassword(newPassword) } }),
      // Se cierran las demás sesiones de esta cuenta; la actual sigue abierta
      prisma.adminSession.deleteMany({ where: { adminId: admin.id, id: { not: session.sessionId } } })
    ])
  } catch {
    return { ok: false, message: "No se pudo cambiar la contraseña" }
  }

  return { ok: true }
}
