import { requireAdmin } from "@/lib/admin/session"
import { prisma } from "@/lib/prisma/client"
import type { Prisma } from "@/generated/prisma/client"
import { parseUsersQuery, type UsersPage } from "./users-query"

export async function listUsers(params: Record<string, string | string[] | undefined>): Promise<UsersPage> {
  // Cada consulta del panel valida la sesión por su cuenta, no solo el layout
  await requireAdmin()

  const query = parseUsersQuery(params)
  const where: Prisma.UserWhereInput = {}

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: "insensitive" } },
      { email: { contains: query.q, mode: "insensitive" } }
    ]
  }

  if (query.provider !== "all") {
    where.accounts = { some: { providerId: query.provider } }
  }

  if (query.from || query.to) {
    where.createdAt = {
      ...(query.from && { gte: new Date(`${query.from}T00:00:00.000Z`) }),
      ...(query.to && { lt: new Date(new Date(`${query.to}T00:00:00.000Z`).getTime() + 24 * 60 * 60 * 1000) })
    }
  }

  const total = await prisma.user.count({ where })
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize))
  const page = Math.min(query.page, pageCount)

  const users = await prisma.user.findMany({
    where,
    // El id desempata para que el orden sea estable entre páginas
    // "nulls" solo existe en columnas opcionales; quienes nunca iniciaron sesión van al final
    orderBy: [
      query.sort === "lastLoginAt" ? { lastLoginAt: { sort: query.dir, nulls: "last" } } : { [query.sort]: query.dir },
      { id: "asc" }
    ],
    skip: (page - 1) * query.pageSize,
    take: query.pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      createdAt: true,
      lastLoginAt: true,
      accounts: { select: { providerId: true } }
    }
  })

  const memberships = await prisma.tripMember.groupBy({
    by: ["userId", "role"],
    where: { userId: { in: users.map((user) => user.id) } },
    _count: { _all: true }
  })

  const countFor = (userId: string, role: "OWNER" | "MEMBER") =>
    memberships.find((item) => item.userId === userId && item.role === role)?._count._all ?? 0

  return {
    query: { ...query, page },
    total,
    pageCount,
    rows: users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      emailVerified: user.emailVerified,
      providers: [...new Set(user.accounts.map((account) => account.providerId))],
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdTrips: countFor(user.id, "OWNER"),
      invitedTrips: countFor(user.id, "MEMBER")
    }))
  }
}
