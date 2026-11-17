// Sin imports de servidor: lo usan también los componentes del navegador

export const ADMIN_PASSWORD_MIN_LENGTH = 12

export type AdminListItem = {
  id: string
  name: string
  email: string
  role: "SUPER_ADMIN" | "ADMIN"
  active: boolean
  lastLoginAt: string | null
  createdAt: string
}

export type AdminActionResult = { ok: true } | { ok: false; message: string }
