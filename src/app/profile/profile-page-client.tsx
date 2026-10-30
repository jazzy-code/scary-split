"use client"

import { DangerZoneCard } from "@/components/profile/danger-zone-card"
import { LinkedAccountsCard } from "@/components/profile/linked-accounts-card"
import { PersonalInfoCard } from "@/components/profile/personal-info-card"
import { ProfileHeader } from "@/components/profile/profile-header"
import { SecurityCard } from "@/components/profile/security-card"
import { VerifyEmailNotice } from "@/components/profile/verify-email-notice"
import type { ProfileUser } from "@/features/profile/types"

type ProfilePageClientProps = {
  user: ProfileUser
  providers: string[]
  tripCount: number
}

export default function ProfilePageClient({ user, providers, tripCount }: ProfilePageClientProps) {
  const hasGoogle = providers.includes("google")
  const hasPassword = providers.includes("credential")

  return (
    <main className="min-h-screen px-4 py-4 md:py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <ProfileHeader user={user} hasGoogle={hasGoogle} tripCount={tripCount} />

        {!user.emailVerified && <VerifyEmailNotice email={user.email} />}

        <PersonalInfoCard user={user} hasGoogle={hasGoogle} />

        <LinkedAccountsCard hasGoogle={hasGoogle} hasPassword={hasPassword} />

        <SecurityCard hasPassword={hasPassword} />

        <DangerZoneCard hasPassword={hasPassword} />
      </div>
    </main>
  )
}
