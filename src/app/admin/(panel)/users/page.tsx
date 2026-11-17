import { UsersTable } from "@/components/admin/users-table"
import { listUsers } from "@/features/admin/users"

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const data = await listUsers(await searchParams)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
        <p className="text-muted-foreground">Quién usa la app y cuántos sustitos tiene cada quien. Solo lectura.</p>
      </div>

      <UsersTable data={data} />
    </div>
  )
}
