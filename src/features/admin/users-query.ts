import { z } from "zod"

// Sin imports de servidor: lo usan tanto la consulta como la tabla del navegador

export const PAGE_SIZES = [10, 25, 50] as const
export const SORT_COLUMNS = ["name", "email", "createdAt", "lastLoginAt"] as const

const dateParam = z.iso.date().optional().catch(undefined)

const searchSchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  provider: z.enum(["all", "credential", "google"]).catch("all"),
  sort: z.enum(SORT_COLUMNS).catch("createdAt"),
  dir: z.enum(["asc", "desc"]).catch("desc"),
  page: z.coerce.number().int().min(1).catch(1),
  pageSize: z.coerce
    .number()
    .refine((value): value is (typeof PAGE_SIZES)[number] => (PAGE_SIZES as readonly number[]).includes(value))
    .catch(10),
  from: dateParam,
  to: dateParam
})

export type UsersQuery = z.infer<typeof searchSchema>

export type AdminUserRow = {
  id: string
  name: string
  email: string
  image: string | null
  emailVerified: boolean
  providers: string[]
  createdAt: string
  lastLoginAt: string | null
  createdTrips: number
  invitedTrips: number
}

export type UsersPage = {
  query: UsersQuery
  rows: AdminUserRow[]
  total: number
  pageCount: number
}

export function parseUsersQuery(params: Record<string, string | string[] | undefined>): UsersQuery {
  const flat = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [key, Array.isArray(value) ? value[0] : value])
  )

  return searchSchema.parse(flat)
}
