import { requireSuperAdmin } from "@/lib/admin/session"

export default async function AdminAdminsPage() {
  await requireSuperAdmin()

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold tracking-tight">Administradores</h1>
      <p className="text-muted-foreground">Próximamente.</p>
    </div>
  )
}
