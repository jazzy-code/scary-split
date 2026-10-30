"use server"

import { getCurrentSession } from "@/lib/auth-utils"
import { prisma } from "@/lib/prisma/client"

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
