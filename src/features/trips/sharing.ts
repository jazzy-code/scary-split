import { createHash, randomBytes } from "crypto"

import { prisma } from "@/lib/prisma/client"

export function createShareToken() {
  return randomBytes(32).toString("base64url")
}

function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createTripShare(tripId: string) {
  const token = createShareToken()
  const tokenHash = hashShareToken(token)

  await prisma.tripShare.create({
    data: {
      tripId,
      tokenHash
    }
  })

  return token
}

export async function hasValidTripShare(tripId: string, token: string) {
  const tokenHash = hashShareToken(token)

  const share = await prisma.tripShare.findFirst({
    where: {
      tripId,
      tokenHash
    },
    select: {
      id: true
    }
  })

  return !!share
}
