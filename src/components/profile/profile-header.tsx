import Image from "next/image"
import { BadgeCheck, CalendarDays, Receipt } from "lucide-react"

import { Drip } from "@/components/trips/drip"
import type { ProfileUser } from "@/features/profile/types"

import { UserAvatar } from "./user-avatar"

type ProfileHeaderProps = {
  user: ProfileUser
  hasGoogle: boolean
  tripCount: number
}

export function ProfileHeader({ user, hasGoogle, tripCount }: ProfileHeaderProps) {
  const memberSince = new Date(user.createdAt).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#24124d] via-[#4a2a8f] to-[#8b5cf6] p-6 text-white shadow-lg ring-1 ring-black/10 md:p-8">
      <Drip color="#c4b5fd" className="h-20 w-36 md:h-24 md:w-44" />

      <Image
        src="/scary-split-logo.png"
        alt=""
        width={200}
        height={200}
        className="pointer-events-none absolute -right-4 -bottom-6 hidden size-44 rotate-6 opacity-25 md:block"
      />

      <div className="relative flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <UserAvatar name={user.name} image={user.image} className="size-24 text-4xl ring-4 ring-white/30" />

        <div className="min-w-0">
          <h1 className="truncate text-3xl font-bold tracking-tight md:text-4xl">{user.name}</h1>

          <p className="truncate text-white/80">{user.email}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs font-medium sm:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              <CalendarDays className="size-3.5" />
              Miembro desde {memberSince}
            </span>

            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur-sm">
              <Receipt className="size-3.5" />
              {tripCount} {tripCount === 1 ? "sustito" : "sustitos"}
            </span>

            {user.emailVerified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400 px-2.5 py-1 font-bold text-emerald-950">
                <BadgeCheck className="size-3.5" />
                Correo verificado
              </span>
            )}

            {hasGoogle && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 font-semibold text-[#24124d]">
                <Image src="/google-icon.png" alt="" width={14} height={14} />
                Cuenta de Google
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
