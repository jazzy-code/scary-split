import type { Metadata } from "next"

import { getInviteInfoAction } from "@/features/members/actions"
import { getCurrentSession } from "@/lib/auth-utils"

import InviteClient from "./invite-client"

export const metadata: Metadata = {
  title: "Invitación",
  description: "Te invitaron a un sustito en Scary Split. Únete para ver los gastos y cuánto debes o te deben.",
  robots: { index: false, follow: false }
}

type InvitePageProps = {
  params: Promise<{
    token: string
  }>
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params

  const [info, session] = await Promise.all([getInviteInfoAction(token), getCurrentSession()])

  return <InviteClient token={token} info={info} isSignedIn={!!session} />
}
