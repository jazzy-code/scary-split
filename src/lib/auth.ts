import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"

import { prisma } from "./prisma/client"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql"
  }),
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  onAPIError: {
    // Los errores de OAuth (por ejemplo account_not_linked) llegan aquí en lugar de la página genérica de Better Auth
    errorURL: `${process.env.BETTER_AUTH_URL}/auth/error`
  },
  emailAndPassword: {
    enabled: true
  },
  user: {
    deleteUser: {
      enabled: true,
      // Los sustitos donde el usuario es el único miembro quedarían huérfanos, así que se eliminan con la cuenta.
      beforeDelete: async (user) => {
        await prisma.trip.deleteMany({
          where: {
            members: {
              some: { userId: user.id },
              every: { userId: user.id }
            }
          }
        })
      }
    }
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!
    }
  }
})
