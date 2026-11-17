import Image from "next/image"
import { LogOut } from "lucide-react"

import { AdminNav } from "@/components/admin/admin-nav"
import { Button } from "@/components/ui/button"
import { logoutAdminAction } from "@/features/admin/auth-actions"
import { requireAdmin } from "@/lib/admin/session"

export default async function AdminPanelLayout({ children }: LayoutProps<"/admin">) {
  const { admin } = await requireAdmin()

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between bg-[#24124d] px-4 text-white md:px-8">
        <div className="flex items-center gap-2">
          <Image src="/scary-split-logo.png" alt="Scary Split" width={32} height={32} />

          <span className="font-heading text-xl font-bold tracking-tight">Scary Split</span>

          <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold">Admin</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 sm:inline">{admin.email}</span>

          <form action={logoutAdminAction}>
            <Button type="submit" variant="ghost" size="sm" className="text-white hover:bg-white/15 hover:text-white">
              <LogOut />
              Salir
            </Button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 md:flex-row md:gap-8 md:p-8">
        <aside className="md:w-52 md:shrink-0">
          <AdminNav isSuperAdmin={admin.role === "SUPER_ADMIN"} />
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  )
}
