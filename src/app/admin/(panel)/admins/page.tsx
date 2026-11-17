import { AdminsManager } from "@/components/admin/admins-manager"
import type { AdminListItem } from "@/features/admin/admins-types"
import { requireSuperAdmin } from "@/lib/admin/session"
import { prisma } from "@/lib/prisma/client"

export default async function AdminAdminsPage() {
  const { admin } = await requireSuperAdmin()

  const admins = await prisma.adminUser.findMany({
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    select: { id: true, name: true, email: true, role: true, active: true, lastLoginAt: true, createdAt: true }
  })

  const items: AdminListItem[] = admins.map((item) => ({
    ...item,
    lastLoginAt: item.lastLoginAt?.toISOString() ?? null,
    createdAt: item.createdAt.toISOString()
  }))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administradores</h1>
        <p className="text-muted-foreground">Quién tiene acceso a este panel.</p>
      </div>

      <AdminsManager admins={items} currentAdminId={admin.id} />
    </div>
  )
}
