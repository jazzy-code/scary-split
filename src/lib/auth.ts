import { betterAuth } from "better-auth"
import { prismaAdapter } from "@better-auth/prisma-adapter"

import { sendEmail } from "./email/send-email"
import { resetPasswordEmail, verificationEmail } from "./email/templates"
import { prepareAccountDeletion } from "@/features/members/service"
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
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...verificationEmail({ name: user.name, url }) })
    }
  },
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({ to: user.email, ...resetPasswordEmail({ name: user.name, url }) })
    }
  },
  user: {
    deleteUser: {
      enabled: true,
      beforeDelete: async (user) => {
        await prepareAccountDeletion(user.id)
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
