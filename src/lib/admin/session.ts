import { createHash, randomBytes } from "node:crypto"
import { cache } from "react"
import { cookies, headers } from "next/headers"
import { redirect } from "next/navigation"

import { prisma } from "@/lib/prisma/client"

export const ADMIN_COOKIE = "admin_session"
const SESSION_HOURS = 8

export type AdminSessionData = {
  sessionId: string
  admin: { id: string; email: string; name: string; role: "SUPER_ADMIN" | "ADMIN" }
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createAdminSession(adminId: string) {
  const token = randomBytes(32).toString("base64url")
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000)
  const requestHeaders = await headers()

  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date() } } })

  await prisma.adminSession.create({
    data: {
      adminId,
      tokenHash: hashToken(token),
      expiresAt,
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      userAgent: requestHeaders.get("user-agent")
    }
  })

  const cookieStore = await cookies()

  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    // Solo viaja en rutas del panel, nunca a la app de usuarios
    path: "/admin",
    expires: expiresAt
  })
}

export const getAdminSession = cache(async (): Promise<AdminSessionData | null> => {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value

  if (!token) {
    return null
  }

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { admin: true }
  })

  if (!session || session.expiresAt < new Date() || !session.admin.active) {
    return null
  }

  const { admin } = session

  return { sessionId: session.id, admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role } }
})

/** Toda consulta del panel debe pasar por aquí, no solo el layout. */
export async function requireAdmin() {
  const session = await getAdminSession()

  if (!session) {
    redirect("/admin/login")
  }

  return session
}

export async function requireSuperAdmin() {
  const session = await requireAdmin()

  if (session.admin.role !== "SUPER_ADMIN") {
    redirect("/admin")
  }

  return session
}

export async function destroyAdminSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(ADMIN_COOKIE)?.value

  if (token) {
    await prisma.adminSession.deleteMany({ where: { tokenHash: hashToken(token) } })
  }

  cookieStore.delete({ name: ADMIN_COOKIE, path: "/admin" })
}
