import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg"

import { PrismaClient } from "../src/generated/prisma/client"
import { hashPassword } from "../src/lib/admin/password"

// Uso: ADMIN_SEED_PASSWORD="..." pnpm admin:seed
// Crea o actualiza al super admin. La contraseña nunca queda guardada en el código.
async function main() {
  const email = (process.env.ADMIN_SEED_EMAIL ?? "admin@scarysplit.com").trim().toLowerCase()
  const name = process.env.ADMIN_SEED_NAME ?? "Super Admin"
  const password = process.env.ADMIN_SEED_PASSWORD

  if (!password || password.length < 12) {
    throw new Error("Define ADMIN_SEED_PASSWORD con al menos 12 caracteres")
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

  try {
    const passwordHash = await hashPassword(password)

    await prisma.adminUser.upsert({
      where: { email },
      create: { email, name, passwordHash, role: "SUPER_ADMIN" },
      update: { passwordHash, role: "SUPER_ADMIN", active: true, failedLogins: 0, lockedUntil: null }
    })

    console.log(`Super admin listo: ${email}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
