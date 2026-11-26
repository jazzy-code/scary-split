import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { getProfileAction } from "@/features/profile/actions"

import ProfilePageClient from "./profile-page-client"

export const metadata: Metadata = {
  title: "Mi perfil",
  robots: { index: false, follow: false }
}

export default async function ProfilePage() {
  const profile = await getProfileAction()

  if (!profile) {
    redirect("/")
  }

  return <ProfilePageClient {...profile} />
}
